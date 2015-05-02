SC.appendQSModules = function ()
{
	'use strict';

	var application = SC.Application('Shopping');

	_.each(SC.ECModules, function(module) {
		application.Configuration.modules.push(module);
	});
};

SC.appendQSModules();


