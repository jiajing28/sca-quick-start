ECQS.startHeroSlider = function ()
{
	'use strict';
	
	var application = SC.Application('Shopping');

	var ecqs_modules = application.ECQSHeroSliderModules
	,	module_options = {}
	,	modules_list = _.map(ecqs_modules, function (module)
			{
				// we check all the options are strings
				if (_.isString(module))
				{
					return module;
				}
				// for the ones that are the expectation is that it's an array,
				// where the 1st index is the name of the modules and
				// the rest are options for the mountToApp function
				else if (_.isArray(module))
				{
					module_options[module[0]] = module.slice(1);
					return module[0];
				}
			});

	//console.log('module_options', module_options);
	
	require(modules_list, function ()
	{
		// then we set the modules to the aplication
		// the keys are the modules_list (names)
		// and the values are the loaded modules returned in the arguments by require.js
		application.ECQSmodules = _.object(modules_list, arguments);

		// we mount each module to our application
		_.each(application.ECQSmodules, function (module, module_name)
		{
			// We pass the application and the arguments from the config file to the mount to app function
			var mount_to_app_arguments = _.union([application], module_options[module_name] || []);
			if (module && _.isFunction(module.mountToApp))
			{
				application.modulesMountToAppResult[module_name] = module.mountToApp.apply(module, mount_to_app_arguments);
			}
		});

		application.getLayout().trigger('afterECQSSliderLoaded', application);

	});
	
	// remove the script added for load script function
	// only if the javascript environment is the seo server
	if (SC.ENVIRONMENT.jsEnvironment === 'server')
	{
		jQuery('.seo-remove').remove();
	}
	
	document.body.className = document.body.className + ' ECQS.startHeroSlider-' + SC.ENVIRONMENT.jsEnvironment;
	
};

ECQS.startHeroSlider();


