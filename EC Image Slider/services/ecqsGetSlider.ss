function service (request, response)
{
	var ret = [];
	var name = request.getParameter('name');
	var get_slider_suitelet = nlapiResolveURL('SUITELET','customscript_ec_suitelet_getslider','customdeploy_ec_suitelet_getslider',true);
	var postdata = { name: name };
	var request = nlapiRequestURL(get_slider_suitelet, postdata);
	
	ret = JSON.parse(request.getBody());

	response.setContentType('JSON');
	response.write(JSON.stringify(ret || []));
}