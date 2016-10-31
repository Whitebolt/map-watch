/* jshint node: true, mocha: true */
/* global chai */


'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const packageInfo = require('../package.json');
const jsDoc = require('./index.json');
const chai = require('chai');
const assert = chai.assert;
const WatchMap = require('../');


/**
 * Generate a description for a describe clause using the info in an object.
 *
 * @private
 * @param {Object} items        The object to get a description from.
 * @param {string} [itemName]   If supplied the property of items to get from.
 * @returns {string}
 */
function describeItem(items, itemName) {
	try {
		if (itemName) return items[itemName].name + '(): ' + items[itemName].description;
		return items.name + ': ' + items.description;
	} catch(err) {
		throw new SyntaxError('Could not find the requested item: ' + itemName);
	}
}


describe(describeItem(packageInfo), ()=>{
	describe(describeItem(jsDoc, 'WatchMap#watch'), ()=>{
		it('Adding a watcher should add a watch to given key.', ()=>{
			const map = new WatchMap();
			map.watch('TEST', ()=>{});
			map.watch('TEST', ()=>{});
			map.watch('TEST', ()=>{});
			assert.equal(map.countWatchers('TEST'), 3);
		});


		it('Adding a watcher should return an unwatch function, unwatch(), should unwatch.', ()=>{
			const map = new WatchMap();
			let count = 0;
			let unwatch1 = map.watch('TEST', ()=>count+=2);
			assert.isFunction(unwatch1);
			let unwatch2 = map.watch('TEST', ()=>count+=1);
			let unwatch3 = map.watch('TEST', ()=>count+=2);
			assert.equal(map.countWatchers('TEST'), 3);
			unwatch2();
			assert.equal(map.countWatchers('TEST'), 2);
			map.set('TEST', 5);
			assert.equal(count, 4);
		});

		it('Set watchers should fire when watched value is set.', ()=>{
			const map = new WatchMap();
			let count = 0;
			map.watch('TEST', ()=>count++);
			map.set('TEST', 5);
			map.set('TEST', 4);
			map.set('TEST', 3);
			assert.equal(count, 3);
		});

		it('Set watchers should only fire when watched value changes.', ()=>{
			const map = new WatchMap();
			let count = 0;
			map.watch('TEST', ()=>count++);
			map.set('TEST', 5);
			map.set('TEST', 4);
			map.set('TEST', 4);
			map.set('TEST', 4);
			map.set('TEST', 3);
			assert.equal(count, 3);
		});

		it('Set watchers should fire with the old and new values', ()=>{
			const map = new WatchMap();
			let count = 0;
			map.watch('TEST', (value, oldValue)=>{
				if (count === 0) {
					assert.equal(value, 1);
					assert.isUndefined(oldValue);
				} else if (count === 1) {
					assert.equal(value, 5);
					assert.equal(oldValue, 1);
				} else if (count === 2) {
					assert.equal(value, 2);
					assert.equal(oldValue, 5);
				} else if (count === 4) {
					assert.isUndefined(value);
					assert.equal(oldValue, 2);
				}

				count++;
			});
			map.set('TEST', 1);
			map.set('TEST', 5);
			map.set('TEST', 2);
			map.delete('TEST');
		});
	});

	describe(describeItem(jsDoc, 'WatchMap#once'), ()=>{
		it('Adding a watcher via once should only fire once.', ()=>{
			const map = new WatchMap();
			let count = 0;
			map.once('TEST', ()=>count++);
			map.set('TEST', 5);
			map.set('TEST', 4);
			map.set('TEST', 3);
			assert.equal(count, 1);
		});

		it('Adding a watcher should add a watch to given key.', ()=>{
			const map = new WatchMap();
			map.once('TEST', ()=>{});
			map.once('TEST', ()=>{});
			map.once('TEST', ()=>{});
			assert.equal(map.countWatchers('TEST'), 3);
		});

		it('Adding a watcher should return a working unwatch.', ()=>{
			const map = new WatchMap();
			let count = 0;
			let unwatch1 = map.once('TEST', ()=>count+=2);
			assert.isFunction(unwatch1);
			let unwatch2 = map.once('TEST', ()=>count+=1);
			let unwatch3 = map.once('TEST', ()=>count+=2);
			assert.equal(map.countWatchers('TEST'), 3);
			unwatch2();
			assert.equal(map.countWatchers('TEST'), 2);
			map.set('TEST', 5);
			assert.equal(count, 4);
		});
	});

	describe(describeItem(jsDoc, 'WatchMap#countWatchers'), ()=>{
		it('Adding a watcher should increase the countWatchers count.', ()=>{
			const map = new WatchMap();
			assert.equal(map.countWatchers('TEST'), 0);
			map.once('TEST', ()=>{});
			assert.equal(map.countWatchers('TEST'), 1);
			map.once('TEST', ()=>{});
			assert.equal(map.countWatchers('TEST'), 2);
			let unwatch = map.watch('TEST', ()=>{});
			assert.equal(map.countWatchers('TEST'), 3);
			unwatch();
			assert.equal(map.countWatchers('TEST'), 2);
			map.once('TEST2', ()=>{});
			assert.equal(map.countWatchers('TEST'), 2);
			assert.equal(map.countWatchers('TEST2'), 1);
		});
	});
});


