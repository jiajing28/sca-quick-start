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
EC.findSliderByName = function (name) {
    EC.enableLazySearch();
    // get the first result from the search
    return EC.createSearch('customrecord_ecqs_slider', [['name', 'is', name]], [['internalid'], ['isinactive']])
        .nsSearchResult2obj().first();
};

EC.onStart = function (request, response) {
    var name = request.getParameter('name');
    Log.a('sliderImgs', 'name = ' + name);

    var searchResult = EC.findSliderByName(name);

    if (searchResult.isinactive == 'F') {
        // get the slider with its custom sublist
        var slider = nsdal.loadObject('customrecord_ecqs_slider', searchResult.internalid, [])
            .withSublist('recmachcustrecord_ecqs_slide_parent', [ // desired sublist fields
                'custrecord_ecqs_slide_img_desktop', 'custrecord_ecqs_slide_img_mobile',
                'custrecord_ecqs_slide_alt', 'custrecord_ecqs_slide_link', 'custrecord_ecqs_slider_slide_caption'
            ]
        );

        // turn each parent into a javascript object for the suitelet response
        var ret = _.map(slider.recmachcustrecord_ecqs_slide_parent, function (p) {
            var imgdesktopID = p.custrecord_ecqs_slide_img_desktop;
            var imgmobileID = p.custrecord_ecqs_slide_img_mobile;
            var imgdesktop = imgdesktopID ? nlapiLoadFile(imgdesktopID).getURL() : '';
            var imgmobile = imgmobileID ? nlapiLoadFile(imgmobileID).getURL() : '';

            return {
                imgdesktop: imgdesktop
                , imgmobile: imgmobile
                , alttext: p.custrecord_ecqs_slide_alt
                , link: p.custrecord_ecqs_slide_link
                , caption: p.custrecord_ecqs_slider_slide_caption
            }
        });
    }
    response.setContentType('JSON');

    Log.a('sliderImgs', ret);

    response.write(JSON.stringify(ret || []));
};

Log.AutoLogMethodEntryExit(undefined, false,false,true);