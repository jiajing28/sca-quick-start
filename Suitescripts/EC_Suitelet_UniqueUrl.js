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
    return EC.createSearch('item', [['isonline', 'is', 'T'],'AND',['urlcomponent', 'isnot', '']], [['internalid'], ['urlcomponent']])
       .nsSearchResult2obj().toArray();

     /*
    var filters = [];
    filters.push(new nlobjSearchFilter('isonline', null, 'is', 'T'));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filters.push(new nlobjSearchFilter('urlcomponent', null, 'isnot', ''));

    var columns = [];
    columns.push(new nlobjSearchColumn('urlcomponent'));

    var search = nlapiCreateSearch('item', filters, columns);

    return search.runSearch();
    */
};

EC.onStart = function (request, response) {

    var searchResult = EC.findAllItemUrlComponent();

    Log.d("search result full", searchResult);
    /*
    searchResult.take(100).each(function (result) {
       Log.d("search result", result);
    });*/

    _.each(searchResult, function() {

    });
    
/*
    var filters = [];
    filters.push(new nlobjSearchFilter('isonline', null, 'is', 'T'));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filters.push(new nlobjSearchFilter('urlcomponent', null, 'isnot', ''));

    var columns = [];
    columns.push(new nlobjSearchColumn('urlcomponent'));

    var search = nlapiCreateSearch('item', filters, columns);

    var searchResult = search.runSearch();

    var firstHundredResults = searchResult.getResults(0, 99);
    for (var i = 0; i < firstHundredResults.length; i++) {
       //var msg = "urlcomponent:" + firstHundredResults[i].getValue("urlcomponent");
       Log.d("search result", firstHundredResults[i].getValue(columns[0]));
    }
*/


    /*
    response.setContentType('JSON');

    Log.a('sliderImgs', ret);

    response.write(JSON.stringify(ret || []));
    */
};

Log.AutoLogMethodEntryExit(undefined, false,false,true);