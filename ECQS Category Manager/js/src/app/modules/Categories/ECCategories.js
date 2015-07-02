define('ECCategories', ['Facets', 'Facets.Translator', 'Facets.Helper', 'Facets.Model'], function (Facets, FacetTranslator, FacetHelper, FacetModel)
{
	'use strict';
	
	var ECCategories = {};
	
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

			
			translator = translator.cloneForFacetId('category', category)
			
			console.log(url);
			console.log('category = ' + category);
			console.log(translator);
			
			var model = new FacetModel()
			,	view = new ECCategories.View({
					catModel: currCategory
				,	translator: translator
				,	translatorConfig: this.translatorConfig
				,	application: this.application
				,	model: model
			});
			
			if (currCategory.recmachcustrecord_ecqs_catitem_cat) {

				var ids = _.map(currCategory.recmachcustrecord_ecqs_catitem_cat, function(val, key) {
					return val.custrecord_ecqs_catitem_item.internalid;
				}).join();
				
				var modelData = translator.getApiParams();
				modelData.id = ids; 		// max 10 ids per call
				modelData = _.omit(modelData, 'category');

				console.log('modelData');
				console.log(modelData);
				model.fetch({
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
						
						view.showContent();
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
			this.translator = options.translator;
			this.title = this.catModel.name;
			this.page_header = this.catModel.name;
			
			this.template = this.catModel.custrecord_ecqs_category_tmpl_page ? this.catModel.custrecord_ecqs_category_tmpl_page.name : this.template;
		}
	
	,	showContent: function () 
		{
			var self = this;
			// once the showContent is done the afterAppend is called
			this.application.getLayout().showContent(this).done(function ()
			{
				// Looks for placeholders and injects the facets
				self.renderFacets();
			});
		}
	
		// view.renderFacets:
		// Generates a new translator, grabs the facets of the model,
		// look for elements with data-type="facet" or data-type="all-facets"
		// and then execute all the macros and injects the results in the elements
	,	renderFacets: function ()
		{
			var self = this
			,	translator = this.translator
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
				//self.fixStatus(collapser);
			});
	
			this.$('[data-toggle="slider"]').slider();
		}
	});
	
	ECCategories.mountToApp = function(application)
	{
		
		application.on('afterModulesLoaded', function ()
		{
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