//datepicker.js
(function(angular, undefined){
    angular.module("noinfopath.kendo.ui")
        .directive("noKendoDatePicker", ["noConfig", function(noConfig){
            function _link(scope, el, attrs){
                var config = noInfoPath.getItem(noConfig.current, attrs.noConfig),
                    input = angular.element("<input type=\"date\">"),
                    datePicker;

                noInfoPath.setItem(scope, config.ngModel, new Date());

                config.options.change = function(){
                    noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(this.value()));
                };

                scope.$watch(config.ngModel, function(newval){
                    if(newval){
                        datePicker.value(newval);
                    }
                });

                el.append(input);

                datePicker = input.kendoDatePicker(config.options).data("kendoDatePicker");



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
