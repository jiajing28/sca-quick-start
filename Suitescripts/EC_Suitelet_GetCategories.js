/**
 * Company           Explore Consulting
 * Copyright         2015 Explore Consulting, LLC
 * Description       Get all custom category records
 **/

EC.onStart = function (request, response) {
    var ret = [];
    var categoryRecords = nlapiSearchRecord('customrecord_ecqs_category');

    var categoryRecordIds = _.pluck(categoryRecords, 'id');
    
    _.each(categoryRecordIds, function(categoryRecordId) {
        var records = nlapiLoadRecord('customrecord_ecqs_category', categoryRecordId);
        var img = null;
        nlapiLogExecution('DEBUG', 'record', records);

        //nlapiLogExecution('DEBUG', 'all fields', JSON.stringify(records.getAllFields()));

        if (records.getFieldValue('custrecord_ecqs_category_thumbnail')) {



        	nlapiLogExecution('DEBUG', 'yes thumbnail', 'yes thumbnail');

        	nlapiLogExecution('DEBUG', 'custrecord_ecqs_category_thumbnail', records.getFieldValue('custrecord_ecqs_category_thumbnail'));

        	img = nlapiLoadFile(records.getFieldValue('custrecord_ecqs_category_thumbnail')).getURL();

        	nlapiLogExecution('DEBUG', 'custrecord_ecqs_category_thumbnail img', img);

        }

        ret.push(records);

        var lastAddedElement = JSON.parse(JSON.stringify(ret[ret.length-1]));
        nlapiLogExecution('DEBUG', 'ret[ret.length-1]', JSON.stringify(lastAddedElement));

        nlapiLogExecution('DEBUG', 'clone', JSON.stringify(_.clone(lastAddedElement)));

        var newObj = _.extend(_.clone(lastAddedElement), {thumbnail: img});
        //lastAddedElement.custrecord_ecqs_category_thumbnail.url = img;

        ret[ret.length-1] = newObj;
    });

    response.setContentType('JSON');
    response.write(JSON.stringify(ret || []));
};

Log.AutoLogMethodEntryExit(undefined, false,false,true);