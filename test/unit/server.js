const test = require('tape');
const express = require('express');

let server = null;

function start() {
  test('start server', (assert) => {
    const app = express();

    app.use(express.static('test/fixtures'));

    server = app.listen(8888, () => assert.end());
  });
}

function stop() {
  test('stop server', (assert) => {
    server.close();
    assert.end();
  });
}

module.exports = { start, stop };
