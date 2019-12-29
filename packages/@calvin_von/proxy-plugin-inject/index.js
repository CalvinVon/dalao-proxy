const mime = require('mime');
const fs = require('fs');

module.exports = {
    onRequest(context, next) {
        const { request, response } = context;

        function serveStaticFiles(fileMapper) {
            const conditions = Object.keys(fileMapper).map(file => {
                return () => {
                    if (request.url === '/_inject/' + file) {
                        response.setHeader('Content-Type', mime.getType(file.split('.')[1]));
                        fs.createReadStream(require.resolve('eruda')).pipe(response);
                        next('serve static files');
                    }
                }
            });
        }
    },
    onPipeRequest(context, next) {
        if (context.request.url === '/api/customer/homePageProductPage') {
            const chunk = context.chunk.toString() + JSON.stringify({ "pageNum": 2, "pageSize": 1 });
            next(null, chunk);
        }
        else {
            next(null, context.chunk);
        }
    },
    onPipeResponse(context, next) {
        if (context.request.url === '/') {
            const script = '<script>alert(\'lifenmgwei shabi\')</script>';
            const chunk = context.chunk.toString().replace('</body>', script + '</body>');
            next(null, chunk);
        }
        else {
            next(null, context.chunk);
        }
    }
};
