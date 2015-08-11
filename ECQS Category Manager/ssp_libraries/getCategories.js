var ECQS = {
	
	getCategories: function() {
		var ret = [];
		
		//var get_categories_suitelet = nlapiResolveURL('SUITELET','customscript_ec_suitelet_getcategories','customdeploy_ec_suitelet_getcategories',true);
		var get_categories_suitelet = nlapiResolveURL('SUITELET','customscript_ec_getcategories_shawn','customdeploy1',true);
		var request = nlapiRequestURL(get_categories_suitelet);
		
		ret = JSON.parse(request.getBody());

		return ret || [];
	}
}


// todo : add caching for anything serving up data
response.setCDNCacheable(response.CACHE_DURATION_MEDIUM);