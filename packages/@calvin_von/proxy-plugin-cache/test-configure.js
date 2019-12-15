const { parser } = require('./configure');

console.log(parser({
    dirname: 'aadad',
    contentType: {},
    maxAge: ['...', 'M'],
    filters: [
        {
            where: 'body'
        }
    ]
}))