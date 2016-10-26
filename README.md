# Map Watch
A javascript map object that can be watched for changes.

**NB:** Changes are only watched via the map set()/delete() methods. Deep watching of object properties is not good practice but can be achieved through other modules.


## Install

```
npm install map-watch
```

**To save to your** *package.json*

```
npm install --save map-watch
```


## Creating a Map

WatchMap objects are extensions of the native Map class in Javascript.  You can use them in exactly the same way.

```javascript
const WatchMap = require('map-watch');

let map = new WatchMap();

map.set('mykey', 'myvalue');

console.log(map.get('mykey')) // logs 'myvalue' to the console.
```


## Watching items

To watch an item, simply use the *watch()* method.

```javascript
map.watch('mykey', (value, oldValue)={
	console.log(value, oldValue);
});

map.set('mykey', 1); // The console will log: 1 undefined
map.set('mykey', 2); // The console will log: 1 2
```

## Watching once

To watch only the next change (like once() on events).

```javascript
map.once('mykey', (value, oldValue)={
	console.log(value, oldValue);
});

map.set('mykey', 1); // The console will log: 1 undefined
map.set('mykey', 2); // Nothing happens
```

## Always fire

If you need to fire a watch when the value is set or changes *and* fire straight away if already set then you can set the *always* property of the options object.

```javascript
map.set('mykey', 1); // Nothing happens yet as no watchers set

map.once('mykey', (value, oldValue)={
	console.log(value, oldValue); // Never fired as value set before watcher.
});

map.once('mykey', (value, oldValue)={
	console.log(value, oldValue); // Console logs: 1 undefined.
}, {always: true});

```

## Options Object

You can supply and options object to *watch()* and *once()* as defined above.

* **always** *boolean* - Always fire watcher if valuealready set.
* **context** *Object* - Context for callbacks (the *this* applied).


## Count Watchers

You can also count the watchers set on a key by calling *countWatchers()*.

```javascript
map.watch('mykey', (value, oldValue)={
	// Do something
});

map.watch('mykey', (value, oldValue)={
	// Do something
});

map.watch('mykey', (value, oldValue)={
	// Do something
});

console.log(map.countWatchers('myKey')) // Logs 3.
```