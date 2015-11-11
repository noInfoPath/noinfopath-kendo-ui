//datepicker.js
(function(angular, undefined){
    angular.module("noinfopath.kendo.ui")
        .directive("noKendoDatePicker", ["noFormConfig", "$state", function(noFormConfig, $state){
            function _link(scope, el, attrs){
                return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
                    .then(function(config){
                        var input = angular.element("<input type=\"date\">"),
                            datePicker;

                        config = noInfoPath.getItem(config, attrs.noForm);

                        noInfoPath.setItem(scope, config.ngModel, null); //default display is empty

                        config.options.change = function(){
                            noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(this.value()));
                        };

                        scope.$watch(config.ngModel, function(newval){
                            if(newval){
                                datePicker.value(new Date(newval));
                            }
                        });

                        el.append(input);

                        datePicker = input.kendoDatePicker(config.options).data("kendoDatePicker");

                    });

            }


            directive = {
                restrict:"E",
                link: _link,
                scope: false
            };

            return directive;



        }])
    ;

})(angular);
