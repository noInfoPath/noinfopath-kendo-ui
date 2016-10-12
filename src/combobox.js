//combobox.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoCombobox", ["$compile", "noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm),
					input = angular.element("<input type=\"text\"/>");

				el.append(input);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noKendoCombobox.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

				kendoOptions.dataSource = dataSource;

				kendoOptions.change = function(e) {
					var value = this.dataItem(this.current());

					if (!value) {
						value = {};
					}

					value[kendoOptions.dataTextField] = this.value();

					noInfoPath.setItem(scope, config.noKendoCombobox.ngModel, value);

					scope.$apply();
				};

				if (config.noKendoCombobox.waitFor) {
					scope.$watch(config.noKendoCombobox.waitFor.property, function(newval) {
						if (newval) {
							var values = _.pluck(newval, config.noKendoCombobox.waitFor.pluck);

							noInfoPath.setItem(scope, config.noKendoCombobox.ngModel, values);

							scope[config.scopeKey + "_combobox"].value(values);
						}
					});
				}

				scope[config.scopeKey + "_combobox"] = el.find("input").kendoComboBox(kendoOptions).data("kendoComboBox");
			}

			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;

		}]);

})(angular);
