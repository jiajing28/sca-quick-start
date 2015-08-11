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

        if (records.getFieldValue('custrecord_ecqs_category_thumbnail')) {

            //nlapiLogExecution('DEBUG', 'yes thumbnail', 'yes thumbnail');

            //nlapiLogExecution('DEBUG', 'custrecord_ecqs_category_thumbnail', records.getFieldValue('custrecord_ecqs_category_thumbnail'));

            img = nlapiLoadFile(records.getFieldValue('custrecord_ecqs_category_thumbnail')).getURL();

            //nlapiLogExecution('DEBUG', 'custrecord_ecqs_category_thumbnail img', img);

        }

        ret.push(records);

        var lastAddedElement = JSON.parse(JSON.stringify(ret[ret.length-1]));
        var newObj = _.extend(_.clone(lastAddedElement), {thumbnail: img});

        ret[ret.length-1] = newObj;
    });

    response.setContentType('JSON');
    response.write(JSON.stringify(ret || []));
};

Log.AutoLogMethodEntryExit(undefined, false,false,true);