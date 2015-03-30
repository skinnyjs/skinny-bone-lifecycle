"use strict";

var co = require('co');
var wait = require('co-wait');
var createError = require('create-error');

var GracefulShutdownError = createError('GracefulShutdownError');

function Lifecycle(skinny) {
    this.skinny = skinny;

    this.inShutdownCycle = false;
    this.deadline = 30 * 1000;
}

Lifecycle.prototype.start = function start() {
    co(function *(){
        yield this.skinny.listeners('*initialize');

        this.skinny.emit('start');
    }.bind(this));
};

Lifecycle.prototype.shutdown = function shutdown() {
    co(function *shutdown() {
        if (this.inShutdownCycle) {
            return false;
        }

        this.inShutdownCycle = true;

        this.callTheKiller();

        yield this.skinny.listeners('*shutdown');

        // TODO: Must exit by shutdown. Why?
        process.exit(0);
    }.bind(this));
};

Lifecycle.prototype.callTheKiller = function callTheKiller() {
    var killer = setTimeout(function() {
        co(function *() {
            var error = new GracefulShutdownError('Graceless shutdown after ' + this.deadline + ' milliseconds.');

            this.skinny.emit('error', error);

            // Add some time for async error handlers

            yield wait(3000);

            process.exit(1);
        }.bind(this))
    }.bind(this), this.deadline);

    killer.unref();
};

module.exports = Lifecycle;