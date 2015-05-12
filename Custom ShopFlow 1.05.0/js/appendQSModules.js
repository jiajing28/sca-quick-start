SC.appendQSModules = function ()
{
	'use strict';

	var appendQSModuleApplication = SC.Application('Shopping');

	
	console.log('beforeSTart');
	console.log(SC.ECModules);
	_.each(SC.ECModules, function(module) {
		appendQSModuleApplication.Configuration.modules.push(module);
		console.log('append');
	});

};

SC.appendQSModules();


