//autocomplete.js
(function(angular, undefined){
    angular.module("noinfopath.ui")

        .directive("noAutoComplete", ['$injector', '$parse', '$state', 'noAppStatus', function($injector, $parse, $state, noAppStatus){
            return {
                restrict: "A",
                compile: function(el, attrs){                    
                    var _ngModel = el.attr("no-ng-model"), 
                        _noNgModel = _ngModel + "_display";

                    if(!_ngModel) throw "noAutoComplete requires attribite ng-model.";

                    attrs.ngModel = _noNgModel;
                    attrs.noNgModel = _ngModel;

                    el.attr("ng-model", _noNgModel);
                    el.attr("no-ng-model", _ngModel);

                    return function (scope, el, attrs){
                        if(!attrs.noAutoComplete) throw "noAutoComplete requires a value. The value should be noKendo."
                        if(!attrs.noDataSource) throw "noAutoComplete requires a noDataSource attribute."
                        
                        // noAppStatus.whenReady()
                        //     .then(_start)
                        //     .catch(function(err){
                        //         console.error(err);
                        //     });

                        function _bind(ds, config){
                            var componentBinder = $injector.get(attrs.noAutoComplete);

                            var options = {
                                valuePrimitive: true, 
                                dataTextField: attrs.noTextField,
                                filter: attrs.noComparison,
                                dataSource: ds,
                                select: function(e){
                                    var item = this.dataItem(e.item), 
                                        val = item ? item[attrs.noValueField] : undefined,
                                        txt = item ? item[attrs.noTextField]: "";


                                    scope.$apply(function(){
                                        window.noInfoPath.setItem(scope, attrs.noNgModel, val);
                                        window.noInfoPath.setItem(scope, attrs.ngModel, txt);
                                    });

                                   // scope[attrs.noNgModel] = 
                                },
                                change: function(e){
                                    //scope.coolertrial.SelectionID = scope.coolertrial.SelectionID_.SelectionID;
                                    if(el.val() != window.noInfoPath.getItem(scope, attrs.ngModel)){
                                        window.noInfoPath.setItem(scope, attrs.noNgModel, undefined);
                                        window.noInfoPath.setItem(scope, attrs.ngModel, "");                                       
                                    }
                                }                     
                            };
                          
                            el.empty();

                            componentBinder.noAutoComplete(el, options);
                            el.closest("span").removeClass("k-widget k-autocomplete k-header k-state-default form-control"); 
                        }

                        function _start(){
                            if(!$state.current.data) throw "Current state ($state.current.data) is expected to exist.";
                            if(!$state.current.data.noDataSources) throw "Current state is expected to have a noDataSource configuration.";

                            var ds = new window.noInfoPath.noDataSource(attrs.noAutoComplete, $state.current.data.noDataSources[attrs.noDataSource], $state.params, scope);

                            _bind(ds, $state.current.data);
                        }

                        _start();
                    };

                    
                }

            }
        }])
    ;

    var noInfoPath = {};

    window.noInfoPath = angular.extend(window.noInfoPath || {}, noInfoPath);
})(angular);