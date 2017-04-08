'use strict';

let test = require('tape'),
    webScraper = require('../../lib/index');

test('Scraper', function(nest)
{
    nest.test('text', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/title/tt3498820/",
            data: {
                title: '.title_wrapper h1',
                jibberish: '.gobbledygook'
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                title: 'Captain America: Civil War (2016)',
                jibberish: ''
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('url', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/title/tt3498820/",
            data: {
                poster: ".poster a"
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                poster: 'http://www.imdb.com/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i'
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('string', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/title/tt3498820/",
            data: '.title_wrapper h1'
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = 'Captain America: Civil War (2016)';
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('object', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/title/tt3498820/",
            data: {
                image: {
                    _elem: ".poster a",
                    link: 'href'
                }
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                image: {
                    link: 'http://www.imdb.com/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i'
                }
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('nested object', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/title/tt3498820/",
            data: {
                show: {
                    title: '.title_wrapper h1',
                    link: ".poster a",
                    description: '.summary_text'
                }
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                show: {
                    title: 'Captain America: Civil War (2016)',
                    link: 'http://www.imdb.com/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i',
                    description: "Political interference in the Avengers' activities causes a rift between former allies Captain America and Iron Man."
                }
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('array', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/title/tt3498820/",
            data: {
                cast: ['.cast_list span.itemprop']
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                cast: [
                    'Chris Evans',
                    'Robert Downey Jr.',
                    'Scarlett Johansson',
                    'Sebastian Stan',
                    'Anthony Mackie',
                    'Don Cheadle',
                    'Jeremy Renner',
                    'Chadwick Boseman',
                    'Paul Bettany',
                    'Elizabeth Olsen',
                    'Paul Rudd',
                    'Emily VanCamp',
                    'Tom Holland',
                    'Daniel Brühl',
                    'Frank Grillo'
                ]
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('array object', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/search/title?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature",
            data: {
                titles: [{
                    _elem: ".lister-item-header > a",
                    _value: 'text'
                }]
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                titles: [
                    'David Knight: Iron Man of Enduro',
                    'The Iron Man',
                    'Iron Man',
                    'Iron Man 2',
                    'The Man with the Iron Fists',
                    'Adam Ahani',
                    'Iron Man Three',
                ]
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('array objects', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/search/title?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature",
            data: {
                shows: [{
                    _elem: '.lister-list .lister-item-content',
                    title: {
                        _elem: ".lister-item-header > a",
                        _value: 'text'
                    },
                    year: '.lister-item-header .lister-item-year'
                }]
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                shows: [
                    {
                        title: 'David Knight: Iron Man of Enduro',
                        year: '(2004)'
                    },
                    {
                        title: 'The Iron Man',
                        year: '(2006)'
                    },
                    {
                        title: 'Iron Man',
                        year: '(2008)'
                    },
                    {
                        title: 'Iron Man 2',
                        year: '(2010)'
                    },
                    {
                        title: 'The Man with the Iron Fists',
                        year: '(2012)'
                    },
                    {
                        title: 'Adam Ahani',
                        year: '(2012)'
                    },
                    {
                        title: 'Iron Man Three',
                        year: '(2013)'
                    },
                ]
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('array follow', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/search/title?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature",
            data: {
                titles: [{
                    _elem: ".lister-list .lister-item-header > a",
                    _follow: '.title_wrapper h1'
                }]
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                titles: [
                    'David Knight: Iron Man of Enduro (2004)',
                    'The Iron Man (2006)',
                    'Iron Man (2008)',
                    'Iron Man 2 (2010)',
                    'The Man with the Iron Fists (2012)',
                    'Adam Ahani (2012)',
                    'Iron Man Three (2013)',
                ]
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('array filter', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/search/title?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature",
            data: {
                shows: [{
                    _elem: ".lister-list .lister-item-content",
                    _filter: function(show)
                    {
                        return /^Iron Man($| )/.test(show.title);
                    },
                    title: {
                        // find the text value of the title for filter function
                        _elem: ".lister-item-header > a",
                        _value: 'text'
                    },
                    _follow: {
                        // specify where to find the link to follow.
                        _elem: '.lister-item-header > a',
                        // overwrite the previous title.
                        title: '.title_wrapper h1',
                        // also select the director from the other page
                        director: '[itemprop=director] [itemprop=name]'
                    }
                }]
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                shows: [
                    {
                        title: 'Iron Man (2008)',
                        director: 'Jon Favreau'
                    },
                    {
                        title: 'Iron Man 2 (2010)',
                        director: 'Jon Favreau'
                    },
                    {
                        title: 'Iron Man Three (2013)',
                        director: 'Shane Black'
                    }
                ]
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    });

    nest.test('params', function(assert)
    {
        const data = {
            url: "http://www.imdb.com/search/title?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature",
            data: {
                shows: [{
                    _elem: ".lister-list .lister-item-content",
                    _filter: '{{filter}}',
                    title: {
                        // find the text value of the title for filter function
                        _elem: "{{title}}",
                        _value: 'text'
                    },
                    _follow: {
                        // specify where to find the link to follow.
                        _elem: '{{title}}',
                        // overwrite the previous title.
                        title: '.title_wrapper h1',
                        // also select the director from the other page
                        director: '[itemprop=director] [itemprop=name]'
                    }
                }]
            },
            params: {
                filter: function(show)
                {
                    return /^Iron Man($| )/.test(show.title);
                },
                title: '.lister-item-header > a'
            }
        };

        webScraper(data, function(err, json)
        {
            assert.ifErr(err);

            const actual = json;
            const expected = {
                shows: [
                    {
                        title: 'Iron Man (2008)',
                        director: 'Jon Favreau'
                    },
                    {
                        title: 'Iron Man 2 (2010)',
                        director: 'Jon Favreau'
                    },
                    {
                        title: 'Iron Man Three (2013)',
                        director: 'Shane Black'
                    }
                ]
            };
            assert.deepEqual(actual, expected);
            assert.end();
        });
    })
});