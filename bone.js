var Lifecycle = require('./lifecycle');

module.exports = function attachLifecycle(skinny) {
    "use strict";

    skinny.lifecycle = new Lifecycle(skinny);

    skinny.once('error', function() {
        skinny.lifecycle.shutdown();
    });

    process.on('uncaughtException', function uncaughtExceptionHandler(error) {
        skinny.emit('error', error);
    });
};