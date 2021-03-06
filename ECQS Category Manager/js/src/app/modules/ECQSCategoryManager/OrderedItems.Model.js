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
			var self = this;
			var ids = options ? options.data: "";
			var arrayOfIds = ids.split(',');

			// Listen to the change event of the items and converts it to an ItemDetailsCollection
			this.on('change:items', function (model, items)
			{
				if (!(items instanceof ItemDetailsCollection))
				{
					// Removes unavailable items, when doing item search api without facets, these items are not excluded
					items = _.reject(items, function(item) {
						return item && !item.internalid;
					});
					
					// NOTE: Compact is used to filter null values from response
					model.set('items', new ItemDetailsCollection(_.compact(items)));
				}
				
				// sort items collection by the order returned from getCategories.  This overrides the default sort order in the item search api.	
				items.comparator = function (model) {
					var foundIndex = arrayOfIds.length;
					for (var i = 0; i < arrayOfIds.length; i++) {
						if (model.id == arrayOfIds[i]) {
							foundIndex = i;
							break;
						}
					}
					return foundIndex;
				};
				
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


	} , {
		mountToApp: function (application) 
		{
			// sets default options for the search api
			this.prototype.searchApiMasterOptions = application.getConfig('searchApiMasterOptions.Facets', {});
		}
	});
});