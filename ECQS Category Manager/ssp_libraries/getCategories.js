var ECQS = {
	
	getCategories: function() {
		try{
			var ret = [];

			var request = nlapiRequestURL('http://quickstart.explorewebdev.com/EC_ECQS_CategoryCache.json');

			ret = JSON.parse(request.getBody());
			
			var inactiveCategories = [];
			
			ret = _.reject(ret, function(category) {
				
				var isinactive = category.isinactive == true;
				if (isinactive) {
					inactiveCategories.push(category.id);
				}
				
				return isinactive;
			});
			
			ret = _.map(ret, function(val, key) {
				nlapiLogExecution('DEBUG', 'ret map val', JSON.stringify(val));
				nlapiLogExecution('DEBUG', 'ret map key', JSON.stringify(key));
				
				val.recmachcustrecord_ecqs_subcat_parent = _.reject(val.recmachcustrecord_ecqs_subcat_parent, function(subcategory) {
					
					nlapiLogExecution('DEBUG', 'subcategory', JSON.stringify(subcategory));
					
					return _.indexOf(inactiveCategories, subcategory.custrecord_ecqs_subcat_child.internalid) >= 0;
				});
				
				return val;
			});
			
			nlapiLogExecution('DEBUG', 'inactiveCategories', JSON.stringify(inactiveCategories));
			
			nlapiLogExecution('DEBUG', 'ECQS.getCategories', JSON.stringify(ret));

			return ret || [];
		} catch(e){

			return e;
		}	
	}
}