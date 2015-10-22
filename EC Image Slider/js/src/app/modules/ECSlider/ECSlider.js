define('ECSlider', function()
{
	'use strict';
	
	var ECSlider = {};
	
	ECSlider.Model = Backbone.Model.extend({
		parse: function (response)
		{
			return response;
		}
	});
	ECSlider.Collection = Backbone.Collection.extend({
		
		initialize: function(options) {

	    	this.id = options.id;
	  	}

	,	url: function() {			
			return '../SCA-Quick-Start/EC-Image-Slider/services/ecqsGetSlider.ss?name=' + this.id
		}
	
	,	model: ECSlider.Model

	});
	
	return ECSlider;
});

(function(application)
{	
	if (!window.ECQSHeroTemplates)
	{
	  window.ECQSHeroTemplates = true;
	  SC.ECQSHeroTemplates.macros = _.union(SC.templates.macros, SC.ECQSHeroTemplates.macros);
	  SC.templates = _.extend(SC.templates, SC.ECQSHeroTemplates);
	  
	  SC.compileMacros(SC.templates.macros);
	}
	
	if (!application.ECQSHeroSliderModules) {
		application.ECQSHeroSliderModules = [];
	} 
		
	application.ECQSHeroSliderModules.push('ECSlider');
	
	
})(SC.Application('Shopping'));