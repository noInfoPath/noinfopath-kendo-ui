//datepicker.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", "$timeout", function(noFormConfig, $state, $timeout) {
			function _link(scope, el, attrs) {
				return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
					.then(function(config) {
						var input = angular.element("<input type=\"date\">"),
							datePicker,
							internalDate;

						config = noInfoPath.getItem(config, attrs.noForm);

						//input.attr("value", internalDate);

						//Kendo binding happens early.
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


						//Add input element to DOM.
						el.append(input);

						//Create the Kendo date picker.
						datePicker = input.kendoDatePicker(config.options).data("kendoDatePicker");

						// internalDate = noInfoPath.getItem(scope, config.ngModel);
						//
						// if(internalDate) {
						//     datePicker.value(new Date(internalDate));
						// } else {
						//     datePicker.value(null);
						// }



						//put back resolved
						// noInfoPath.setItem(scope, config.ngModel, internalDate);
						//

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
						//when the internal date is falsey set it to null for Kendo compatibility
						//default display is empty
						//noInfoPath.setItem(scope, config.ngModel, internalDate ? internalDate : null);

					});

			}

			function _compile(el, attrs) {
				if (attrs.$attr.required) {
					el.removeAttr("required");
					var inputHidden = angular.element("<input />");

					inputHidden.attr("type", "hidden");
					inputHidden.attr("required", "required");

					inputHidden.attr("ng-model", attrs.ngModel);
					inputHidden.attr("name", attrs.noModel);

					el.append(inputHidden);
				}
				return _link;
			}


			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;



		}]);

})(angular);
