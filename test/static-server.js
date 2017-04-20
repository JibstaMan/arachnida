module.exports = function()
{
    return new Promise((resolve) => {
        const path = require('path');
        const express = require('express');
        const app = express();

        app.use(express.static(path.join(__dirname, 'fixtures')));

        app.listen(8888, resolve);
    });
};