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

	,	initSlider: function (target)
		{
			return target.owlCarousel({
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
			var desktopWrapper = self.$target.find('.ec-slider-desktop');
			var mobileWrapper = self.$target.find('.ec-slider-mobile');
			var collection = new ECSlider.Collection({id:self.ecSliderID});
			
			self.$target.append(desktopWrapper).append(mobileWrapper);
			
			collection.fetch({
				success: function ()
				{
					_.each(collection.models, function(collectionItem) {
						if (collectionItem.get('imgdesktop') != '') {
							desktopWrapper.append(
								SC.macros.sliderImg(collectionItem, collectionItem.get('imgdesktop'))
							);
						}
						
						if (collectionItem.get('imgmobile') != '') {
							mobileWrapper.append(
								SC.macros.sliderImg(collectionItem, collectionItem.get('imgmobile'))
							);
						}
					});

					if (desktopWrapper.children().length > 0) {
						self.initSlider(desktopWrapper);
					}
					
					if (mobileWrapper.children().length > 0) {
						self.initSlider(mobileWrapper);
					}
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
				
				view.$(ecSliderSelector).append('<div class="ec-slider ec-slider-desktop" />');
				view.$(ecSliderSelector).append('<div class="ec-slider ec-slider-mobile" />');	
				
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

if (!SC.ECModules) {
	SC.ECModules = [];
}
SC.ECModules = _.union(SC.ECModules, ['OwlCarousel']);