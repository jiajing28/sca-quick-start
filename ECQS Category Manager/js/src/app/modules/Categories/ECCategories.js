/**
*  Give backbone an easier way to access super properties and methods.
*/
Backbone.View.prototype.parent = Backbone.Model.prototype.parent = Backbone.Collection.prototype.parent = function(attribute, options) {
  
  /**
  *  Call this inside of the child initialize method.  If it's a view, it will extend events also.
  *  this.parent('inherit', this.options);  <- A views params get set to this.options
  */
  if(attribute == "inherit") {
    this.parent('initialize', options); // passes this.options to the parent initialize method
    
    //extends child events with parent events
    if(this.events) { _.extend(this.events, this.parent('events')); this.delegateEvents(); }
    
    return;
  }
  
  /**
  *  Call other parent methods and attributes anywhere else.
  *  this.parent('parentMethodOrOverriddenMethod', params) <- called anywhere or inside overridden method
  *  this.parent'parentOrOverriddenAttribute') <- call anywhere
  */		
  return (_.isFunction(this.constructor.__super__[attribute])) ?
    this.constructor.__super__[attribute].apply(this, _.rest(arguments)) :
    this.constructor.__super__[attribute];
};



define('ECCategories', ['Facets', 'Facets.Translator', 'Facets.Helper', 'Facets.Model', 'Facets.Views', 'ItemsKeyMapping'], function (Facets, FacetTranslator, FacetHelper, FacetModel, FacetViews, itemsKeyMapping)
{
	'use strict';
	
	var ECCategories = {}
	,	statuses = window.statuses = {}
	,	collapsable_elements = window.collapsable_elements = {};
	
	ECCategories.Router = Backbone.Router.extend({
		
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
			,	view = new ECCategories.View({
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
						if (data.corrections && data.corrections.length > 0)
						{
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
							view.showContent();
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
					view.showContentItemList();
					
				});		
				
			} else {
				view.showContent();
			}
		}
	});
	
	
	ECCategories.View = FacetViews.Browse.extend({
		title: ''
	,	page_header: ''
	,	template: 'facet_browse'
		
	,	initialize: function (options) 
		{
			this.application = options.application;
			this.catModel = options.catModel;
			this.itemListModel = options.itemListModel;
			this.translator = options.translator;
			this.title = this.catModel.name;
			this.page_header = this.catModel.name;
			
			this.statuses = statuses;
			this.collapsable_elements = collapsable_elements;
			
			this.template = this.catModel.custrecord_ecqs_category_tmpl_page ? this.catModel.custrecord_ecqs_category_tmpl_page.name : this.template;
			
			this.collapsable_elements['facet-header'] = this.collapsable_elements['facet-header'] || {
				selector: 'this.collapsable_elements["facet-header"]'
			,	collapsed: false
			};
			
			this.parent('inherit', this.options);			// inherit options from Facets.Views.js
		}
	
		// view.getBreadcrumb:
		// It will generate an array suitable to pass it to the breadcrumb macro
	,	getBreadcrumb: function ()
		{
			var category_string = ''
			,	breadcrumb = [{
					href: '/'
				,	text: _('Home').translate()
				}];
			
			// CUSTOMIZATION
			// iterate through breadcrumbs from ECQS category record and add to breadcrumbs
			for (var i = 1; i <= 5; i++) {
				if (this.catModel['custrecord_ecqs_category_crumb_'+i]) {
					var categoryId = this.catModel['custrecord_ecqs_category_crumb_'+i].internalid;
					var breadcrumbCat = _.findWhere(ECQS.categories, {id : categoryId});
					category_string += breadcrumbCat.custrecord_ecqs_category_url + '/';
				}
			}
			category_string += this.translator.getFacetValue('category');
	
			if (category_string)
			{
				var category_path = '';
				
				var tokens = category_string && category_string.split('/') || [];
				if (tokens.length && tokens[0] === '')
				{
					tokens.shift();
				}
				
				_.each(tokens, function (cat)
				{
					var thisCategory = _.findWhere(ECQS.categories, {custrecord_ecqs_category_url : cat });
					category_path = '/'+cat;
					breadcrumb.push({
						href: category_path
					,	text: _(thisCategory.name).translate()
					});
				});
			}
			else if (this.translator.getOptionValue('keywords'))
			{
				breadcrumb.push({
					href: '#'
				,	text: _('Search Results').translate()
				});
			}
			else
			{
				breadcrumb.push({
					href: '#'
				,	text: _('Shop').translate()
				});
			}
	
			return breadcrumb;
		}
	
		// view.showContent:
		// Works with the title to find the proper wording and calls the layout.showContent
	,	showContent: function ()
		{
			// If its a free text search it will work with the title
			var keywords = this.translator.getOptionValue('keywords')
			,	resultCount = this.model.get('total')
			,	self = this;

			if (keywords)
			{
				keywords = decodeURIComponent(keywords);

				if (resultCount > 0)
				{
					this.subtitle =  resultCount > 1 ? _('Results for "$(0)"').translate(keywords) : _('Result for "$(0)"').translate(keywords);
				}
				else
				{
					this.subtitle = _('We couldn\'t find any items that match "$(0)"').translate(keywords);
				}
			}

			this.totalPages = Math.ceil(resultCount / this.translator.getOptionValue('show'));
			// once the showContent is done the afterAppend is called
			this.application.getLayout().showContent(this).done(function ()
			{
				// Looks for placeholders and injects the facets
				self.renderFacets(self.translator.getUrl());
				
				// CUSTOMIZATION
				// add item list block 
				self.getItemListModel(self.catModel);
			});
		}
	
		// view.showContentItemList:
		// Differs from showContent because itemListModel is already defined when this is called
	,	showContentItemList: function ()
		{
			// If its a free text search it will work with the title
			var keywords = this.translator.getOptionValue('keywords')
			,	resultCount = this.model.get('total')
			,	self = this;
	
			if (keywords)
			{
				keywords = decodeURIComponent(keywords);
	
				if (resultCount > 0)
				{
					this.subtitle =  resultCount > 1 ? _('Results for "$(0)"').translate(keywords) : _('Result for "$(0)"').translate(keywords);
				}
				else
				{
					this.subtitle = _('We couldn\'t find any items that match "$(0)"').translate(keywords);
				}
			}
	
			this.totalPages = Math.ceil(resultCount / this.translator.getOptionValue('show'));
			// once the showContent is done the afterAppend is called
			this.application.getLayout().showContent(this).done(function ()
			{
				self.appendItemList(self.itemListModel);
			});
		}
	
		// view.getItemListModel:
		// Get item list subrecord from ECQS category record
	,	getItemListModel: function(currCategory) 
		{
			var self = this;
			
			if (currCategory.recmachcustrecord_ecqs_catitem_cat) {
				
				var itemListModel = new FacetModel();
	
				var ids = _.map(currCategory.recmachcustrecord_ecqs_catitem_cat, function(val, key) {
					return val.custrecord_ecqs_catitem_item.internalid;
				}).join();
				
				var modelData = self.translator.getApiParams();
				modelData.id = ids; 		// max 10 ids per call
				modelData = _.omit(modelData, 'category');

				itemListModel.fetch({
					data: modelData
				,	killerId: this.application.killerId
				,	pageGeneratorPreload: true }).then(function (data) {
					
					self.appendItemList(itemListModel);
					
				});		
			}
		} 
	

		// view.renderFacets:
		// Generates a new translator, grabs the facets of the model,
		// look for elements with data-type="facet" or data-type="all-facets"
		// and then execute all the macros and injects the results in the elements
	,	renderFacets: function (url)
		{
			var self = this
			,	translator = this.translator		// CUSTOMIZATION: pull from translator passed into view instead of creating new translator from url
			,	facets = this.model.get('facets') || [];
	
		
			this.$('div[data-type="facet"]').each(function (i, nav)
			{
				var $nav = jQuery(nav).empty()
				,	facet_id = $nav.data('facet-id')
				,	facet_config = translator.getFacetConfig( facet_id )
				,	facet_macro = $nav.data('facet-macro') || facet_config.macro || self.application.getConfig('macros.facet')
				,	facet = _.find(facets, function (facet) {
						return facet.id === facet_id;
					});
	
				$nav.append( SC.macros[ facet_macro ](translator, facet_config, facet) );
			});
	
			this.$('div[data-type="all-facets"]').each(function (i, nav)
			{
				var $nav = jQuery(nav).empty()
				,	exclude = _.map( ( $nav.data('exclude-facets') || '').split(','), function (result) {
						return jQuery.trim( result );
					})
				,	ordered_facets = facets && facets.sort(function (a, b) {
						// Default Prioriry is 0
						return (translator.getFacetConfig(b.id).priority || 0) - (translator.getFacetConfig(a.id).priority || 0);
					})
				,	content = '';
	
				_.each(ordered_facets, function (facet)
				{
					var facet_config = translator.getFacetConfig(facet.id);
					if ( !_.contains(exclude, facet.id) )
					{
						content += SC.macros[facet_config.macro || self.application.getConfig('macros.facet')](translator, facet_config, facet);
					}
				});
	
				$nav.append( content );
			});
			
	
			this.$('[data-toggle="collapse"]').each(function (index, collapser)
			{
				self.fixStatus(collapser);
			});
	
			this.$('[data-toggle="slider"]').slider();
		}
	
		// view.appendItemList:
		// Add Item List block to view 
	,	appendItemList:function(itemListModel) 
		{
			var self = this
			, 	cellTemplate = self.catModel.custrecord_ecqs_category_tmpl_cell.name;
			
			var displayOption = _.find(this.application.getConfig('itemsDisplayOptions'), function (option)
			{
				return option.id === self.translator.getOptionValue('display');
			})
			,	cellWrap = function cellWrap (item)
			{
				return SC.macros[displayOption.macro](item, self);
			};
			
			if (itemListModel.get('items')) {
				this.$('section[data-type="custom-item-list"]').each(function (i, div)
				{
					var $div = jQuery(div).empty();
					
					if (SC.macros[cellTemplate]) {
						$div.append( SC.macros[cellTemplate](self, itemListModel));
					} else {		// append generic item list view
						$div.append( SC.macros['displayInRows'](itemListModel.get('items').models, cellWrap, displayOption.columns) );
					}					
				});
			}
		}
	});
	
	
	ECCategories.mountToApp = function(application)
	{
		// Set up custom routing for all ECQS category pages
		application.on('afterModulesLoaded', function ()
		{
			Facets.setTranslatorConfig(application);

			var query = ''
			,	categoryUrls = _.compact(_.pluck(ECQS.categories, 'custrecord_ecqs_category_url'))
			,	facets_data = application.getConfig('siteSettings.facetfield')
			,	facets_to_include = [];

			_.each(facets_data, function(facet) {
				facets_to_include.push(facet.facetfieldid);

				// Include URL Component Aliases...
				_.each(facet.urlcomponentaliases, function(facet_alias) {
					facets_to_include.push(facet_alias.urlcomponent);
				});
			});
			
			facets_to_include = _.union(facets_to_include, _.pluck(application.getConfig('facets'), 'id'));
			facets_to_include = _.uniq(facets_to_include);		
			
			var components = _.compact(_.union(
				[application.translatorConfig.fallbackUrl]
			,	facets_to_include || []
			,	_.pluck(application.translatorConfig.facets, 'url') || []
			));

			var routerInstance = new ECCategories.Router(application);
			
			_.each(categoryUrls, function (category_page)
			{
				// Generate the regexp and adds it to the instance of the router
				var facet_regex = '^\\b(' + category_page + '+)\\b((' + components.join('|.*') + ')*)\\b(.*?)$';	
				
				ECCategories.Router.prototype.routes[category_page + '?*options'] = 'ecCategoryByUrl';
				ECCategories.Router.prototype.routes[category_page] = 'ecCategoryByUrl';

				routerInstance.route(new RegExp(facet_regex), 'ecCategoryByUrl');
			});

			return routerInstance;
		});
		
		
		// Rewrite getUrl to take into account ECQS category urls
		FacetTranslator.prototype.getUrl = function () {

			var url = ''
			,	self = this;

			// Prepears the seo limits
			var facets_seo_limits = {};
			if (SC.ENVIRONMENT.jsEnvironment === 'server')
			{
				facets_seo_limits = {
					numberOfFacetsGroups: this.configuration.facetsSeoLimits && this.configuration.facetsSeoLimits.numberOfFacetsGroups || false
				,	numberOfFacetsValues: this.configuration.facetsSeoLimits && this.configuration.facetsSeoLimits.numberOfFacetsValues || false
				,	options: this.configuration.facetsSeoLimits && this.configuration.facetsSeoLimits.options || false
				};
			}

			// If there are too many facets selected
			if (facets_seo_limits.numberOfFacetsGroups && this.facets.length > facets_seo_limits.numberOfFacetsGroups)
			{
				return '#';
			}

			// CUSTOMIZATION
			// Adds the category if it's prsent
			var category_string = this.getFacetValue('category');
			if (category_string)
			{
				url = self.configuration.facetDelimiters.betweenDifferentFacets + category_string;
			}

			var facetsNoCategory = _.filter(this.facets, function(facet){ return facet.id != 'category'; });

			// Encodes the other Facets
			var sorted_facets = _.sortBy(facetsNoCategory, 'url');
			for (var i = 0; i < sorted_facets.length; i++)
			{
				var facet = sorted_facets[i];
				// Category should be already added
				if (facet.id === 'category')
				{
					break;
				}
				var name = facet.url || facet.id,
					value = '';
				switch (facet.config.behavior)
				{
				case 'range':
					facet.value = (typeof facet.value === 'object') ? facet.value : {from: 0, to: facet.value};
					value = facet.value.from + self.configuration.facetDelimiters.betweenRangeFacetsValues + facet.value.to;
					break;
				case 'multi':
					value = facet.value.sort().join(self.configuration.facetDelimiters.betweenDifferentFacetsValues);

					if (facets_seo_limits.numberOfFacetsValues && facet.value.length > facets_seo_limits.numberOfFacetsValues)
					{
						return '#';
					}

					break;
				default:
					value = facet.value;
				}

				url += self.configuration.facetDelimiters.betweenDifferentFacets + name + self.configuration.facetDelimiters.betweenFacetNameAndValue + value;
			}

			url = (url !== '') ? url : '/'+this.configuration.fallbackUrl;

			// Encodes the Options
			var tmp_options = {}
			,	separator = this.configuration.facetDelimiters.betweenOptionNameAndValue;
			if (this.options.order && this.options.order !== this.configuration.defaultOrder)
			{
				tmp_options.order = 'order' + separator + this.options.order;
			}

			if (this.options.page && parseInt(this.options.page, 10) !== 1)
			{
				tmp_options.page = 'page' + separator + encodeURIComponent(this.options.page);
			}

			if (this.options.show && parseInt(this.options.show, 10) !== this.configuration.defaultShow)
			{
				tmp_options.show = 'show' + separator + encodeURIComponent(this.options.show);
			}

			if (this.options.display && this.options.display !== this.configuration.defaultDisplay)
			{
				tmp_options.display = 'display' + separator + encodeURIComponent(this.options.display);
			}

			if (this.options.keywords && this.options.keywords !== this.configuration.defaultKeywords)
			{
				tmp_options.keywords = 'keywords' + separator + encodeURIComponent(this.options.keywords);
			}

			var tmp_options_keys = _.keys(tmp_options)
			,	tmp_options_vals = _.values(tmp_options);


			// If there are options that should not be indexed also return #
			if (facets_seo_limits.options && _.difference(tmp_options_keys, facets_seo_limits.options).length)
			{
				return '#';
			}

			url += (tmp_options_vals.length) ? this.configuration.facetDelimiters.betweenFacetsAndOptions + tmp_options_vals.join(this.configuration.facetDelimiters.betweenDifferentOptions) : '';

			return _(url).fixUrl();
		}
	
		
		// Rewrite parseUrl to take into account ECQS category urls
		FacetTranslator.prototype.parseUrl = function (url) {

			// We remove a posible 1st / (slash)
			url = (url[0] === '/') ? url.substr(1) : url;

			// given an url with options we split them into 2 strings (options and facets)
			var facets_n_options = url.split(this.configuration.facetDelimiters.betweenFacetsAndOptions)
			,	facets = (facets_n_options[0] && facets_n_options[0] !== this.configuration.fallbackUrl) ? facets_n_options[0] : ''
			,	options = facets_n_options[1] || '';

			// CUSTOMIZATION
			// We treat category as the 1st unmaned facet filter, so if you are using categories
			// we will try to take that out by comparig the url with ECQS category records
			if (this.getFacetConfig('category'))
			{
				var tokens = facets && facets.split('/') || [];

				if (tokens.length && tokens[0] === '')
				{
					tokens.shift();
				}

				var branch = []
				,	slice = {categories: _.compact(_.pluck(ECQS.categories, 'custrecord_ecqs_category_url'))};
				
				for (var i = 0; i < tokens.length; i++)
				{
					var current_token = tokens[i];

					if (slice.categories && _.indexOf(slice.categories, current_token) > -1)
					{
						branch.push(current_token);
					}
					else
					{
						break;
					}
				}
				
				var categories = branch || [];

				if (categories && categories.length)
				{
					// We set the value for this facet
					var category_string = categories.join('/');
					this.parseFacet('category', category_string);

					// And then we just take it out so other posible facets are computed
					facets = facets.replace(category_string, '');
				}

				// We remove a posible 1st / (slash) (again, it me be re added by taking the category out)
				facets = (facets[0] === '/') ? facets.substr(1) : facets;
			}

			// The facet part of the url gets splited and computed by pairs
			var facet_tokens = facets.split(new RegExp('[\\'+ this.configuration.facetDelimiters.betweenDifferentFacets +'\\'+ this.configuration.facetDelimiters.betweenFacetNameAndValue +']+', 'ig'));
			while (facet_tokens.length > 0)
			{
				this.parseUrlFacet(facet_tokens.shift(), facet_tokens.shift());
			}

			// The same for the options part of the url
			var options_tokens = options.split(new RegExp('[\\'+ this.configuration.facetDelimiters.betweenOptionNameAndValue +'\\'+ this.configuration.facetDelimiters.betweenDifferentOptions +']+', 'ig'))
			,	tmp_options = {};

			while (options_tokens.length > 0)
			{
				tmp_options[options_tokens.shift()] = options_tokens.shift();
			}

			this.parseUrlOptions(tmp_options);
			
		}
	};
	
	return ECCategories;
});


(function(application)
{
	application.Configuration.modules.push('ECCategories');			// append this to Configuration modules so it can be called by Starter.js

})(SC.Application('Shopping'));