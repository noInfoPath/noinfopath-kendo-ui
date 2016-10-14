//datepicker.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		/*
		*	## Directive noKendoDatePicker(noFormConfig, $state, $timeout)
		*
		*	### Overview
		*	This directive creates a kendo databound inpyt of type date.
		*
		*	### Parameters
		*
		*	|Name|Type|Description|
		*	|----|----|-----------|
		*	|noFormConfig|Object|NoInfoPath noFormConfig object. Located within noinfopath.forms|
		*	|$state|Object|ui-router state provider object|
		*	|$timeout|Object|Angular.js timeout service|
		*
		*	### Configuration
		*
		*	The noKendoDatePicker configuration object can have all the kendo supported configuration configured within the noKendoDatePicker.options object.
		*	Other configuration properties are detailed below.
		*
		*	|Name|Type|Description|
		*	|----|----|-----------|
		*	|binding|String|The type of binding for the noKendoDatePicker. Defaults to "ng". Supported values are "kendo" and "ng"|
		*	|disabled|Boolean|Boolean value to have the date picker have the attribute of disabled|
		*	|required|Boolean|Boolean value to add the attribute of required to the datepicker|
		*	|initValue|Boolean|A boolean value that indicates if the noKendoDatePicker should have a initial value of `new Date()`. Defaults to true|
		*	|options|Object|An object of kendo's date picker configuration properties|
		*	|ngModel|String|The value on the scope to databind the datepicker to|
		*
		*/
		.directive("noKendoDatePicker", ["noFormConfig", "$state", "$timeout", function(noFormConfig, $state, $timeout) {
			/**
			*	### Private function _compile(el, attrs)
			*
			*	`_compile` is the compile function for the noKendoDatePicker directive.
			*	It uses `noFormConfig` to get the noForm configuration based on the current
			*	state, and uses the attribute on the element to get the configuration specific
			*	to the noKendoDatePicker element. It binds the noForm configuration to `_link`
			*	before returning the `_link` function.
			*
			*	This function also appends an input tag of type date to the directive element.
			*
			*	This function also handles binding the input if the type of binding is Kendo,
			*	adds the disabled attribute if that configuration is true, and adds the
			*	required attribute if that configuration is true.
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
					input = angular.element("<input type=\"date\">");

				el.empty();

				if (noForm.binding === "kendo") {
					input.attr("name", noForm.kendoModel);
				}


				if (noForm.disabled === true) {
					input.attr("disabled", true);
				}

				if (attrs.$attr.required || noForm.required) {
					el.removeAttr("required");
					var inputHidden = angular.element("<input />");

					inputHidden.attr("type", "hidden");
					inputHidden.attr("required", "required");

					inputHidden.attr("ng-model", attrs.ngModel || noForm.ngModel);

					el.append(inputHidden);
				}

				el.append(input);

				return _link.bind(null, noForm);
			}

			/**
			*	### Private function _link(noForm, scope, el, attrs)
			*
			*	`_link` is the link function for the noKendoDatePicker directive.
			*	Utilizing the noForm configuration bound into it from the `_compile` function,
			*	the `_link` function parses out the specific configuration for the noKendoDatePicker
			*	directive and enables a data driven way to configure the noKendoDatePicker element.
			*
			*	Since this is a kendo databound element, the configuration is similar to a kendo dataSource object.
			*	However, this directive expands on kendo's kendoDatePicker module by providing additional functionality.
			*
			*	This directive also puts the current selected value of the noKendoDatePicker onto the scope to allow for angular
			*	binding for a multitude of potential purposes, saving with noForms being a reason.
			*
			*	This function handles the initValue configuration property of the directive.
			*
			*	#### Parameters
			*
			*	|Name|Type|Description|
			*	|----|----|-----------|
			*	|config|Object|A NoInfoPath noForm configuration object bound in by the `_compile` function|
			*	|scope|Object|A scope object provided by angular.js|
			*	|el|Object|A jQuery object of the noKendoDatePicker directive element|
			*	|attrs|Object|An object of all the attributes on the noKendoDatePicker directive element. Provided by angular.js|
			*
			*	#### Returns Object specific for Angular.js directive code
			*/
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

				datePicker = el.find("input[type='date']").kendoDatePicker(noForm.options).data("kendoDatePicker");

				/*
				 *   #### @property binding
				 *
				 *   When binding property is `ng` or undefined use
				 *   Angular scope for setting and getting the date
				 *   picker's value.  Otherwise, using kendo model for
				 *   getting and setting data.
				 */
				if (noForm.binding === "ng" || noForm.binding === undefined) {
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