const testServer = require('./unit/server');

testServer.start();

require('./unit/normalize');
require('./unit/scraper-basics');
require('./unit/scraper-filter');
require('./unit/scraper-follow');
require('./unit/config');
require('./unit/session');

testServer.stop();

// Docs were just to see whether the examples work
// require('./unit/doc');
