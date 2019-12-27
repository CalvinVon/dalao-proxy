module.exports = {
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