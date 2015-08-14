var ECQS = {
	
	getCategories: function() {
		try{
			var ret = [];

			var request = nlapiRequestURL('http://quickstart.explorewebdev.com/EC_ECQS_CategoryCache.json');

			ret = JSON.parse(request.getBody());

			return ret || [];
		} catch(e){

			return e;
		}	
	}
}