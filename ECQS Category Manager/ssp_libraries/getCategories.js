var ECQS = {
	
	getCategories: function() {
		try{
			var ret = [];

			var request = nlapiRequestURL('http://quickstart.explorewebdev.com/EC_ECQS_CategoryCache.json');

			ret = JSON.parse(request.getBody());
			
			var categoryIds = _.pluck(ret, 'id');

			// remove inactive subcategories
			ret = _.map(ret, function(val, key) {
				if (val.recmachcustrecord_ecqs_subcat_parent) {
					val.recmachcustrecord_ecqs_subcat_parent = _.reject(val.recmachcustrecord_ecqs_subcat_parent, function(subcategory) {
						return _.indexOf(categoryIds, parseInt(subcategory.custrecord_ecqs_subcat_child.internalid)) < 0;
					});
				}
				return val;
			});

			return ret || [];
			
		} catch(e){
			return e;
		}	
	}
}