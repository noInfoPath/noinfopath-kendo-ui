//grid.js
(function(angular, undefined){
    angular.module("noinfopath.kendo.ui")

		/**
		* ```html
		* <no-kendo-grid no-provider="noWebSQL" no-table="Cooperators" no-component="Cooperators" />
		* ```
		*/
        .directive("noKendoGrid", ['$injector', '$state','$q','lodash','noKendoDataSourceFactory', 'noConfig', function($injector, $state, $q, _, noKendoDataSourceFactory, noConfig){
            return {
                link: function(scope, el, attrs){
                    if(!attrs.noProvider) throw "noGrid requires a noProvider attribute";
                    if(!attrs.noTable) throw "noGrid requires a noTable attribute.";

                     //Ensure with have a propertly configured application.
                    //In this case a properly configured IndexedDB also.
                    noConfig.whenReady()
                        .then(_start)
                        .catch(function(err){
                            console.error(err);
                        });

                    function _start(){
						var _provider = $injector.get(attrs.noProvider),
						_config = noConfig.current.components[attrs.noComponent];

						// _provider.wait(_config.dataProvider)
						// 	.then(function(){
						// 		var _table = _provider[attrs.noTable],
						//
						// 		_dataSource = noKendoDataSourceFactory.create(_config.kendoDataSource, _table);
						//
						// 		_config.dataSource = _dataSource;
						//
						// 		el.kendoGrid(_config.kendoGrid);
						// 	});

                    }
                }
            };
        }]);

})(angular);
