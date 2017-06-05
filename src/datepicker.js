//datepicker.js
(function(angular, undefined) {

	function DatePicker1(noFormConfig, $state, $timeout, noNCLManager, noParameterParser) {
		function _compile(el, attrs) {
			console.warn("Usage of inline attributes other than `no-form` deprecated.");

			var ctx = noFormConfig.getComponentContextByRoute($state.current.name, $state.params.entity, "noKendoDatePicker", attrs.noForm),
				noid = el.parent().parent().attr("noid"),
				config,
				noForm = ctx.component,
				ncl,
				input = angular.element("<input type=\"date\">"), //kendo
				inputHidden = angular.element("<input type=\"hidden\"/>"); //for ng validation

			if(noid) {
				config = noNCLManager.getHashStore($state.params.fid || $state.current.name.pop("."));
				ncl = config.get(noid);
				noForm = ncl.noComponent;
			} else {
				config = ctx.config;
				noForm = ctx.component;
			}

			//el.attr("name", noForm.ngModel);  //Make validation work.

			el.empty();

			if (noForm.binding === "kendo") {
				input.attr("name", noForm.kendoModel);
			}


			if (noForm.disabled === true) {
				input.attr("disabled", "");
			}

			if(ncl) {
				console.warn("NCL path needs to be revisited.");
				el.removeAttr("required");
				inputHidden.attr("type", "hidden");
				inputHidden.attr("required", true);
				noForm.ngModel = ($state.params.fid || $state.current.name.split(".").pop()) + "." + ncl.noElement.label; // do the escape thing
				inputHidden.attr("ng-model", noForm.ngModel); //TODO add the ngmodel dynanmically
			} else {
				inputHidden.attr("ng-model", attrs.ngModel || noForm.ngModel);
				inputHidden.attr("name", noForm.name || noForm.ngModel); //Technially we should require both `name` and `ngModel` in noForm config.

			}

			if (attrs.$attr.required || noForm.required) {
				el.removeAttr("required");
			}

			// if(noForm.readOnly){
			// 	input.attr("readonly", "");
			// }

			el.append(inputHidden);
			el.append(input);

			return _link.bind(null, ctx);
		}

		function _link(ctx, scope, el, attrs) {
			var	noForm = ctx.component,
				formName = el.closest("[ng-form]").attr("name"),
				ngCtrlName = formName + "." + noForm.name,
				ngModelCtrl,
				datePicker,
				internalDate;

				// var dataName1 = el.closest("[ng-form]").attr("name"),
				// 	ngScopeNameValidtor = dataName1 + "." + noForm.name;
				// 	ngName1 = noForm.ngModel.indexOf(".") > -1 ? noForm.ngModel : ngScopeNameValidtor;

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
				ngModelCtrl = noInfoPath.getItem(scope, ngCtrlName);

				if ((noForm.initValue === undefined || noForm.initValue) && !internalDate) {					
					noParameterParser.updateOne(ngModelCtrl, noInfoPath.toDbDate(internalDate));
				}



				scope.$watch(noForm.ngModel, function(newval, oldval) {
					if (newval !== oldval) {
						if (newval !== null) {
							datePicker.value(new Date(noInfoPath.toDisplayDate(newval)));
						} else if (noForm.initValue === true) {
							var tmp = noInfoPath.getItem(scope, noForm.ngModel);  //Dead code???
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
						ctl = noInfoPath.getItem(scope, ngCtrlName);

					noParameterParser.updateOne(ctl, newDate);

					//this will solve the issue of the data not appearing on the scope
					scope.$apply();
				});

				internalDate = noInfoPath.getItem(scope, noForm.ngModel);
			}

			if ((noForm.initValue === undefined || noForm.initValue) && !internalDate) {
				internalDate = new Date();
			}

			//fixing the issue where the data is not on the scope on initValue load
			if(internalDate) datePicker.value(noInfoPath.toDisplayDate(new Date(internalDate)));


			//????
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
