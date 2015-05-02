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

	
if (!SC.ECModules) {
	SC.ECModules = [];
}
SC.ECModules = _.union(SC.ECModules, ['ECSlider']);