const chalk = require('chalk');

module.exports = class Menu {
    constructor(label) {
        this.label = label;
        this.children = [];
        this.parent = null;
        this.action = null;
    }

    addChild(label, action) {
        if (label instanceof Menu) {
            label.parent = this;
            label.action = action;
            this.children.push(label);
        }
        else {
            const child = new Menu(label);
            child.parent = this;
            child.action = action;
            this.children.push(child);
        }
        return this;
    }

    addStartChild(action) {
        return this.addChild(chalk.green('start process'), action);
    }

    addStopChild(action) {
        return this.addChild(chalk.red('stop process'), action);
    }

    toString() {
        return this.label;
    }
}
