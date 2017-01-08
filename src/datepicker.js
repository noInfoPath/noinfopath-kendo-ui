//datepicker.js
(function(angular, undefined) {

	function DatePicker1(noFormConfig, $state, $timeout, noNCLManager, noParameterParser) {
		function _compile(el, attrs) {
			var noid = el.parent().parent().attr("noid"),
				config,
				noForm,
				ncl,
				input = angular.element("<input type=\"date\">");

			if(noid) {
				config = noNCLManager.getHashStore($state.params.fid || $state.current.name.pop("."));
				ncl = config.get(noid);
				noForm = ncl.noComponent;
			} else {
				config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity);
				noForm = noInfoPath.getItem(config, attrs.noForm);
			}

			el.attr("name", noForm.ngModel);  //Make validation work.

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

			if(ncl) {
				el.removeAttr("required");
				var hidden = angular.element("<input />");
				hidden.attr("type", "hidden");
				hidden.attr("required", true);
				noForm.ngModel = ($state.params.fid || $state.current.name.split(".").pop()) + "." + ncl.noElement.label; // do the escape thing
				hidden.attr("ng-model", noForm.ngModel); //TODO add the ngmodel dynanmically
				el.append(hidden);
			}


			//Warn: this usage is deprecated.  Use noForm.required instead.
			if (attrs.$attr.required || noForm.required) {
				el.removeAttr("required");
				var inputHidden = angular.element("<input />");

				inputHidden.attr("type", "hidden");
				inputHidden.attr("required", "required");

				inputHidden.attr("ng-model", attrs.ngModel || noForm.ngModel);
				inputHidden.attr("name", inputHidden.attr("ng-model"))
				//inputHidden.attr("name", attrs.noModel);

				el.append(inputHidden);
			}

			el.append(input);

			return _link.bind(null, noForm);
		}

		function _link(noForm, scope, el, attrs) {
			var	ngModelCtrl,
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
				scope.$watch(noForm.ngModel, function(newval, oldval) {
					if (newval != oldval) {
						if (newval !== null) {
							datePicker.value(new Date(noInfoPath.toDisplayDate(newval)));
						} else if (noForm.initValue === true) {
							var tmp = noInfoPath.getItem(scope, noForm.ngModel);
							noParameterParser.updateOne(ngModelCtrl, moment().utc());

							// if something overwrites the value of the date picker
							// (loading of a record with null data for example) this
							// will default to a new date if the initValue parameter is true.
							// Assume that if a date has an initValue that the field is required.
						}
					}
				});

				datePicker.bind("change", function() {
					var newDate = angular.isDate(this.value()) ? this.value() : null,
						dataName = this.element.closest("[ng-form]").attr("name"),
						ctl = noInfoPath.getItem(scope, dataName + "." + noForm.ngModel);

					noParameterParser.updateOne(ctl, newDate);

					//this will solve the issue of the data not appearing on the scope
					scope.$apply();
				});
				var dataName = el.closest("[ng-form]").attr("name");
				internalDate = noInfoPath.getItem(scope, dataName + "." + noForm.ngModel);
			}

			if ((noForm.initValue === undefined || noForm.initValue) && !internalDate) {
				internalDate = new Date();
			}

			datePicker.value(noInfoPath.toDisplayDate(new Date(internalDate)));

			//fixing the issue where the data is not on the scope on initValue load
			var dataName = el.closest("[ng-form]").attr("name");
			ngModelCtrl = noInfoPath.getItem(scope, dataName + "." + noForm.ngModel);
			noParameterParser.updateOne(ngModelCtrl, noInfoPath.toDbDate(internalDate));

			if(noForm.readOnly){
				datePicker.element.attr("readonly", true);
			}

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

	}

	function DatePicker2(noFormConfig, $state, $timeout, noNCLManager, noParameterParser) {
		function _link(scope, el, attrs, ngModel) {
			console.log("DatePicker2", ngModel);
		}

		function _compile(el, attrs) {
			return _link;
		}

		directive = {
			restrict: "E",
			require: "?ngModel",
			compile: _compile,
			scope: false
		};

		return directive;
	}

	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", "$timeout", "noNCLManager", "noParameterParser", DatePicker1]);
})(angular);
