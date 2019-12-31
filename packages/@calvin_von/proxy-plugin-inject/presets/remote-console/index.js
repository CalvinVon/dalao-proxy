const path = require('path');

module.exports = {
    rules: [
        {
            test: '(/|(\.html))$',
            serves: {
                'remote-console.js': path.resolve(__dirname, './client.js')
            },
            template: `
                <script src="{{remote-console.js}}"></script>
            `,
            insert: 'body'
        }
    ]
}