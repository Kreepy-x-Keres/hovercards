var _               = require('underscore');
var combineReducers = require('redux').combineReducers;
var handleAction    = require('redux-actions').handleAction;

var actions = require('./actions.common'); // TODO webpack/webpack#2801
var browser = require('../extension/browser');
var config  = require('../extension/config');

module.exports = (function optionsReducer(object, prefix) {
	prefix = prefix || '';
	return combineReducers(_.mapObject(object, function(value, key) {
		var prefixKey = prefix + key;
		return (_.isObject(value) && !_.isArray(value)) ?
			optionsReducer(value, prefixKey + '.') :
			handleAction(
				'SET_OPTION',
				{
					next: function(state, action) {
						if (action.payload.key !== prefixKey) {
							return state;
						}
						browser.storage.sync.set({ ['options.' + prefixKey]: action.payload.value });
						return (action.payload.value === undefined) ? null : action.payload.value;
					}
					// FIXME #9
				},
				value
			);
	}));
})(_.omit(config.options, 'keys'));

module.exports.attachStore = function(store) {
	// Migrate disabled.API.TYPE to !options.API.TYPE.enabled
	browser.storage.sync.get(null).then(function(items) {
		if (items.disabled) {
			['imgur', 'instagram', 'reddit', 'soundcloud', 'twitter', 'youtube'].forEach(function(integration) {
				if (!items.disabled[integration]) {
					return;
				}
				['content', 'account'].forEach(function(type) {
					if (!items.disabled[integration][type]) {
						return;
					}
					store.dispatch(actions.setOption([integration, type, 'enabled'].join('.'), !items.disabled[integration][type]));
				});
			});
			browser.storage.sync.remove('disabled');
		}
		_.pairs(items).forEach(function(entry) {
			var key = entry[0].match(/^options\.(.+)/);
			if (!key) {
				return;
			}
			store.dispatch(actions.setOption(key[1], entry[1]));
		});
	});

	browser.storage.onChanged.addListener(function(changes, areaName) {
		if (areaName !== 'sync') {
			return;
		}
		_.pairs(changes).forEach(function(entry) {
			var key = entry[0].match(/^options\.(.+)/);
			if (!key) {
				return;
			}
			store.dispatch(actions.setOption(key[1], entry[1].newValue));
		});
	});
};
