const spawn = require('child_process').spawn;
const PassThrough = require('stream').PassThrough;

const a = spawn('echo', ['hi user']);
const b = new PassThrough();
const c = new PassThrough();

a.stdout.pipe(b);
a.stdout.pipe(c);

let count = 0;
b.on('data', function (chunk) {
    setTimeout(() => {
        count += chunk.length;

    }, 1000)
});
b.on('end', function () {
  console.log(count);
  c.pipe(process.stdout);
});

a.stdout.on('data', chunk => {
    console.log(chunk);
})