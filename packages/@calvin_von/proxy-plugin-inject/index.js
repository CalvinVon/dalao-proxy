module.exports = {
    onPipeResponse(context, next) {
        next(null, context.chunk);
    }
};