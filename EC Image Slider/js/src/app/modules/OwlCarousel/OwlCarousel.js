define('OwlCarousel', ['ECSlider'], function (ECSlider)
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
			this.ecSliderID = this.options.ecSliderID;
			this.buildSlides();

			return this;
		}

	,	initSlider: function ()
		{
			return this.$target.owlCarousel({
				loop:true
			,	autoplay:true
			,	nav:true
			,	center:true
			,	mouseDrag:false
			,	items:1
			});
		}
	
	,	buildSlides: function() 
		{
			var self = this;
			var collection = new ECSlider.Collection({id:self.ecSliderID});
			
			collection.fetch({
				success: function ()
				{
					_.each(collection.models, function(collectionItem) {
						self.$target.append(
							SC.macros.sliderImg(collectionItem)
						);
					});
					
					self.$slider = self.initSlider();

				}
			});
			
			
			

		}
	});

	var OwlCarouselModule = {

		OwlCarousel: OwlCarousel
		
	,	initialize: function (view)
		{

			var ecSliderSelector = '[data-type="ec-slider"]';

			if (view.$(ecSliderSelector).length)
			{
				var ecSliderID = jQuery.trim(view.$(ecSliderSelector).attr('data-ec-slider'));
				
				view.owlCarousel = new OwlCarouselModule.OwlCarousel({
					$target: view.$(ecSliderSelector)
				,	ecSliderID: ecSliderID
				});				
			}

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