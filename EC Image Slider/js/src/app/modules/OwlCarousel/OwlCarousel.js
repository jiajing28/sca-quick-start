define('OwlCarousel', function ()
{
	'use strict';

	var OwlCarousel = function OwlCarousel (options)
	{
		this.options = options;
		this.$target = options.$target;

		this.initialize();
	};

	_.extend(OwlCarousel.prototype, {

		initialize: function ()
		{

			console.log('initialize OwlCarousel');
			
			this.$slider = this.initSlider();

			return this;
		}

	,	initSlider: function ()
		{
			console.log('initslider');
			console.log(this.$target);
		
			return this.$target.owlCarousel({
				loop:true
			,	autoplay:true
			,	nav:true
			,	center:true
			,	mouseDrag:false
			,	items:1
			});
		}
	});

	var OwlCarouselModule = {

		OwlCarousel: OwlCarousel
		
	,	initialize: function (view)
		{
			console.log('initialize OwlCarouselModule');
			view.owlCarousel = new OwlCarouselModule.OwlCarousel({
				$target: view.$('.owl-carousel') 
			});
		
		}
	,	mountToApp: function (application)
		{
			
	
			application.getLayout().on('afterAppendView', this.initialize);
			
		}
			
	}
	
	return OwlCarouselModule;
});


(function(application)
{
	'use strict';
	
	console.log('OWL');
	
	application.Configuration.modules.push('OwlCarousel');
	
})(SC.Application('Shopping'));