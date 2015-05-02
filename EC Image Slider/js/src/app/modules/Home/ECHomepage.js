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
			'': 'customHomePage'
		,	'?*params': 'customHomePage'
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

if (!window.ECHomepageIncluded)
{
	window.ECHomepageIncluded = true;
	SC.ECTemplates.macros = _.union(SC.templates.macros, SC.ECTemplates.macros);
	SC.templates = _.extend(SC.templates, SC.ECTemplates);
}

if (!SC.ECModules) {
	SC.ECModules = [];
}
SC.ECModules = _.union(SC.ECModules, ['ECHomepage']);
