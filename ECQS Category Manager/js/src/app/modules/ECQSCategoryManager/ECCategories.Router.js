define('ECCategories.Router', ['Facets.Helper', 'Facets.Model', 'ECCategories.Views'], function (FacetHelper, FacetModel, Views)
{
	'use strict';
	
	return Backbone.Router.extend({
		
		routes: {}
	
	,	initialize: function (application)
		{
			this.application = application;
			this.translatorConfig = application.translatorConfig;
		}
		
	,	ecCategoryByUrl: function () 
		{
			var self= this
			,	url = Backbone.history.getFragment()
			,	translator = FacetHelper.parseUrl(url, this.translatorConfig)
			,	category = translator.getFacetValue('category')
			,	currCategory = _.findWhere(ECQS.categories, {custrecord_ecqs_category_url : category}) || [];		// Find matching ECQS category record from NS

			var model = new FacetModel()				// Model for item set from facet field on ECQS category record
			,	itemListModel = new FacetModel()		// Model for item set from item list field on ECQS category record
			,	view = new Views({
					catModel: currCategory
				,	translator: translator
				,	translatorConfig: this.translatorConfig
				,	application: this.application
				,	model: model
				,	itemListModel: itemListModel
			});
			
			// if category has facet field set
			if (currCategory.custrecord_ecqs_category_facet) {
				
				var facetTranslator = FacetHelper.parseUrl(currCategory.custrecord_ecqs_category_facet, this.translatorConfig);
				
				// duplicate facet settings from the facet field on the ECQS category record to our translator
				_.each(facetTranslator.facets, function(facet) {
					translator = translator.cloneForFacetId(facet.id, facet.value);
				});
				
				// remove category facet or results will be empty since we're using ECQS categories
				var modelTranslator = translator.cloneWithoutFacetId('category');
				
				model.fetch({
					data: modelTranslator.getApiParams()
					,	killerId: this.application.killerId
					,	pageGeneratorPreload: true }).then(function (data) {
//						console.log('item data: ' + JSON.stringify(data));
						if (data.corrections && data.corrections.length > 0)
						{
//							console.log('data.corrections: ' + JSON.stringify(data.corrections));
//							console.log('data.corrections.length: ' + data.corrections.length);
							var unaliased_url = self.unaliasUrl(url, data.corrections);

							if (SC.ENVIRONMENT.jsEnvironment === 'server')
							{			
								nsglobal.statusCode = 301;
								nsglobal.location = '/' + unaliased_url;
							}
							else
							{
								Backbone.history.navigate('#' + unaliased_url, {trigger: true});
							}
						}
						else
						{
							translator.setLabelsFromFacets(model.get('facets') || []);
							view.showContent(true);
						}
				});
				
			// if category has item list field set
			} else if (currCategory.recmachcustrecord_ecqs_catitem_cat) {

				var ids = _.map(currCategory.recmachcustrecord_ecqs_catitem_cat, function(val, key) {
					return val.custrecord_ecqs_catitem_item.internalid;
				});
				
				var modelData = translator.getApiParams();
				modelData.id = ids.join(); 		// max 10 ids per call
				modelData = _.omit(modelData, 'category');

				itemListModel.fetch({
					data: modelData
				,	killerId: this.application.killerId
				,	pageGeneratorPreload: true }).then(function (data) {

					// data is unordered when returned, need to reorder in order of item list
					var orderedItems = [];
					_.each(ids, function(id) {
						var itemModel = _.find(itemListModel.get('items').models, function(itemModel) {
							return itemModel.get('internalid') == id;
						});
						if (itemModel) {
							orderedItems.push(itemModel);
						}
					});
					
					itemListModel.get('items').models = orderedItems;
					view.model = itemListModel;
					//view.showContentItemList();
					view.showContent(false);
					
				});		
				
			} else {
				view.showContent();
			}
		}
	});
});