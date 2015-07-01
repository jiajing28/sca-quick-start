/**
 * Company           Explore Consulting
 * Copyright         2015 Explore Consulting, LLC
 * Description       Example conversion of the other getslider suitelet to use Explore coding style
 **/


/**
 * Searches NS for a single slider record by name
 * @param name name of the record (unique)
 * @returns internal id of the found record
 */
EC.findAllItemUrlComponent = function () {
    EC.enableLazySearch();
    // get the first result from the search
    return EC.createSearch('item', [['urlcomponent', 'isnot', '']], [['internalid'], ['urlcomponent']])
        .nsSearchResult2obj().toArray();
};

EC.findAllContentDelivery = function () {
    EC.enableLazySearch();

    var CONST_LANDING_PAGE_TYPE_ID = 1;
    // get the first result from the search
    return EC.createSearch('customrecord_ns_cd_query', [['custrecord_ns_cdq_pageid.custrecord_ns_cdp_type', 'is', CONST_LANDING_PAGE_TYPE_ID]], [['custrecord_ns_cdq_query']])
        .nsSearchResult2obj().toArray();
};



EC.onStart = function (request, response) {

    var params = request.getAllParameters();
    var newUrl = params['url'];

    var searchResult = EC.findAllItemUrlComponent();
    var cdSearchResult = EC.findAllContentDelivery();

    //Log.d("search result full", searchResult);

    //Log.d("search result cd", cdSearchResult);

    var trimmedCDUrls = _.map(_.pluck(cdSearchResult, 'custrecord_ns_cdq_query'), function(url){
        return url.substring(1);
    });

    //Log.d("trimmedCDUrls", trimmedCDUrls);

    var urls = _.uniq(_.union(_.pluck(searchResult, 'urlcomponent'), trimmedCDUrls));

    //Log.d("unique urls", urls);


    var isUniqueUrl = _.indexOf(urls, newUrl) < 0;

    if (isUniqueUrl) {
        var record = nlapiCreateRecord('noninventoryitem');
        record.setFieldValue( 'urlcomponent', newUrl);
        record.setFieldValue( 'taxschedule', '1');
        record.setFieldValue( 'itemid', 'url-' + newUrl);
        var id = nlapiSubmitRecord(record, true);

        var savedRecord = nlapiLoadRecord('noninventoryitem', id);
        var savedUrl = savedRecord.getFieldValue('urlcomponent');

        Log.d("savedUrl", savedUrl);
    }

    //Log.d("isUniqueUrl", isUniqueUrl);

     response.setContentType('JSON');

     response.write(JSON.stringify(urls || []));

};

Log.AutoLogMethodEntryExit(undefined, false,false,true);