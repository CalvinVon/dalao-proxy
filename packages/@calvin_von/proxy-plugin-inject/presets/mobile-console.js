module.exports = {
    rules: [
        {
            test: '(/|(\.html))$',
            serves: {
                'eruda.js': require.resolve('eruda')
            },
            template: `
                <script src="{{eruda.js}}"></script>
                <script>window.addEventListener('load', window.eruda.init.bind(window.eruda))</script>
            `,
            insert: 'body'
        }
    ]
}