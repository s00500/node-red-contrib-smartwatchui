var inited = false;
var currentElements = [];

module.exports = function(RED) {
    currentElements = [];

    if (!inited) {
        inited = true;
        init(RED.server, RED.httpNode || RED.httpAdmin, RED.log, RED.settings);
    }

    function SmartwatchButtonNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.uicolor = config.uicolor;
        node.uiname = node.name;
        currentElements.push(node);

        node.on('close', function() {
            currentElements.splice(currentElements.findIndex(x => x.id === this.id), 1);
        });
    }
    RED.nodes.registerType('watch-button', SmartwatchButtonNode);
}

function init(server, app, log, redSettings) {
    app.use(join("watchapi", "ui.json"), function(req, res) {
        res.json(servableJson(currentElements));
    });

    app.use(join("watchapi", "trigger"), function(req, res) {
        if (req.query.id == null) {
            res.json({
                "status": "error",
                "message": "no id set"
            });
        }

        if (currentElements.findIndex(x => x.id == req.query.id) === -1) {
            res.json({
                "status": "error",
                "message": "No such Id"
            });
            return;
        }

        currentElements[currentElements.findIndex(x => x.id === req.query.id)].send({
            "payload": currentElements[currentElements.findIndex(x => x.id === req.query.id)].name
        });

        res.json({
            "status": "ok"
        });

    });

    log.info("WatchAPI ready!");
}

function join() {
    var trimRegex = new RegExp('^\\/|\\/$', 'g'),
        paths = Array.prototype.slice.call(arguments);
    return '/' + paths.map(function(e) {
        return e.replace(trimRegex, "");
    }).filter(function(e) {
        return e;
    }).join('/');
}

function servableJson(elements) {
    var allowedKeys = {
        id: null,
        type: null,
        name: null,
        uiname: null,
        uicolor: null
    };

    return elements.map(function(node, index) {
        return Object.keys(allowedKeys).reduce(function(obj, key) {
            obj[key] = node[key];
            return obj;
        }, {});
    });
}
