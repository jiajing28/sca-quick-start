define('ECCategories', ['Facets', 'Facets.Translator', 'Facets.Helper', 'Facets.Model', 'Facets.Views'], function (Facets, FacetTranslator, FacetHelper, FacetModel, FacetViews)
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
		
	,	ecCategoryByUrl: function () {
			console.log('ecCategoryByUrl');
			var url = Backbone.history.getFragment()
			,	urlArray = url.split("/")
			,	category = urlArray[0];
				
			urlArray.splice(0,1);
			console.log(urlArray);

			var	translator = FacetHelper.parseUrl(urlArray.join("/"), this.translatorConfig)
			,	currCategory = _.findWhere(ECQS.categories, {custrecord_ecqs_category_url : category}) || [];

			var testTranslator = FacetHelper.parseUrl(currCategory.custrecord_ecqs_category_facet, this.translatorConfig);
			
			translator = translator.cloneForFacetId('category', category)
			
			console.log(url);
			console.log('category = ' + category);
			console.log(translator);
			
			
			
			var itemListModel = new FacetModel()
			,	model = new FacetModel()
			,	view = new ECCategories.View({
					catModel: currCategory
				,	translator: translator
				,	translatorConfig: this.translatorConfig
				,	application: this.application
				,	itemListModel: itemListModel
				,	model: model
			});
			
			if (currCategory.custrecord_ecqs_category_facet) {
				
				console.log('testTranslator');
				console.log(testTranslator);
				
				model.fetch({
					data: testTranslator.getApiParams()
					,	killerId: this.application.killerId
					,	pageGeneratorPreload: true }).then(function (data) {

						console.log('facet model data');
						console.log(data);
						
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
							testTranslator.setLabelsFromFacets(model.get('facets') || []);
							view.showContent();
						}
				});
				
			} 
			
			if (currCategory.recmachcustrecord_ecqs_catitem_cat) {

				var ids = _.map(currCategory.recmachcustrecord_ecqs_catitem_cat, function(val, key) {
					return val.custrecord_ecqs_catitem_item.internalid;
				}).join();
				
				var modelData = translator.getApiParams();
				modelData.id = ids; 		// max 10 ids per call
				modelData = _.omit(modelData, 'category');

				console.log('modelData');
				console.log(modelData);
				itemListModel.fetch({
					data: modelData
				,	killerId: this.application.killerId
				,	pageGeneratorPreload: true }).then(function (data) {

					console.log('model data');
					console.log(data);
					
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
						//translator.facets = [];
						
						translator.setLabelsFromFacets(model.get('facets') || []);
						
						/*
						var categoryFacet = '';
						
						translator.facets = _.filter(translator.facets, function(facet) {
							var id = facet.id
							,	found = _.where(translator.facetsLabels, {id:id}).length > 0;

							if (!found) {
								categoryFacet = facet.url;
							}
							return found;
						});
						
						view.translator = translator.cloneForFacetId('category', categoryFacet)
						*/
						console.log(' new translator');
						
						console.log(translator);
						
						//view.showContent();
					}
				});		
			} else {
				view.showContent();
			}
			
			
			
		}
	
	});
	
	ECCategories.View = Backbone.View.extend({
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
		}
	
		// view.getBreadcrumb:
		// It will generate an array suitable to pass it to the breadcrumb macro
		// It looks in the category facet value
	,	getBreadcrumb: function ()
		{
			console.log('getBreadcrumbs');
			//var category_string = this.translator.getFacetValue('category')
			var category_string = ''
			,	breadcrumb = [{
					href: '/'
				,	text: _('Home').translate()
				}];
			
			
			for (var i = 1; i <= 5; i++) {
				console.log(this.catModel['custrecord_ecqs_category_crumb_'+i]);
				console.log(this.catModel['custrecord_ecqs_category_crumb_1']);
				if (this.catModel['custrecord_ecqs_category_crumb_'+i]) {
					var categoryId = this.catModel['custrecord_ecqs_category_crumb_'+i].internalid;
					var breadcrumbCat = _.findWhere(ECQS.categories, {id : categoryId});
					category_string += breadcrumbCat.custrecord_ecqs_category_url + '/';
				}
			}
			category_string += this.translator.getFacetValue('category');
			
			console.log(category_string);
	
			if (category_string)
			{
				var category_path = '';
				
				var tokens = category_string && category_string.split('/') || [];
				console.log(tokens);
				if (tokens.length && tokens[0] === '')
				{
					tokens.shift();
				}
				
				_.each(tokens, function (cat)
				{
					console.log('cat');
					console.log(cat);
					category_path += '/'+cat;
	
					var thisCategory = _.findWhere(ECQS.categories, {custrecord_ecqs_category_url : cat }) 
					
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
			});
		}
	

		// view.renderFacets:
		// Generates a new translator, grabs the facets of the model,
		// look for elements with data-type="facet" or data-type="all-facets"
		// and then execute all the macros and injects the results in the elements
	,	renderFacets: function (url)
		{
			var self = this
			,	translator = FacetHelper.parseUrl(url, this.options.translatorConfig)
			,	facets = this.model.get('facets');
	
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
	
		// view.fixStatus:
		// Tries to keep the status of the collapeser based on what they were previously setted
	,	fixStatus: function (collapser)
		{
			var $collapser = jQuery(collapser)
			,	$facet = $collapser.closest('div[data-type="rendered-facet"]')
			,	$placeholder = $collapser.closest('div[data-type="all-facets"], div[data-type="facet"]')
			,	$target = jQuery( $collapser.data('target') );
	
			// Checks the path in the Status object is present
			this.statuses[$placeholder.attr('id')] = this.statuses[$placeholder.attr('id')] || {};
			this.statuses[$placeholder.attr('id')][$facet.data('facet-id')] = this.statuses[$placeholder.attr('id')][$facet.data('facet-id')] || {};
	
			if (_.isUndefined(this.statuses[$placeholder.attr('id')][$facet.data('facet-id')][$collapser.data('type')]))
			{
				if ($collapser.data('type') !== 'collapse' && !$target.hasClass('in'))
				{
					this.statuses[$placeholder.attr('id')][$facet.data('facet-id')][$collapser.data('type')] = false;
				}
				else
				{
					this.statuses[$placeholder.attr('id')][$facet.data('facet-id')][$collapser.data('type')] = !this.translator.getFacetConfig($facet.data('facet-id')).collapsed;
				}
			}
	
			if (this.statuses[$placeholder.attr('id')][$facet.data('facet-id')][$collapser.data('type')])
			{
				$target.addClass('in').removeClass('collapse');
			}
			else
			{
				$target.addClass('collapse').removeClass('in');
			}
	
			this.toggleCollapsableIndicator($collapser, !this.statuses[$placeholder.attr('id')][$facet.data('facet-id')][$collapser.data('type')]);
		}
	
		//view.formatFacetTitle: accepts a facet object and returns a string formatted to be displayed on the document's title according with user facet configuration property titleToken
	,	formatFacetTitle: function (facet)
		{
			var defaults = {
				range: '$(2): $(0) to $(1)'
			,	multi: '$(1): $(0)'
			,	single: '$(1): $(0)'
			};
	
			if (facet.id === 'category')
			{
				//we search for a category title starting from the last category of the branch
				var categories = Categories.getBranchLineFromPath(this.options.translator.getFacetValue('category'));
				if(categories && categories.length > 0)
				{
					for(var i = categories.length - 1; i >= 0; i--)
					{
						var category = categories[i];
						var category_title = category.pagetitle || category.itemid;
						if(category_title)
						{
							return category_title;
						}
					}
				}
				return null;
			}
	
			if (!facet.config.titleToken)
			{
				facet.config.titleToken = defaults[facet.config.behavior] || defaults.single;
			}
			if (_.isFunction(facet.config.titleToken))
			{
				return facet.config.titleToken(facet);
			}
			else if (facet.config.behavior === 'range')
			{
				return _(facet.config.titleToken).translate(facet.value.to, facet.value.from, facet.config.name);
			}
			else if (facet.config.behavior === 'multi')
			{
				var buffer = [];
				_.each(facet.value, function (val)
				{
					buffer.push(val);
				});
				return _(facet.config.titleToken).translate(buffer.join(', '), facet.config.name);
			}
			else
			{
				return _(facet.config.titleToken).translate(facet.value, facet.config.name);
			}
		}
	
		// overrides Backbone.Views.getTitle
	,	getTitle: function ()
		{
			if (this.title)
			{
				return this.title;
			}
	
			var facets = this.options.translator.facets
			,	title = '';
	
			if (facets && facets.length)
			{
				var buffer = []
				,	facet = null;
	
				for (var i = 0; i < facets.length; i++)
				{
					facet = facets[i];
					buffer.push(this.formatFacetTitle(facet));
	
					if (i < facets.length - 1)
					{
						buffer.push(facet.config.titleSeparator || ', ');
					}
				}
	
				title = this.application.getConfig('searchTitlePrefix', '') +
						buffer.join('') +
						this.application.getConfig('searchTitleSufix', '');
			}
			else if (this.translator.getOptionValue('keywords'))
			{
				title = _('Search results for "$(0)"').translate(
					this.translator.getOptionValue('keywords')
				);
			}
			else
			{
				title = this.application.getConfig('defaultSearchTitle', '');
			}
	
			// Update the meta tag 'twitter:title'
			this.setMetaTwitterTitle(title);
	
			return title;
		}
	
		// view.toggleCollapsableIndicator
		// Handles the collapsables and store the status
	,	toggleCollapsableIndicator: function (element, is_open)
		{
			var $element = jQuery(element).closest('*[data-toggle="collapse"]'),
				$facet_container = $element.closest('div[data-type="rendered-facet"]');
	
			is_open = _.isUndefined(is_open) ? jQuery($element.data('target')).hasClass('in') : is_open;
	
			$element
				.find('*[data-collapsed!=""]')
				.filter('[data-collapsed="true"]')[is_open ? 'hide' : 'show']().end()
				.filter('[data-collapsed="false"]')[is_open ? 'show' : 'hide']();
	
			var holder_html_id = $facet_container.parent().attr('id')
			,	facet_id = $facet_container.data('facet-id')
			,	type = $element.data('type');
	
			this.statuses[holder_html_id][facet_id][type] = !is_open;
		}


	});
	
	ECCategories.mountToApp = function(application)
	{
		
		application.on('afterModulesLoaded', function ()
		{
			Facets.setTranslatorConfig(application);
			
			
			var query = ''
			,	categoryUrls = _.pluck(ECQS.categories, 'custrecord_ecqs_category_url');
			console.log('ECCategories afterModulesLoaded');
			console.log(categoryUrls);
			
			
			
			var facets_data = application.getConfig('siteSettings.facetfield')
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
				//ECCategories.Router.prototype.routes[new RegExp(facet_regex)] = 'ecCategoryByUrl';
				console.log(new RegExp(facet_regex));
				routerInstance.route(new RegExp(facet_regex), 'ecCategoryByUrl');

			});
			
			
			 
			
			
			//routerInstance.route(new RegExp(facet_regex), 'ecCategoryByUrl');

			console.log('routerInstance');
			console.log(routerInstance);
			//Facets.prepareRouter(application, routerInstance);
			//console.log(routerInstance);
			return routerInstance;
		});
		
		
		FacetTranslator.prototype.getUrl = function () {
		    // new code	
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
	};
	
	return ECCategories;
});

(function(application)
{
	application.Configuration.modules.push('ECCategories');
	
	application.Configuration.navigationTabs.push({		
		data: {		
			hashtag: '#/category-1'		
		,	touchpoint: 'home'		
		}		
	,	href: 'category-1'		
	,	text: 'ECQS Category Demo'		
	});
	
	if (!window.ECCategoryIncluded)
	{
		window.ECCategoryIncluded = true;
		SC.ECCatTemplates.macros = _.union(SC.templates.macros, SC.ECCatTemplates.macros);
		SC.templates = _.extend(SC.templates, SC.ECCatTemplates);
		
		SC.compileMacros(SC.templates.macros);
	}
	
})(SC.Application('Shopping'));