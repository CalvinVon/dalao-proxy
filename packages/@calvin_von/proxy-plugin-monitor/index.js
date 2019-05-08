const RequestMonitor = require('./app');

let app;

module.exports = {
    beforeCreate() {
        app = RequestMonitor.launchMonitor();
    }
}