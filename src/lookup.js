//lookup.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoLookup", ["$compile", "noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm);
					select = angular.element("<select></select>");

				el.append(select);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noLookup.options ? config.noLookup.options : {dataTextField: config.noLookup.textField, dataValueField: config.noLookup.valueField},
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

				kendoOptions.dataSource = dataSource;
				kendoOptions.value = noInfoPath.getItem(scope, config.noLookup.ngModel);

				kendoOptions.change = function(e) {
					var value = this.dataItem(this.current());

					if (!value) {
						value = {};
					}

					//value[kendoOptions.dataTextField] = this.value();

					noInfoPath.setItem(scope, config.noLookup.ngModel, this.value());
					scope[config.noLookup.scopeKey].dirty = true;
					scope.$apply();
				};

				scope[config.scopeKey + "_lookup"] = el.find("select").kendoDropDownList(kendoOptions).data("kendoLookup");

				// if (config.noKendoLookup.waitFor) {
				// 	scope.$watch(config.noKendoLookup.waitFor.property, function(newval) {
				// 		if (newval) {
				// 			var values = _.pluck(newval, config.noKendoLookup.waitFor.pluck);
				//
				// 			noInfoPath.setItem(scope, config.noKendoLookup.ngModel, values);
				//
				// 			scope[config.scopeKey + "_lookup"].value(values);
				// 		}
				// 	});
				// }

			}


			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;

		}]);

})(angular);
