//autocomplete.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoAutoComplete", ["$compile", "noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm),
					input = angular.element("<input type=\"text\"/>");

				input.attr("k-ng-model", noForm.noKendoAutoComplete.kNgModel);
				input.attr("ng-model", noForm.noKendoAutoComplete.ngModel);
				el.append(input);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noKendoAutoComplete.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource = noKendoDataSourceFactory.create(attrs.noForm, noLoginService.user.userId, config, scope);

				kendoOptions.dataSource = dataSource;
				//
				// kendoOptions.change = function(e) {
				// 	var value = this.dataItem(this.current());
				//
				// 	if (!value) {
				// 		value = {};
				// 	}
				//
				// 	value[kendoOptions.dataTextField] = this.value();
				//
				// 	noInfoPath.setItem(scope, config.noKendoAutoComplete.ngModel, value);
				//
				// 	scope.$apply();
				// };

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
