const readline = require('readline');
const chalk = require('chalk');
const Menu = require('./menu');

const stdout = process.stdout;
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);


let windowWidth = stdout.columns;
let windowHeight = stdout.rows;
let selected = 0;
let logs = [];
let menu = [];
let options = {};

stdout.on('resize', () => {
    windowWidth = stdout.columns;
    windowHeight = stdout.rows;
});


/**
 * Add keyboard listener
 * @param {Object} opt
 * @param {(item: Menu, menu: [Menu], replaceMenu: (newMenu: [Menu]) => null) => null} opt.onMenuSelect
 * @param {(item: Menu, menu: [Menu], replaceMenu: (newMenu: [Menu]) => null) => null} opt.onMenuBack
 */
function addKeyListener(opt) {
    const {
        onMenuSelect,
        onMenuBack
    } = opt || {};
    process.stdin.on('keypress', (str, key) => {
        function replaceMenu(newMenu) {
            menu = newMenu;
            selected = 0;
            renderFrame();
        }

        if (key && key.ctrl && key.name == 'c') {
            cleanScreen();
            process.exit();
        }

        if (key.name === 'return') {
            onMenuSelect(menu[selected], replaceMenu);
        }
        else if (key.name === 'backspace') {
            onMenuBack(menu[selected], replaceMenu);
        }
        else if (key.name === 'down') {
            selected = (selected + 1) % menu.length;
            renderFrame();
        }
        else if (key.name === 'up') {
            selected = selected - 1 < 0 ? menu.length - 1 : selected - 1;
            renderFrame();
        }
    });
}


function renderMenu() {
    for (let index = 0; index < menu.length; index++) {
        const item = menu[index];
        if (index === selected) {
            console.log(chalk.white('●  ') + renderWholeMenu(item) + chalk.underline(renderCurrent(item)));
        }
        else {
            console.log('   ' + renderWholeMenu(item) + renderCurrent(item));
        }
    }

    function renderWholeMenu(menu) {
        const names = [''];
        let item = menu;
        while (item.parent && item.parent.label) {
            names.push(item.parent);
            item = item.parent;
        }
        return names.reverse().join(': ');
    }

    function renderCurrent(menu) {
        let str = menu.toString();
        if (menu.children.length) {
            str += '...';
        }
        return str;
    }
}

function renderLogger() {
    const maxLen = windowHeight - menu.length - 4;
    logs = logs.slice(logs.length - maxLen < 0 ? 0 : logs.length - maxLen);

    logs.forEach(string => {
        console.log(string);
    });
}

function renderDivider(title, opt) {
    const {
        prefix = '=',
        divider = '-',
        gap = ' ',
        color
    } = opt || {};

    const _prefix = prefix.repeat(2);
    const boundary = windowWidth - title.length - _prefix.length - gap.length * 2;
    stdout.write([_prefix, color ? color(title) : title, divider.repeat(boundary)].join(gap));
}

function cleanScreen() {
    readline.cursorTo(stdout, 0, 0);
    readline.clearScreenDown(stdout);
}

function renderFrame() {
    cleanScreen();

    renderDivider('Commands:');
    renderDivider('(use Up, Down, Enter and Backspace keys to control)', { color: chalk.grey, divider: ' ', prefix: ' ' });
    renderMenu();
    renderDivider('Logs:');
    renderLogger();
}


/**
 * Render start
 * @param {Menu[]} menuList
 * @param {Object} opt
 * @param {(item: Menu, menu: [Menu], replaceMenu: (newMenu: [Menu]) => null) => null} opt.onMenuSelect
 * @param {(item: Menu, menu: [Menu], replaceMenu: (newMenu: [Menu]) => null) => null} opt.onMenuBack
 */
function run(opt) {
    addKeyListener(opt);
    renderFrame();
}


function render(line) {
    const maxWidth = windowWidth + options.render.compensate;
    if (line.length > maxWidth) {
        let sliceStart = 0;
        while (sliceStart < line.length) {
            logs.push(line.slice(sliceStart, sliceStart + maxWidth));
            sliceStart += maxWidth;
        }
    }
    else {
        logs.push(line);
    }
    renderFrame();
};

const Renderer = module.exports = {
    setOptions: opts => options = opts,
    setMenu: menuList => menu = menuList,
    run,
    render,
    colors: []
};

[
    'cyan',
    'blue',
    'magenta',
    'green',
    'grey',
    'yellow',
    'gray',
].forEach(color => {
    const renderWithColor = line => {
        render(chalk[color](line));
    };
    Renderer.colors.push(chalk[color]);
    Renderer[color] = renderWithColor;
});
