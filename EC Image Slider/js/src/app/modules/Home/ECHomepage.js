define('ECHomepage', function()
{
	'use strict';
	
	var ECHomepage = {};
	
	ECHomepage.View = Backbone.View.extend({
		title: 'Homepage'
	,	page_header: 'Homepage'
	,	template: 'EC_home'
		
	,	initialize: function (options) 
		{

		}
	});
	
	ECHomepage.Router = Backbone.Router.extend({
		routes: {
			'ecqs-slider-demo': 'customHomePage'
		//,	'?*params': 'customHomePage'
		}
		
	,	initialize: function (application)
		{
			this.application = application;
		}
		
	,	customHomePage: function()
		{

			var view = new ECHomepage.View({
				application: this.application
			});
			
			view.showContent();
			
		}
	});
	
	ECHomepage.mountToApp = function(application)
	{
		
		return new ECHomepage.Router(application);
		
	};
	
	return ECHomepage;
});

(function(application)
{
	application.Configuration.modules.push('ECHomepage');
	
	application.Configuration.navigationTabs.push({		
		data: {		
			hashtag: '#/ecqs-slider-demo'		
		,	touchpoint: 'home'		
		}		
	,	href: 'ecqs-slider-demo'		
	,	text: 'ECQS Slider Demo'		
	});
	
})(SC.Application('Shopping'));