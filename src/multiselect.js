//multiselect.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoMultiSelect", ["noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function(noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function _compile(el, attrs) {
				var noForm = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					config = noInfoPath.getItem(noForm, attrs.noForm),
					input = angular.element("<select/>");


				el.append(input);

				return _link.bind(null, config);
			}

			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noKendoMultiSelect.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource,
					multiSelect;

				//if(!entity) throw dsCfg.entityName + " not found in provider " + dsCfg.dataProvider;

				dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

				kendoOptions.dataSource = dataSource;

				kendoOptions.change = function(e) {
					var value = this.value();
					noInfoPath.setItem(scope, config.noKendoMultiSelect.ngModel, value);
				};

				if (config.noKendoMultiSelect.waitFor) {
					scope.$watch(config.noKendoMultiSelect.waitFor.property, function(newval) {
						if (newval) {
							var values = _.pluck(newval, config.noKendoMultiSelect.waitFor.pluck);

							noInfoPath.setItem(scope, config.noKendoMultiSelect.ngModel, values);

							scope[config.scopeKey + "_multiSelect"].value(values);
						}
					});
				}


				scope[config.scopeKey + "_multiSelect"] = el.kendoMultiSelect(kendoOptions).data("kendoMultiSelect");

			}


			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;

		}]);

})(angular);
