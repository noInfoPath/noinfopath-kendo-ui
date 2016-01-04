//multiselect.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoMultiSelect", ["noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function(noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function configure(config, scope, el) {
				var kendoOptions = config.noKendoMultiSelect.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource;

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

			function _link(scope, el, attrs) {
				return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
					.then(function(config) {
						var input = angular.element("<select>"),
							multiSelect;

						config = noInfoPath.getItem(config, attrs.noForm);

						//noInfoPath.setItem(scope, config.ngModel,new Date());



						el.append(input);

						configure(config, scope, el);

					});

			}


			directive = {
				restrict: "E",
				link: _link,
				scope: false
			};

			return directive;



		}]);

})(angular);
