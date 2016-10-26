'use strict';

let _private = new WeakMap();

function _getPrivate(self) {
	if (!_private.has(self)) _private.set(self, new Map());
	return _private.get(self);
}

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
		_callback=>_callback.callback(value, oldValue)
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

module.exports = class WatchMap extends Map {
	constructor(iterable) {
		super(iterable);
		_getPrivate(this);
	}

	set(key, value) {
		_getPrivateMap(this, 'previous').set(key, this.get(key));
		_fire(this, key, value);
		return super.set(key, value);
	}

	delete(key) {
		let _private = _getPrivateMap(this, 'previous');
		if (_private.has(key)) _private.delete(key);
		return super.delete(key);
	}

	watch(key, callback) {
		let watchers = _getPrivateMap(this, 'watchers');
		if (!watchers.has(key)) watchers.set(key, []);
		let _watcers = watchers.get(key);
		let id = _randomString();
		let _callback = {callback, id};
		_watcers.push(_callback);
		watchers.set(key, _watcers);

		return ()=>{
			if (watchers.has(key)) {
				watchers.set(
					key,
					watchers.get(key).filter(_callback=>(_callback.id !== id))
				);
			}
		};
	}

	once(key, callback, always=false) {
		if (always && this.has(key)) {
			callback(this.get(key), _getPrivateMap(this, 'previous').get(key));
		} else {
			const unset = this.watch(key, (value, oldValue)=>{
				callback(value, oldValue);
				unset();
			});
		}
	}

	countWatchers(key) {
		return (_getPrivateMap(this, 'watchers').get(key) || []).length;
	}
};