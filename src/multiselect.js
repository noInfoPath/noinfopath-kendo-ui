//multiselect.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoMultiSelect", ["noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function(noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {

			function _watch(dsCfg, filterCfg, valueObj, newval, oldval, scope) {
			    console.warn("NOTE: noKendoMultiSelect does not support compound filters");
				var component = scope[dsCfg.entityName + "_multiSelect"],
					filters, filter;

				this.value = newval;

				//console.log("KendoMultiSelect Watch CB", dsCfg.entityName + "_multiSelect", newval);

				if (component && newval) {
					filters = component.dataSource.filter();
					filter = _.find(filters.filters, {
						field: filterCfg.field
					});
					if (filter) {
						filter.value = newval;
					}
					component.dataSource.page(0);
					component.refresh();

					//scope.$broadcast(dsCfg.entityName + "_multiSelect::populated");
				}
			}

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

				dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope, _watch);

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

							scope[dsCfg.entityName + "_multiSelect"].value(values);
						}
					});
				}

				scope[dsCfg.entityName + "_multiSelect"] = el.kendoMultiSelect(kendoOptions).data("kendoMultiSelect");

			}

			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;

		}]);

})(angular);
