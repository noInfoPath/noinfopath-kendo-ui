//datepicker.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", "$timeout", function(noFormConfig, $state, $timeout) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm),
					input = angular.element("<input type=\"date\">");

				el.empty();

				if (noForm.binding === "kendo") {
					input.attr("name", noForm.kendoModel);
					//	input.attr("data-bind", "value: " + noForm.kendoModel);
					// config.options.change = function(data) {
					// 	var tmp = noInfoPath.getItem(scope, config.ngKendo);
					// 	tmp.set(config.kendoModel, this.value());
					// 	//noInfoPath.setItem(scope, config.ngKendo, this.value());
					// };

					// internalDate = new Date(noInfoPath.getItem(scope, noForm.ngModel));
				}


				if (noForm.disabled === true) {
					input.attr("disabled", true);
				}


				//Warn: this usage is deprecated.  Use noForm.required instead.
				if (attrs.$attr.required || noForm.required) {
					el.removeAttr("required");
					var inputHidden = angular.element("<input />");

					inputHidden.attr("type", "hidden");
					inputHidden.attr("required", "required");

					inputHidden.attr("ng-model", attrs.ngModel || noForm.ngModel);
					//inputHidden.attr("name", attrs.noModel);

					el.append(inputHidden);
				}

				el.append(input);

				return _link.bind(null, noForm);
			}

			function _link(noForm, scope, el, attrs) {
				var
					datePicker,
					internalDate;

				if (noForm.binding === "kendo") {
					noForm.options.change = function(data) {
						var tmp = noInfoPath.getItem(scope, noForm.ngKendo);
						tmp.set(noForm.kendoModel, this.value());
						//noInfoPath.setItem(scope, config.ngKendo, this.value());
					};

					internalDate = noInfoPath.getItem(scope, noForm.ngModel);
				}

				//Create the Kendo date picker.
				datePicker = el.find("input[type='date']").kendoDatePicker(noForm.options).data("kendoDatePicker");

				/*
				 *   #### @property binding
				 *
				 *   When binding property is `ng` or undefined use
				 *   Angular scope for setting and getting the date
				 *   picker's value.  Otherwise, using kendo model for
				 *   getting and setting data.
				 *
				 */
				if (noForm.binding === "ng" || noForm.binding === undefined) {
					//datePicker.value(new Date(noInfoPath.getItem(scope, noForm.ngModel)));

					scope.$watch(noForm.ngModel, function(newval, oldval) {
						if (newval != oldval) {
							if (newval !== null) {
								console.log(new Date(noInfoPath.toDisplayDate(newval)));
								datePicker.value(new Date(noInfoPath.toDisplayDate(newval)));
							} else if (noForm.initValue === true) {
								noInfoPath.setItem(scope, noForm.ngModel, new Date());

								// if something overwrites the value of the date picker
								// (loading of a record with null data for example) this
								// will default to a new date if the initValue parameter is true.
								// Assume that if a date has an initValue that the field is required.
							}
						}
					});

					datePicker.bind("change", function() {
						var newDate = angular.isDate(this.value()) ? this.value() : null;

						noInfoPath.setItem(scope, noForm.ngModel, newDate);
						//this will solve the issue of the data not appearing on the scope
						scope.$apply();
					});

					internalDate = noInfoPath.getItem(scope, noForm.ngModel);
				}

				if ((noForm.initValue === undefined || noForm.initValue) && !internalDate) {
					internalDate = new Date();
				}

				// console.log(internalDate);
				// console.log(noInfoPath.toDisplayDate(new Date(internalDate)));
				datePicker.value(noInfoPath.toDisplayDate(new Date(internalDate)));

				//fixing the issue where the data is not on the scope on initValue load
				noInfoPath.setItem(scope, noForm.ngModel, noInfoPath.toDbDate(internalDate));

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
