var ECQS = {
	
	getCategories: function() {
		try{
			var ret = [];
			
			//var get_categories_suitelet = nlapiResolveURL('SUITELET','customscript_ec_suitelet_getcategories','customdeploy_ec_suitelet_getcategories',true);
			var get_categories_suitelet = nlapiResolveURL('SUITELET','customscript_ec_getcategories_shawn','customdeploy1',true);
			var request = nlapiRequestURL(get_categories_suitelet);
			
			ret = JSON.parse(request.getBody());
	
			return ret || [];
		} catch(e){
			return e;
		}	
	}
}