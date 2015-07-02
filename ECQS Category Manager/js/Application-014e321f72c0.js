define('ECCategories', function ()
{
	'use strict';
	
	var ECCategories = {};
	
	ECCategories.Router = Backbone.Router.extend({
		
		routes: {
		//	':url': 'ecCategoryByUrl'
			'category-1': 'ecCategoryByUrl'
		}
	
	,	initialize: function (application)
		{
			this.application = application;
		}
		
	,	ecCategoryByUrl: function () {
			console.log('ecCategoryByUrl');
			var url = Backbone.history.getFragment();
			console.log(url);
			console.log(ECQS.categories);
			var currCategory = _.findWhere(ECQS.categories, {custrecord_ecqs_category_url : url});
			
			console.log(currCategory);
			var view = new ECCategories.View({
				catModel: currCategory
			,	application: this.application
			});
			
			view.showContent();
		}
	
	});
	
	ECCategories.View = Backbone.View.extend({
		title: ''
	,	page_header: ''
	,	template: ''
		
	,	initialize: function (options) 
		{
			this.application = options.application;
			this.catModel = options.catModel;
			this.title = this.catModel.name;
			this.page_header = this.catModel.name;
			this.template = this.catModel.custrecord_ecqs_category_tmpl_page.name;
			
			this.merchZone = this.catModel.custrecord_ecqs_category_merch_rule.name || null;

			console.log('init category');
			console.log(this.catModel);
		}
	});
	
	ECCategories.mountToApp = function(application)
	{
		return new ECCategories.Router(application);	
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
