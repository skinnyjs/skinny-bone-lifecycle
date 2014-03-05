var co = require('co');
var wait = require('co-wait');
var createError = require('create-error');

var GracefulShutdownError = createError('GracefulShutdownError');

function Lifecycle(skinny) {
    "use strict";

    this.skinny = skinny;

    this.inShutdownCycle = false;
    this.deadline = 30 * 1000;
}

Lifecycle.prototype.start = function start() {
    "use strict";

    co(function*(){
        yield this.skinny.listeners('*initialize');

        this.skinny.emit('start');
    }).call(this);
};

Lifecycle.prototype.shutdown = function shutdown() {
    "use strict";

    co(function *shutdown() {
        if (this.inShutdownCycle) {
            return false;
        }

        this.inShutdownCycle = true;

        this.callTheKiller();

        yield this.skinny.listeners('*shutdown');

        // TODO: Must exit by shutdown. Why?
        process.exit(0);
    }).call(this);
};

Lifecycle.prototype.callTheKiller = function callTheKiller() {
    "use strict";

    var killer = setTimeout(co(function *() {
        var error = new GracefulShutdownError('Graceless shutdown after ' + this.deadline + ' milliseconds.');

        this.skinny.emit('error', error);

        // Add some time for async error handlers

        yield wait(3000);

        process.exit(1);
    }).bind(this), this.deadline);

    killer.unref();
};

module.exports = Lifecycle;