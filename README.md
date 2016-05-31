# Web Scraper

Makes it easy to scrape the web.

## API

The JSON data specifies what to obtain from the URL. The return value will have mostly the same properties as the input, but with the retrieved values.

### Input

#### String
String values are interpreted as selectors. The default value for the selected element will be returned.

**Default values**

* `href` is returned for `a` or `link`.
* `src` is returned for `img`.
* `text` is returned for all the rest.

#### Object

Objects give more fine-grained control. There are three different scenario's:

1. Attributes
2. Non-default property
3. Nested object

##### Attributes
The selector is specified in a special property called `_elem`. The rest of the object properties will be used to obtain attributes of the selector element.

```javascript
// input:
{
    url: "http://example.com/movie/captain-america-civil-war",
    data: {
        movie: {
            _elem: '.movie',
            id: 'id',
            title: 'data-title',
            likes: 'data-likes'
        }
    }
}

// output:
{
    movie: {
        id: 'main_movie',
        title: 'Captain America: Civil War',
        likes: 12
    }
}   
```

##### Non-default value
If you'd want to retrieve the text of an anchor (`a`) element, you can use the object notation for that as well.

Normally, objects will be nested. Using `_value` will prevent this nesting, simply returning the property specified. 

```javascript
// input:
{
    url: "http://example.com/movie/captain-america-civil-war",
    data: {
        movie: {
            _elem: '.movie a.title',
            _value: 'text'
        }
    }
}

// output:
{
    movie: 'Captain America: Civil War'
}   
```

##### Nesting
When no `_elem` property is present, this is interpreted as a nested object. All properties will be evaluated as if it was a new root data object. However, the JSON will be underneath the key of the object.

```javascript
// input:
{
    url: "http://example.com/movie/captain-america-civil-war",
    data: {
        movie: {
            title: '.movie .title',
            image: '.movie img',
            likes: '.movie .likes span.badge',
        }
    }
}

// output:
{
    movie: {
        title: 'Captain America: Civil War',
        image: 'https://aws.example.com/captain_america/civil_war.png',
        likes: '12'
    }
}
```

#### Array
When you want to retrieve a list, you need to use an array as input. This array has only one element, either a string or object.

##### String
When the element within the array is a string, it specifies the selector used to build the list. The return value will contain a list with the default value for each selected element.

```javascript
// input:
{
    url: "http://example.com/movies",
    data: {
        movies: ['.movie .title']
    }
}

// output:
{
    movies: [
        'Captain America: Civil War',
        'The Avengers Age of Ultron',
        'Iron Man 3'
    ]
}
```

##### Object

If you want more values then just the default value, you can specfy an object. This will function similarly to when an object outside an array is specified, but there's an important difference. The `_elem` value within the object will be used to select multiple elements. The rest of the object properties will be evaluated within these selected elements. So when an selector is specified within the object, it will look within the selected element (using `$.find`).

```javascript
// input:
{
    url: "http://example.com/movies",
    data: {
        movies: [{
            // select all movies
            _elem: '.movie',
            // retrieve the title within the `.movie`
            title: '.title',
            // retrieve a specific data attribute from `.pg-rating`
            pgRating: {
                _elem: '.pg-rating',
                _value: 'data-rating'
            }
        }]
    }
}

// output:
{
    movies: [
        {
            title: 'Captain America: Civil War',
            pgRating: '13'
        }
        {
            title: 'The Avengers Age of Ultron',
            pgRating: '13',
        }
        {
            title: 'Iron Man 3',
            pgRating: '13'
        }
    ]
}
```

##### Follow

A very interesting feature is the ability to follow a link to a differnet page and retrieve values from this page as well. Thes retrieved values are returned within the same object.

```javascript
// input:
{
    url: "http://example.com/search?title=Iron Man",
    data: {
        shows: [{
            _elem: ".movie",
            title: '.title',
            _follow: {
                // selector for the link to follow.
                _elem: ".title a",
                // selector within followed page.
                image: "#big_picture"
            }
        }]
    }
}

// output:
{
    shows: [
        {
            title: "Iron Man" ,
            image: "http://static.example.com/iron-man/main-image.jpg"
        },
        {
            title: "Iron Man 2" ,
            image: "http://static.example.com/iron-man-2/main-image.jpg"
        },
        {
            title: "Iron Man 3" ,
            image: "http://static.example.com/iron-man-3/main-image.jpg"
        },
        {
            title: "The Iron Man",
            image: "http://static.example.com/the-iron-man/main-image.jpg"
        }
    ]
}
```

##### Filter

It is also possible to filter the result, either using a function or an object. This object is used as source for the [`_.isMatch`](https://lodash.com/docs#isMatch) function.

```javascript
{
    url: "http://example.com/search?title=Iron Man",
    data: {
        shows: [{
            // select all movies
            _elem: ".movie", 
            // find these properties
            title: '.title,
            image: 'img',
            rating: {
                _elem: "a",
                _follow: "#main_movie .rating"
            },
            // filter the found elements using this function
            _filter: function(show)
            {
                return /^Iron Man/.test(show.title);
            }
        }]
    }
}

// output:
{
    shows: [
        {
            title: "Iron Man" ,
            image: "http://static.example.com/iron-man/small-image.jpg",
            rating: "8.7"
        },
        {
            title: "Iron Man 2" ,
            image: "http://static.example.com/iron-man-2/small-image.jpg",
            rating: "7.6"
        },
        {
            title: "Iron Man 3" ,
            image: "http://static.example.com/iron-man-3/small-image.jpg",
            rating: "8.4"
        }
    ]
}
```

Filter is especially useful in combination with `_filter`, when following all found elements will increase the amount of HTTP requests performed.

```javascript
{
    url: "http://example.com/search?title=Iron Man",
    data: {
        shows: [{
            // select all movies
            _elem: ".movie", 
            // find these properties
            title: '.title,
            thumb: 'img',
            rating: {
                _elem: "a",
                _follow: "#main_movie .rating"
            },
            // filter the found elements using this function
            _filter: function(show)
            {
                return /^Iron Man/.test(show.title);
            },
            _follow: {
                 // selector for the link to follow.
                 _elem: ".title a",
                 // selector within followed page.
                 image: "#big_picture"
             }
        }]
    }
}

// output:
{
    shows: [
        {
            title: "Iron Man" ,
            thumb: "http://static.example.com/iron-man/small-image.jpg",
            rating: "8.7",
            image: "http://static.example.com/iron-man/main-image.jpg"
        },
        {
            title: "Iron Man 2" ,
            thumb: "http://static.example.com/iron-man-2/small-image.jpg",
            rating: "7.6",
            image: "http://static.example.com/iron-man-2/main-image.jpg"
        },
        {
            title: "Iron Man 3" ,
            thumb: "http://static.example.com/iron-man-3/small-image.jpg",
            rating: "8.4",
            image: "http://static.example.com/iron-man-3/main-image.jpg"
        }
    ]
}
```