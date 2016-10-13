//autocomplete.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		/*
		*	## Directive noKendoAutoComplete($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, lodash)
		*
		*	`noKendoAutoComplete` is a directive that creates a kendo databound input of type text.
		*
		*	### Parameters
		*
		*	|Name|Type|Description|
		*	|----|----|-----------|
		*	|$compile|Object|Angular.js compile provider object|
		*	|noFormConfig|Object|NoInfoPath noFormConfig object. Located within noinfopath.forms|
		*	|$state|Object|ui-router state provider object|
		*	|noLoginService|Object|NoInfoPath noLoginService object. Located within noinfopath.user|
		*	|noKendoDataSourceFactory|Object|NoInfoPath noKendoDataSourceFactory object. Located within noinfopath.kendo.ui|
		*	|lodash|Object|Lodash provider object|
		*
		*	### Configuration
		*
		*	The noKendoDataSource can have all of kendo supported configuration configured within the noKendoAutoComplete.options object.
		*	There are some specific configuration values for the noInfoPath noKendoAutoComplete directive, which are detailed below.
		*
		*	|Name|Type|Description|
		*	|----|----|-----------|
		*	|scopeKey|string|The scope key that the directive will store the value of the noKendoAutoComplete|
		*	|noKendoAutoComplete|object|Configuration object specific to the noKendoAutoComplete|
		*	|noKendoAutoComplete.options|object|Configuration for a kendoAutoComplete module|
		*	|noKendoAutoComplete.ngModel|string|The scope key where the noKendoAutoComplete will be databound to|
		*	|noKendoAutoComplete.waitFor|object|Configuration object to have the noKendoAutoComplete wait for a property on the scope and updates the kendo data model with the configured property|
		*	|noKendoAutoComplete.waitFor.property|string|The property on the scope to watch. Watches only for truthy values|
		*	|noKendoAutoComplete.waitFor.pluck|string|Plucks the configured property off the object being watched on the scope. It then sets those values on the scope based on the noKendoAutoComplete.ngModel property and updates the kendo data model with the same values.|
		*	|noDataSource|object|A noInfoPath noDataSource configuration object. See noInfoPath.data documentation|
		*	|noKendoDataSource|object|A noInfoPath configuration to pass into noKendoDataSourceFactory. See noKendoDataSourceFactory documentation|
		*
		*	### Example Configuration
		*
		*	```json
		*	...
		*	"trial" : {
		*		"scopeKey": "trialList",
		*		"noKendoAutoComplete": {
		*			"options": {
		*				...
		*			},
		*			"ngModel": "Trial",
		*			"waitFor": {
		*				"property": "trialPlot",
		*				"pluck": "TrialPlotID"
		*			}
		*		},
		*		"noDataSource" :{
		*			...
		*		},
		*		"noKendoDataSource": {
		*			...
		*		}
		*	}
		*	```
		*
		*/
		.directive("noKendoAutoComplete", ["$compile", "noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			/**
			*	### Private Function _compile(el, attrs)
			*
			*	`_compile` is the compile function for the noKendoAutoComplete directive.
			*	It uses `noFormConfig` to get the noForm configuration based on the current
			*	state, and uses the attribute on the element to get the configuration specific
			*	to the noKendoAutoComplete element. It binds the noForm configuration to `_link`
			*	before returning the `_link` function.
			*
			*	This function also appends an input tag of type text to the directive element.
			*
			*	#### Parameters
			*
			*	|Name|Type|Description|
			*	|----|----|-----------|
			*	|el|Object|A jQuery object of the directive element. Provided by angular.js|
			*	|attrs|Object|An object of the attributes on the directive element. Provided by angular.js|
			*
			*	#### Returns function specific for angular.js directive code.
			*/
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm),
					input = angular.element("<input type=\"text\"/>");

				el.append(input);

				return _link.bind(null, noForm);
			}

			/**
			*	### Private Function _link(config, scope, el, attrs)
			*
			*	`_link` is the link function for the noKendoAutoComplete directive.
			*	Utilizing the noForm configuration bound into it from the `_compile` function,
			*	the `_link` function parses out the specific configuration for the noKendoAutoComplete
			*	directive and enables a data driven way to configure the noKendoAutoComplete element.
			*
			*	Since this is a kendo databound element, the configuration is similar to a kendo dataSource object.
			*	However, this directive expands on kendo's kendoAutoComplete module by providing additional functionality.
			*
			*	Configuration can have a waitFor object that looks for a specific property on the scope,
			*	and once it has a truthy value for that property on the scope, it pulls values based on that
			*	configuraiton. After it finds the values, it sets them on the scope and updates the values
			*	within the kendo data model.
			*
			*	This directive also puts the current selected value of the noKendoAutoComplete onto the scope to allow for angular
			*	binding for a multitude of potential purposes, saving with noForms being the a reason.
			*
			*	#### Parameters
			*
			*	|Name|Type|Description|
			*	|----|----|-----------|
			*	|config|Object|A NoInfoPath noForm configuration object bound in by the `_compile` function|
			*	|scope|Object|A scope object provided by angular.js|
			*	|el|Object|A jQuery object of the noKendoAutoComplete directive element|
			*	|attrs|Object|An object of all the attributes on the noKendoAutoCompelte directive element. Provided by angular.js|
			*
			*	#### Returns Object specific for Angular.js directive code
			*/
			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noKendoAutoComplete.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

				kendoOptions.dataSource = dataSource;

				kendoOptions.change = function(e) {
					var value = this.dataItem(this.current());

					if (!value) {
						value = {};
					}

					value[kendoOptions.dataTextField] = this.value();

					noInfoPath.setItem(scope, config.noKendoAutoComplete.ngModel, value);

					scope.$apply();
				};

				if (config.noKendoAutoComplete.waitFor) {
					scope.$watch(config.noKendoAutoComplete.waitFor.property, function(newval) {
						if (newval) {
							var values = _.pluck(newval, config.noKendoAutoComplete.waitFor.pluck);

							noInfoPath.setItem(scope, config.noKendoAutoComplete.ngModel, values);

							scope[config.scopeKey + "_autoComplete"].value(values);
						}
					});
				}

				scope[config.scopeKey + "_autoComplete"] = el.find("input").kendoAutoComplete(kendoOptions).data("kendoAutoComplete");
			}

			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;
		}]);
})(angular);
