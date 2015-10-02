define('ECCategories.Views', ['Facets.Model', 'Facets.Views', 'OrderedItems.Model'], function (FacetModel, FacetViews, OrderedItemModel)
{
    'use strict';

    var statuses = window.statuses = {}
        ,	collapsable_elements = window.collapsable_elements = {};

    return FacetViews.Browse.extend({

        title: ''
        ,	page_header: ''
        ,	template: 'facet_browse'

        ,	initialize: function (options)
        {
            this.application = options.application;
            this.catModel = options.catModel;
            this.itemListModel = options.itemListModel;
            this.translator = options.translator;
            this.title = this.catModel.custrecord_ecqs_category_page_title;
            this.page_header = this.catModel.custrecord_ecqs_category_displayname || this.catModel.name;
            this.setMetaTags();

            this.statuses = statuses;
            this.collapsable_elements = collapsable_elements;

            this.template = this.catModel.custrecord_ecqs_category_tmpl_page ? this.catModel.custrecord_ecqs_category_tmpl_page.name : this.template;

            this.collapsable_elements['facet-header'] = this.collapsable_elements['facet-header'] || {
                selector: 'this.collapsable_elements["facet-header"]'
                ,	collapsed: false
            };

            this.parent('inherit', this.options);			// inherit options from Facets.Views.js
        }

        // view.getBreadcrumb:
        // It will generate an array suitable to pass it to the breadcrumb macro
        ,	getBreadcrumb: function ()
        {
            var category_string = ''
                ,	breadcrumb = [{
                    href: '/'
                    ,	text: _('Home').translate()
                }];

            // CUSTOMIZATION
            // iterate through breadcrumbs from ECQS category record and add to breadcrumbs
            for (var i = 1; i <= 5; i++) {
                if (this.catModel['custrecord_ecqs_category_crumb_'+i]) {
                    var categoryId = this.catModel['custrecord_ecqs_category_crumb_'+i].internalid;
                    var breadcrumbCat = _.find(ECQS.categories,  function(e) { return e.id == categoryId });
                    category_string += breadcrumbCat.custrecord_ecqs_category_url + '/';
                }
            }
            category_string += this.translator.getFacetValue('category');

            if (category_string)
            {
                var category_path = '';

                var tokens = category_string && category_string.split('/') || [];
                if (tokens.length && tokens[0] === '')
                {
                    tokens.shift();
                }

                _.each(tokens, function (cat)
                {
                    var thisCategory = _.findWhere(ECQS.categories, {custrecord_ecqs_category_url : cat });
                    category_path = '/'+cat;
                    breadcrumb.push({
                        href: category_path
                        ,	text: _(thisCategory.custrecord_ecqs_category_displayname || thisCategory.name).translate()
                    });
                });
            }
            else if (this.translator.getOptionValue('keywords'))
            {
                breadcrumb.push({
                    href: '#'
                    ,	text: _('Search Results').translate()
                });
            }
            else
            {
                breadcrumb.push({
                    href: '#'
                    ,	text: _('Shop').translate()
                });
            }

            return breadcrumb;
        }

        // view.showContent:
        // Works with the title to find the proper wording and calls the layout.showContent
        ,	showContent: function (showFacets)
        {
            // If its a free text search it will work with the title
            var keywords = this.translator.getOptionValue('keywords')
            ,	resultCount = this.model.get('total')
            ,	self = this;

            if (keywords)
            {
                keywords = decodeURIComponent(keywords);

                if (resultCount > 0)
                {
                    this.subtitle =  resultCount > 1 ? _('Results for "$(0)"').translate(keywords) : _('Result for "$(0)"').translate(keywords);
                }
                else
                {
                    this.subtitle = _('We couldn\'t find any items that match "$(0)"').translate(keywords);
                }
            }

            this.totalPages = Math.ceil(resultCount / this.translator.getOptionValue('show'));

            // once the showContent is done the afterAppend is called
            this.application.getLayout().showContent(this).done(function ()
            {
                if (showFacets) {
                    // Looks for placeholders and injects the facets
                    self.renderFacets(self.translator.getUrl());

                    // CUSTOMIZATION
                    // add item list block
                    if (self.catModel.itemIds) {
                        self.getAllItemList();
                    }

                }
            });
        }

        ,	getAllItemList: function()
        {
            var self = this
            ,	itemIdCount = 10
                ,   ids = self.catModel.itemIds
            ,	numOfItemIds = ids.length
            ,	promises = []
            ,	numOfCalls = numOfItemIds % itemIdCount == 0 ? Math.floor(numOfItemIds / itemIdCount) : Math.floor(numOfItemIds / itemIdCount) + 1;

            for (var i = 0; i < numOfCalls; i++) {
                var itemIdArray = ids.slice(i * itemIdCount, (i+1)*itemIdCount)
                    ,	promise = self.loadItemListModel(itemIdArray);

                promises.push(promise);
            }

            jQuery.when.apply(jQuery, promises)
                .done(function() {

                    var items = []

                    for (var i = 0; i < arguments.length; i++) {
                        var item = arguments[i][0] ? arguments[i][0].items : arguments[i].items;
                        items = items.concat(item);
                    }

                    var itemListModel = new OrderedItemModel({
                        data: ids.join()
                    });

                    itemListModel.set('items', items);
                    self.itemListModel = itemListModel;

                    self.appendItemList(itemListModel);

                }).fail(function() {
                    // something went wrong here, handle it
                });
        }

        ,	loadItemListModel: function(itemIdArray)
        {
            var self = this
                ,	itemListModel = new OrderedItemModel(
                    {
                        data: itemIdArray.join()
                    })
                ,	modelData = self.translator.getApiParams();

            modelData.id = itemIdArray.join();		// max 10 ids per call
            modelData = _.omit(modelData, 'category');

            return itemListModel.fetch({
                data: modelData
                ,	killerId: this.application.killerId
                ,	pageGeneratorPreload: true
            });
        }

        // view.renderFacets:
        // Generates a new translator, grabs the facets of the model,
        // look for elements with data-type="facet" or data-type="all-facets"
        // and then execute all the macros and injects the results in the elements
        ,	renderFacets: function (url)
        {
            var self = this
                ,	translator = this.translator		// CUSTOMIZATION: pull from translator passed into view instead of creating new translator from url
                ,	facets = this.model.get('facets') || [];


            this.$('div[data-type="facet"]').each(function (i, nav)
            {
                var $nav = jQuery(nav).empty()
                    ,	facet_id = $nav.data('facet-id')
                    ,	facet_config = translator.getFacetConfig( facet_id )
                    ,	facet_macro = $nav.data('facet-macro') || facet_config.macro || self.application.getConfig('macros.facet')
                    ,	facet = _.find(facets, function (facet) {
                        return facet.id === facet_id;
                    });

                $nav.append( SC.macros[ facet_macro ](translator, facet_config, facet) );
            });

            this.$('div[data-type="all-facets"]').each(function (i, nav)
            {
                var $nav = jQuery(nav).empty()
                    ,	exclude = _.map( ( $nav.data('exclude-facets') || '').split(','), function (result) {
                        return jQuery.trim( result );
                    })
                    ,	ordered_facets = facets && facets.sort(function (a, b) {
                            // Default Prioriry is 0
                            return (translator.getFacetConfig(b.id).priority || 0) - (translator.getFacetConfig(a.id).priority || 0);
                        })
                    ,	content = '';

                _.each(ordered_facets, function (facet)
                {
                    var facet_config = translator.getFacetConfig(facet.id);
                    if ( !_.contains(exclude, facet.id) )
                    {
                        content += SC.macros[facet_config.macro || self.application.getConfig('macros.facet')](translator, facet_config, facet);
                    }
                });

                $nav.append( content );
            });


            this.$('[data-toggle="collapse"]').each(function (index, collapser)
            {
                self.fixStatus(collapser);
            });

            this.$('[data-toggle="slider"]').slider();
        }

        // view.appendItemList:
        // Add Item List block to view
        ,	appendItemList:function(itemListModel)
        {
            var self = this
                , 	cellTemplate = self.catModel.custrecord_ecqs_category_tmpl_cell.name
                , 	itemListSection = self.$('section#item-list-container');

            if (SC.macros[cellTemplate]) {
                itemListSection.append( SC.macros[cellTemplate](self, itemListModel));
            }
        }

        ,	setMetaTags: function ()
        {
            var metaTags = jQuery('<head/>').html(
                jQuery.trim(
                    this.catModel.custrecord_ecqs_category_meta_tag_html
                )
            ).children('meta');

            var description = _.findWhere(metaTags, {name:"description"});
            var keywords = _.findWhere(metaTags, {name:"keywords"});

            if (description) {
                this.metaDescription = jQuery(description).attr('content');
            }

            if (keywords) {
                this.metaKeywords = jQuery(keywords).attr('content');
            }

            this.metaTags = metaTags;
        }

        ,	getMetaTags: function ()
        {
            return this.metaTags;
        }
    });
});