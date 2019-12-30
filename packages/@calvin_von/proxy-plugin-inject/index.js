const mime = require('mime');
const fs = require('fs');


// consts
const URL_PREFIX = '/__plugin_inject__/';

module.exports = {
    // serve static file
    onRequest(context, next) {
        const { request, response } = context;
        const { rules } = this.config;

        const servesFileMapper = collectServesMapper(rules);

        if (!serveStaticFiles(servesFileMapper).some(condition => condition())) {
            next();
        }

        function collectServesMapper(rules) {
            let mapper = {};
            rules.forEach(rule => {
                const serves = rule.serves;
                mapper = {
                    ...mapper,
                    ...serves
                };
            });
            return mapper;
        }

        function serveStaticFiles(servesMapper) {
            return Object.keys(servesMapper).map(file => {
                const filePath = servesMapper[file];
                return () => {
                    if (request.url === URL_PREFIX + file) {
                        response.setHeader('Content-Type', mime.getType(file.split('.').reverse()[0]));
                        fs.createReadStream(filePath).pipe(response);
                        next('serve static files');
                        return true;
                    }
                }
            });

        }
    },
    onPipeResponse(context, next) {
        const { rules } = this.config;

        context.chunk = context.chunk.toString();
        injectTemplates(rules).forEach(condition => condition());
        next(null, context.chunk);



        function injectTemplates(rules) {
            return rules.map(rule => {
                return () => {
                    if (new RegExp(rule.test).test(context.request.url)) {
                        try {
                            let template = rule.template;
                            if (!template) {
                                template = fs.readFileSync(rule.templateSrc).toString();
                            }
                            template = template.replace(/{{(.+)}}/g, (placeholder, file) => {
                                return URL_PREFIX + file;
                            });
                            const insertEndTag = `</${rule.insert}>`;
                            context.chunk = context.chunk.replace(insertEndTag, template + insertEndTag);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                };
            });

        }
    }
};
