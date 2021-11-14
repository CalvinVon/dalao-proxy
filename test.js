const { spawnSync } = require('child_process');
const path = require('path');


spawnSync('touch', ['./a.txt'], {
  shell: true,
  // uid: 501,
})