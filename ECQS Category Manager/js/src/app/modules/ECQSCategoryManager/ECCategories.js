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



define('ECCategories', ['Facets', 'Facets.Translator', 'ECCategories.Views', 'ECCategories.Router'], function (Facets, FacetTranslator, Views, Router)
{
	'use strict';

	var getUrl = function () {
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
	
	var parseUrl = function (url) {

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
	
	
	var ECCategories = {
		Router : Router
	,	View : Views
	,	mountToApp: function (application) 
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
			FacetTranslator.prototype.getUrl = getUrl;
			
			// Rewrite parseUrl to take into account ECQS category urls
			FacetTranslator.prototype.parseUrl = parseUrl;
		}
	};
	
	return ECCategories;
});


(function(application)
{
	application.Configuration.modules.push('ECCategories');			// append this to Configuration modules so it can be called by Starter.js

})(SC.Application('Shopping'));