module.exports = {
    rules: [
        {
            test: '(/|(\.html))$',
            serves: {
                'eruda.js': require.resolve('eruda')
            },
            template: `
                <script src="{{eruda.js}}"></script>
                <script>window.eruda.init();</script>
            `,
            insert: 'body'
        }
    ]
}