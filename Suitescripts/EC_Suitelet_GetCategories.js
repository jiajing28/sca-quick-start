/**
 * Company           Explore Consulting
 * Copyright         2015 Explore Consulting, LLC
 * Description       Get all custom category records
 **/

EC.onStart = function (request, response) {
    try{
        var ret = [];
        var FILENAME = 'EC_ECQS_CategoryCache.json';

        var ECQSCategoryJson = nlapiLoadFile(FILENAME);
        ret = ECQSCategoryJson.getId();

        //var ECQSCategoryJson = nlapiRequestURL('https://system.na1.netsuite.com/core/media/media.nl?id=35416&c=TSTDRV1244478&h=d4554849b83051c5ef84&mv=idaihd1k');
        //ret = ECQSCategoryJson.getBody();
        nlapiLogExecution('DEBUG', 'ECQSCategoryJson', JSON.stringify(ret));

        response.setContentType('JSON');
        response.write(JSON.stringify(ret || []));
    } catch(e){
        response.write(e);
    }
};

Log.AutoLogMethodEntryExit(undefined, false,false,true);