//datepicker.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", function(noFormConfig, $state) {
			function _link(scope, el, attrs) {
				return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
					.then(function(config) {
						var input = angular.element("<input type=\"date\">"),
							datePicker,
							internalDate;

						if(attrs.$attr.required)
						{
							input.attr("required", "true");
						}



						config = noInfoPath.getItem(config, attrs.noForm);



						//input.attr("value", internalDate);

                        //Kendo binding happens early.
                        if(config.binding === "kendo"){
                            input.attr("name", config.kendoModel);
                            input.attr("data-bind", "value: " + config.kendoModel);
                            config.options.change = function(data){
                                var tmp = noInfoPath.getItem(scope, config.ngKendo);
                                tmp.set(config.kendoModel, this.value());
                                //noInfoPath.setItem(scope, config.ngKendo, this.value());
                            };

                            internalDate = new Date(noInfoPath.getItem(scope, config.ngModel));
                        }
						//config.options.value =  config.kendoModel;

						// config.options.change = function(){
						//     //noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(this.value()));
						// };


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
									datePicker.value(new Date(newval));
								}
							});

                            datePicker.bind("change", function(){

    						    noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(this.value()));
    						});

                            internalDate = noInfoPath.getItem(scope, config.ngModel);
						}



                        if((config.initValue === undefined || config.initValue) && !internalDate){
						    internalDate = noInfoPath.toDbDate(new Date());
                        }

                        datePicker.value(internalDate);
						//when the internal date is falsey set it to null for Kendo compatibility
						//default display is empty
						//noInfoPath.setItem(scope, config.ngModel, internalDate ? internalDate : null);

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
