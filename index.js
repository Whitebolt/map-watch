'use strict';

let _private = new WeakMap();

/**
 * @typedef WatchMapOptions.
 * @property {boolean} always			If true and value for given key is set
 *										fire the watch straight away.
 * @property {Object} context			Context to assign to callback.
*/

/**
 * Get private map for given object.  If map does not exist, create it. This is
 * useful when you want to have private properties or methods in an ES6 class.
 *
 * @private
 * @param {WatchMap} self	The reference object.
 * @returns {Map}			The private map.
 */
function _getPrivate(self) {
	if (!_private.has(self)) _private.set(self, new Map());
	return _private.get(self);
}

/**
 * Get a map from the private map for given reference object. Basically, private
 * maps for given WatchMap instance.
 *
 * @private
 * @param {WatchMap} self	The reference object.
 * @param {*} key			The key name.
 * @returns {Map}			The private map.
 */
function _getPrivateMap(self, key) {
	let selfPrivate = _getPrivate(self);
	if (!selfPrivate.has(key)) selfPrivate.set(key, new Map());
	return selfPrivate.get(key);
}


/**
 * Fire a specific watcher, firing any registered callbacks for that default.
 *
 * @private
 * @param {WatchMap} self	The WatchMap object we are working on.
 * @param {*} key    		The key to fire watchers for.
 * @param {*} value       	The new old value for that key.
 */
function _fire(self, key, value) {
	let watchers = _getPrivateMap(self, 'watchers');
	let oldValue = self.get(key);
	if (watchers.has(key)) watchers.get(key).forEach(
		_callback=>{
			if (_callback.context) {
				_callback.callback.call(_callback.context, value, oldValue);
			} else {
				_callback.callback(value, oldValue);
			}
		}
	);
}

/**
 * Generate a random string of specified length.
 *
 * @public
 * @param {integer} [length=32] The length of string to return.
 * @returns {string}            The random string.
 */
function _randomString(length=32) {
	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

	if (! length) {
		length = Math.floor(Math.random() * chars.length);
	}

	var str = '';
	for (var i = 0; i < length; i++) {
		str += chars[Math.floor(Math.random() * chars.length)];
	}
	return str;
}

/**
 * Extension of the native JavaScript class, Map.  Has all the parent methods
 * with extra ability of being able to watch and report on changes to values.
 *
 * @note Will not do a deep watch, so if a value is an object, which is
 * modified outside of the set() method defined here, watchers will not be
 * fired.
 *
 * @class
 * @augments Map
 * @type {WatchMap}
 * @param {iterable}	Iterable is an Array or other iterable object whose
 * 						elements are key-value pairs (2-element Arrays). Each
 * 						key-value pair is added to the new Map. null is treated
 * 						as undefined.
 */
module.exports = class WatchMap extends Map {
	constructor(iterable) {
		super(iterable);
		_getPrivate(this);
	}

	/**
	 * Adds or updates an element with a specified key and value to the
	 * WatchMap object.
	 *
	 * @public
	 * @param {*} key		The key of the element to add to the Map object.
	 * @param {*} value		The value of the element to add to the Map object.
	 * @returns {WatchMap}
	 */
	set(key, value) {
		_getPrivateMap(this, 'previous').set(key, this.get(key));
		_fire(this, key, value);
		return super.set(key, value);
	}

	/**
	 * @public
	 * @param {*} key		The key of the element to remove from the
	 * 						WatchMap object.
	 * @returns {boolean}	Returns true if an element in the WatchMap object
	 * 						existed and has been removed, or false if the
	 * 						element does not exist.
	 */
	delete(key) {
		let _private = _getPrivateMap(this, 'previous');
		if (_private.has(key)) _private.delete(key);
		return super.delete(key);
	}

	/**
	 * Set a watcher on the given key.  Will fire the supplied callback every
	 * time the value of the item is changed via set()/delete(). If always is
	 * set then fire straight-away if the item has a value.
	 *
	 * @public
	 * @param {*} key				The item name to watch.
	 * @param {Function} callback	The callback to fire.
	 * @param {WatchMapOptions}		Options for the watch operation.
	 * @returns {Function}			An unwatch function to remove the watcher.
	 */
	watch(key, callback, options={always:false}) {
		let watchers = _getPrivateMap(this, 'watchers');
		if (!watchers.has(key)) watchers.set(key, []);
		let _watcers = watchers.get(key);
		let id = _randomString();
		let _callback = {callback, id, context:options.context};
		_watcers.push(_callback);
		watchers.set(key, _watcers);

		const unwatch = ()=>{
			if (watchers.has(key)) {
				watchers.set(
					key,
					watchers.get(key).filter(_callback=>(_callback.id !== id))
				);
			}
		};

		if (options && options.always && this.has(key)) {
			if (options.context) {
				callback.call(options.context, this.get(key), _getPrivateMap(this, 'previous').get(key), unwatch);
			} else {
				callback(this.get(key), _getPrivateMap(this, 'previous').get(key), unwatch);
			}
		}

		return unwatch;
	}

	/**
	 * Set a watcher on the given key.  Will fire the supplied callback only
	 * once when value of the item is changed via set()/delete(). If always is
	 * set then fire straight-away if the item has a value.
	 *
	 * @public
	 * @param {*} key				The item name to watch.
	 * @param {Function} callback	The callback to fire.
	 * @param {WatchMapOptions}		Options for the watch operation.
	 * @returns {Function}			An unwatch function to remove the watcher.
	 */
	once(key, callback, options={always:false}) {
		let unwatch;
		unwatch = this.watch(key, (value, oldValue, _unwatch)=>{
			if (options && options.context) {
				callback.call(options.context, value, oldValue);
			} else {
				callback(value, oldValue);
			}
			(unwatch||_unwatch)();
		}, options);
		return unwatch;
	}

	/**
	 * Count the watchers assigned to a key.
	 *
	 * @public
	 * @param {*} key		The item to count watchers on.
	 * @returns {integer}	Number of watchers on item.
	 */
	countWatchers(key) {
		return (_getPrivateMap(this, 'watchers').get(key) || []).length;
	}
};