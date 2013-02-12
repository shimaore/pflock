# Pflock

![Build status](https://api.travis-ci.org/manuelstofer/pflock.png)

![Pfock](https://raw.github.com/manuelstofer/pflock/master/resources/pflock.jpg)

Pflock is a [component](http://github.com/component/) for binding data to a input
fields, content editables etc.

It works in both directions. When the data changes Pflock
can update the document and the other way around.

[Demo](http://manuelstofer.github.com/pflock/)

## Installation

```
$ component install manuelstofer/pflock
```

## Bindings
Pflock is template language agnostic. Bindings are done using x-bind attribute.


### Bind value

```HTML
<input type="text" x-bind="value:user.name" />
```

### Bind inner HTML

```HTML
<p contenteditable x-bind="user.description"></p>
```

### Bind attribute

```HTML
<img src="image.jpg" x-bind="src:user.image"/>

```

## Usage

```Javascript
var pflock = require('pflock');
var data = {
  user: {
    name: 'Pflock',
    description: 'two way bindings'
  }
};

var bindings = pflock(document.body, data);
bindings.on('change',  function (path, value) {

});
```

### Backbone models
There is an Adapter to use Pflock with Backbone models: [Backbone-Pflock](http://github.com/manuelstofer/backbone-pflock)
