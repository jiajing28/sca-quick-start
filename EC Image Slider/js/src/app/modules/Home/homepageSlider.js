console.log(SC);
//console.log(SC.Application('Shopping'));

define('SliderImages', function()
{
	'use strict';
	
	var SliderImages = {};
	
	SliderImages.Model = Backbone.Model.extend({
		parse: function (response)
		{
			return response.columns;
		}
	});
	SliderImages.Collection = Backbone.Collection.extend({
		url: '/SCA-Quick-Start/EC-Image-Slider/services/slider-imgs.ss'
	//	url: '/SCA-Quick-Start/EC-Image-Slider/services/ecqsGetSlider.ss?name=Anime'
	,	model: SliderImages.Model
	});
	SliderImages.View = Backbone.View.extend({
		title: 'SliderImages'
	,	page_header: 'SliderImages'
	,	template: 'EC_home'
	});
	
	SliderImages.Router = Backbone.Router.extend({
		routes: {
			'slider': 'customHomePage'
		,	'': 'customHomePage'
		,	'?*params': 'customHomePage'
		}
		
	,	initialize: function (application)
		{
			this.application = application;
		}
		
	,	customHomePage: function()
		{
		
			console.log('customHomePage');
			var collection = new SliderImages.Collection()
			,	view = new SliderImages.View({
					application: this.application
				,	collection: collection
				});
			collection.fetch({
				success: function ()
				{
					console.log();
					view.showContent();
				}
			});
		}
	});
	
	SliderImages.mountToApp = function(application)
	{
		/*
		var router = new Router(application);
		
		router.on("route", function(route, params) {
			console.log('router');
			console.log(route); //will be called every route change in addition to the appropriate other callbacks.
			if(route!=="") {
				
			}
		});
		*/
		
		return new SliderImages.Router(application);
		
	};
	
	return SliderImages;
});

(function(application)
{
	'use strict';
	
	if (!window.sliderImagesIncluded)
	{
		window.sliderImagesIncluded = true;
		SC.SliderImagesTemplates.macros = _.union(SC.templates.macros, SC.SliderImagesTemplates.macros);
		SC.templates = _.extend(SC.templates, SC.SliderImagesTemplates);
		application.Configuration.modules.push('SliderImages');
		
		application.Configuration.navigationTabs.push({
			data: {
				hashtag: '#/slider'
			,	touchpoint: 'home'
			}
		,	href: '/slider'
		,	text: 'Slider'
		});
		
	}
})(SC.Application('Shopping'));