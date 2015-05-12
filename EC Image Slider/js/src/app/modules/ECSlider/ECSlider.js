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
	if (!window.ECHomepageIncluded)
	{
		window.ECHomepageIncluded = true;
		SC.ECTemplates.macros = _.union(SC.templates.macros, SC.ECTemplates.macros);
		SC.templates = _.extend(SC.templates, SC.ECTemplates);
		
		SC.compileMacros(SC.templates.macros);
	}
	application.Configuration.modules.push('ECSlider');
})(SC.Application('Shopping'));