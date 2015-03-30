function service (request, response)
{
	nlapiLogExecution('AUDIT', 'sliderImgs', 'start');
	
	var ret = [];

	var name = request.getParameter('name');
	nlapiLogExecution('AUDIT', 'sliderImgs', 'name = ' + name);	
	
	var filters = [];
	filters.push(new nlobjSearchFilter( 'name', null, 'is', name ));
	
	var columns = [];
	columns.push(new nlobjSearchColumn('internalid'));
	
	var searchResults = new nlapiSearchRecord('customrecord_ecqs_slider', null, filters, columns);
	if (searchResults.length) {
		var slider = nlapiLoadRecord('customrecord_ecqs_slider', searchResults[0].getId());

		var sublistName = 'recmach' + 'custrecord_ecqs_slide_parent';
		var count = slider.getLineItemCount(sublistName);
		nlapiLogExecution('AUDIT', 'count', count);

		for (var i = 1; i <= count; i++ ) {
			
			var imgdesktopID = slider.getLineItemValue(sublistName, 'custrecord_ecqs_slide_img_desktop', i);
			var imgmobileID = slider.getLineItemValue(sublistName, 'custrecord_ecqs_slide_img_mobile', i);
			
			//var imgdesktop = slider.getLineItemField(sublistName, 'custrecord_ecqs_slide_img_desktop', i);
			//var imgmobile = slider.getLineItemField(sublistName, 'custrecord_ecqs_slide_img_mobile', i);;
			
			//imgdesktop = imgdesktop.getName();
			//imgmobile = imgmobile.getName();
			
			var imgdesktop = '';
			var imgmobile = '';
			
			if ( imgdesktopID )
			{
			         var imageFile = nlapiLoadFile(imgdesktopID);
			         imgdesktop = imageFile.getURL();
			}
			
			if ( imgmobileID )
			{
			         var imageFile = nlapiLoadFile(imgmobileID);
			         imgmobile = imageFile.getURL();
			}
			
			ret.push({
				imgdesktop: imgdesktop
				, imgmobile: imgmobile
				, alttext: slider.getLineItemValue(sublistName, 'custrecord_ecqs_slide_alt', i)
				, link: slider.getLineItemValue(sublistName, 'custrecord_ecqs_slide_link', i)
				, caption: slider.getLineItemValue(sublistName, 'custrecord_ecqs_slider_slide_caption', i)
			});
		}
	}

	response.setContentType('JSON');
	
	nlapiLogExecution('AUDIT', 'sliderImgs', JSON.stringify(ret));	

	response.write(JSON.stringify(ret || []));
}