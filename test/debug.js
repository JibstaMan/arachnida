const webScraper = require('../lib/index');

const express = require('express');
const app = express();

const url = 'http://localhost:8888';

app.use(express.static('test/fixtures'));

const server = app.listen(8888, () => {

    const data = {
        url: `${url}/search/title.html?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature`,
        data: {
            titles: [{
                _elem: ".lister-list .lister-item-header > a",
                _follow: '.title_wrapper h1',
            }]
        }
    };

    webScraper(data, function(err, json)
    {
        if (err) {
            return console.error(err);
        }

        console.log(JSON.stringify(json, null, 2));
        server.close();
    });

});