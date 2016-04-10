//datepicker.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", "$timeout", function(noFormConfig, $state, $timeout) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm),
					input = angular.element("<input type=\"date\">");

				if (config.binding === "kendo") {
					input.attr("name", config.kendoModel);
					input.attr("data-bind", "value: " + config.kendoModel);
					config.options.change = function(data) {
						var tmp = noInfoPath.getItem(scope, config.ngKendo);
						tmp.set(config.kendoModel, this.value());
						//noInfoPath.setItem(scope, config.ngKendo, this.value());
					};

					internalDate = new Date(noInfoPath.getItem(scope, config.ngModel));
				}

				if (config.disabled === true) {
					input.attr("disabled", true);
				}

				if (attrs.$attr.required) {
					el.removeAttr("required");
					var inputHidden = angular.element("<input />");

					inputHidden.attr("type", "hidden");
					inputHidden.attr("required", "required");

					inputHidden.attr("ng-model", attrs.ngModel);
					inputHidden.attr("name", attrs.noModel);

					el.append(inputHidden);
				}

				el.append(input);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				var
					datePicker,
					internalDate;

				//Create the Kendo date picker.
				datePicker = el.find("input[type='date']").kendoDatePicker(config.options).data("kendoDatePicker");

				/*
				 *   #### @property binding
				 *
				 *   When binding property is `ng` or undefined use
				 *   Angular scope for setting and getting the date
				 *   picker's value.  Otherwise, using kendo model for
				 *   getting and setting data.
				 *
				 */
				if (config.binding === "ng" || config.binding === undefined) {
					datePicker.value(new Date(noInfoPath.getItem(scope, config.ngModel)));

					scope.$watch(config.ngModel, function(newval, oldval) {
						if (newval != oldval) {
							if (newval !== null) {
								datePicker.value(new Date(newval));
							} else if (config.initValue === true) {
								noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(new Date()));

								// if something overwrites the value of the date picker
								// (loading of a record with null data for example) this
								// will default to a new date if the initValue parameter is true.
								// Assume that if a date has an initValue that the field is required.
							}
						}
					});

					datePicker.bind("change", function() {
						var newDate = angular.isDate(this.value()) ? noInfoPath.toDbDate(this.value()) : null;

						noInfoPath.setItem(scope, config.ngModel, newDate);
						//this will solve the issue of the data not appearing on the scope
						scope.$apply();
					});

					internalDate = noInfoPath.getItem(scope, config.ngModel);
				}

				if ((config.initValue === undefined || config.initValue) && !internalDate) {
					internalDate = noInfoPath.toDbDate(new Date());
				}

				datePicker.value(new Date(internalDate));

				//fixing the issue where the data is not on the scope on initValue load
				noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(internalDate));

				$timeout(function() {
					scope.$apply();
				});


			}


			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;



		}]);

})(angular);
