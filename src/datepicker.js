//datepicker.js
(function(angular, undefined){
    angular.module("noinfopath.ui")

        .directive("noDatePicker", ['$state', '$parse', 'noAppStatus', function($state, $parse, noAppStatus){

            function _buildDatePicker(el, attrs) {
                var p = angular.element("<p></p>"),
                    input = angular.element("<input></input>"),
                    i = angular.element("<i></i>"),
                    button = angular.element("<button></button>"),
                    span = angular.element("<span></span>");

                    input.attr("type","text");
                    input.attr("kendo-date-picker", "");
                    //input.attr("datepicker-popup","{{dateFormat}}");
                    //input.attr("is-open","opened");
                    //input.attr("datepicker-options","{{dateOptions}}");
                    //input.attr("ng-required","true"); 
                    //input.attr("close-text","{{closeText}}");
                    input.attr("k-ng-model",attrs.model);
                    input.addClass("form-control");
                    //span.addClass("input-group-btn");
                    //button.addClass("btn btn-default");
                    //button.attr("ng-click", "open($event)");
                    //i.addClass("glyphicon glyphicon-calendar");

                    //button.append(i);
                    //span.append(button);
                    //p.append(input);
                    //p.append(span);

                    el.append(input);

            }

            function _configureScope(scope, attrs){
                  scope.today = function() {
                    scope.dt = new Date();
                  };
                  scope.today();

                  scope.clear = function () {
                    scope.dt = null;
                  };

                  // Disable weekend selection
                  scope.disabled = function(date, mode) {
                    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
                  };

                  scope.toggleMin = function() {
                    scope.minDate = scope.minDate ? null : new Date();
                  };
                  scope.toggleMin();

                  scope.open = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();

                    scope.opened = true;
                  };

                  scope.dateOptions = {
                    formatYear: 'yy',
                    startingDay: 1
                  };

                  scope.dateFormat = attrs.dateFormat || "shortDate";
                  scope.closeText = attrs.closeText || "Close";

                  var tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  var afterTomorrow = new Date();
                  afterTomorrow.setDate(tomorrow.getDate() + 2);
                  scope.events =
                    [
                      {
                        date: tomorrow,
                        status: 'full'
                      },
                      {
                        date: afterTomorrow,
                        status: 'partially'
                      }
                    ];

                  scope.getDayClass = function(date, mode) {
                    if (mode === 'day') {
                      var dayToCheck = new Date(date).setHours(0,0,0,0);

                      for (var i=0;i<scope.events.length;i++){
                        var currentDay = new Date(scope.events[i].date).setHours(0,0,0,0);

                        if (dayToCheck === currentDay) {
                          return scope.events[i].status;
                        }
                      }
                    }

                    return '';
                  };
            }


            return {
                restrict: "E",
                scope: {},
                compile: function(el, attrs){
                    _buildDatePicker(el,attrs);
                    return function(scope, el, attrs){
                        //_configureScope(scope, attrs);
                    }
                }
            }
        }])
    ;
    var noInfoPath = {};

    window.noInfoPath = angular.extend(window.noInfoPath || {}, noInfoPath);
})(angular);
