const test = require('tape');
const testServer = require('../test-server');

let server = null;

function start() {
  test('start server', (assert) => {
    testServer()
      .then((startedServer) => {
        server = startedServer;
        assert.end();
      });
  });
}

function stop() {
  test('stop server', (assert) => {
    server.close();
    assert.end();
  });
}

module.exports = { start, stop };
