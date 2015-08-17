// OrderedItems.Model.js
// ---------------
// A copy of Facets.Model.js but has a comparator to return items in the correct order.
// Connects to the search api to get all the items and the facets
// A Model Contains a Collection of items and the list of facet groups with its values
define('OrderedItems.Model', ['ItemDetails.Collection', 'Session'], function (ItemDetailsCollection, Session)
{
	'use strict';
	
	var original_fetch = Backbone.CachedModel.prototype.fetch;

	return Backbone.CachedModel.extend({
		
		url: function()
		{
			var url = _.addParamsToUrl(
				'/api/items'
			,	_.extend(
					{}
				,	this.searchApiMasterOptions
				,	Session.getSearchApiParams()
				)
			);
			
			return url;
		}

	,	initialize: function (options)
		{
			var application = options.application;
			var modelData = options.modelData || {};
			var ids = modelData.id || "";
			var arrayOfIds = ids.split(',');
			//console.log('arrayOfIds = ' + JSON.stringify(arrayOfIds));
		
			// sets default options for the search api
			this.searchApiMasterOptions = application.getConfig('searchApiMasterOptions.Facets', {});

			// Listen to the change event of the items and converts it to an ItemDetailsCollection
			this.on('change:items', function (model, items)
			{
				if (!(items instanceof ItemDetailsCollection))
				{
					// NOTE: Compact is used to filter null values from response
					model.set('items', new ItemDetailsCollection(_.compact(items)));
				}
				
				//TODO: display current order of items
				/*
				var items = model.get('items');
				var unsortedItemIds = _.map(items.models, function (value) {
					return value.id;
				});
				console.log('OrderItems presort');
				console.log(unsortedItemIds);
				*/
				
				// sort items collection by the order returned from getCategories.  This overrides the default sort order in the item search api.
				items.comparator = function (model) {
					var foundIndex = arrayOfIds.length;
					for (var i = 0; i < arrayOfIds.length; i++) {
						if (model.id == arrayOfIds[i]) {
							foundIndex = i;
							break;
						}
					}
					//console.log('model.id: ' + model.id + ', foundIndex: ' + foundIndex);
					return foundIndex;
				};
				
				/*
				items.on('sort', function (items) {
					//TODO: display sorted order of items.
					var sortedItemIds = _.map(items.models, function (value) {
						return value.id;
					});
					console.log('OrderItems postsort event');
					console.log(sortedItemIds);
				});
				*/
				
				items.sort();
			});
		}

		// model.fetch
		// -----------
		// We need to make sure that the cache is set to true, so we wrap it
	,	fetch: function (options)
		{
			options = options || {};

			options.cache = true;

			return original_fetch.apply(this, arguments);
		}


	});
});