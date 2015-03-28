function service (request, response)
{
	var sliderImgs = new nlapiSearchRecord('customrecord_ec_img_slider', null, null, [
		new nlobjSearchColumn('custrecord_ec_imgslider_imgdesk')
	,	new nlobjSearchColumn('custrecord_ec_imgslider_imgmob')
	,	new nlobjSearchColumn('custrecord_ec_imgslider_link')
	,	new nlobjSearchColumn('custrecord_ec_imgslider_alt')
	]);

	response.setContentType('JSON');
	
	nlapiLogExecution('AUDIT', 'sliderImgs', JSON.stringify(sliderImgs));	

	response.write(JSON.stringify(sliderImgs || []));
}