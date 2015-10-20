define('ECCategories.Router', ['Facets.Helper', 'Facets.Model', 'ECCategories.Views', 'OrderedItems.Model'], function (FacetHelper, FacetModel, Views, OrderedItemModel)
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
            ,	url = Backbone.history.fragment
            ,	translator = FacetHelper.parseUrl(url, this.translatorConfig)
            ,	category = translator.getFacetValue('category')
            ,	currCategory = _.findWhere(ECQS.categories, {custrecord_ecqs_category_url : category}) || [];		// Find matching ECQS category record from NS

            console.log('ecCategoryByUrl', url);
            
            currCategory.type = 'facet';		// default category type
            
            var model = new FacetModel()				// Model for item set from facet field on ECQS category record
                ,	itemListModel = new OrderedItemModel()		// Model for item set from item list field on ECQS category record
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

            	view.catModel.type = 'facet';
            	
                var facetTranslator = FacetHelper.parseUrl(currCategory.custrecord_ecqs_category_facet, this.translatorConfig);

                // remove category facet or results will be empty since we're using ECQS categories
                var modelTranslator = translator.cloneWithoutFacetId('category');

                // duplicate facet settings from the facet field on the ECQS category record to our translator
                _.each(facetTranslator.facets, function(facet) {
                    modelTranslator.facets = modelTranslator.cloneForFacetId(facet.id, facet.value).facets;
                });

                if (currCategory.recmachcustrecord_ecqs_catitem_cat) {
                    var ids = _.map(currCategory.recmachcustrecord_ecqs_catitem_cat, function(val, key) {
                        return val.custrecord_ecqs_catitem_item.internalid;
                    });
                    view.catModel.initItemLoadCount = 0;
					view.catModel.itemIds = ids;
                }

                model.fetch({
                    data: modelTranslator.getApiParams()
                    ,	killerId: this.application.killerId
                    ,	pageGeneratorPreload: true }).then(function (data) {

                   
                        translator.setLabelsFromFacets(model.get('facets') || []);
                        view.showContent(true);
                    
                });

                // if category has item list field set
            } else if (currCategory.recmachcustrecord_ecqs_catitem_cat) {

            	view.catModel.type = 'itemList';
				
				var ids = _.map(currCategory.recmachcustrecord_ecqs_catitem_cat, function(val, key) {
					return val.custrecord_ecqs_catitem_item.internalid;
				});

				self.loadPartialItemList(ids, view, translator);

            } else {
                view.showContent();
            }
        }

    ,	loadPartialItemList: function(ids, view, translator) 
		{
			var itemIdCount = 8
			,	itemIdArray = ids.slice(0, itemIdCount)
			,	self = this;
			
			view.catModel.itemIds = ids;
			view.catModel.initItemLoadCount = itemIdCount;
			
			console.log('itemIdArray', itemIdArray);
			
			var itemListModel = new OrderedItemModel(
				{
					data: itemIdArray.join()
		        })
			,	modelData = translator.getApiParams();
			
			modelData.id = itemIdArray.join();		// max 10 ids per call
			modelData = _.omit(modelData, 'category');
	
			itemListModel.fetch({
				data: modelData
			,	killerId: this.application.killerId
			,	pageGeneratorPreload: true}).then(function (data) {
	
					view.itemListModel = itemListModel;
					view.showContent();		 			
			});		
		}
	
    ,	loadAllItemList: function(ids, view, translator) 
		{
			view.catModel.type = 'neither';
			var self = this;
			var itemIdCount = 8
			,	numOfItemIds = ids.length
			,	promises = []
			,	numOfCalls = numOfItemIds % itemIdCount == 0 ? Math.floor(numOfItemIds / itemIdCount) : Math.floor(numOfItemIds / itemIdCount) + 1;
		
			for (var i = 0; i < numOfCalls; i++) {
				var itemIdArray = ids.slice(i * itemIdCount, (i+1)*itemIdCount)
				,	promise = self.loadItemListModel(itemIdArray, translator);
				promises.push(promise);
			}
			
			jQuery.when.apply(jQuery, promises)
		    .done(function() {
		    	
		        console.log("All done!") // do other stuff
		        
		        var items = []
		        
		        for (var i = 0; i < arguments.length; i++) {
		        	//console.log("argument",arguments[i]);
		        	var item = arguments[i][0] ? arguments[i][0].items : arguments[i].items;
		        	items = items.concat(item);
		         }
		        var itemListModel = new OrderedItemModel({
					data: ids.join()
		        });
		        
		        console.log('itemListModel', itemListModel);
		        
		        itemListModel.set('items', items);
		        view.itemListModel = itemListModel;
				view.showContent();
				
		    }).fail(function() {
		        // something went wrong here, handle it
		    });
		}
	
    ,	loadItemListModel: function(itemIdArray, translator) 
		{
			var itemListModel = new OrderedItemModel(
				{
					data: itemIdArray.join()
		        })
			,	modelData = translator.getApiParams();
			
			modelData.id = itemIdArray.join();		// max 10 ids per call
			modelData = _.omit(modelData, 'category');

			return itemListModel.fetch({
				data: modelData
			,	killerId: this.application.killerId
			,	pageGeneratorPreload: true 			
			});		
		}
    });
});