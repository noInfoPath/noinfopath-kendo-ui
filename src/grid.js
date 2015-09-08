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

					noConfig.whenReady()
						.then(function(){
							var _config = noConfig.current.components[attrs.noComponent];

							scope.$watch(_config.dataProvider, function(newval, oldval){
								if(newval){
									var _provider = $injector.get(attrs.noProvider),
								 		_table = scope[_config.dataProvider][attrs.noTable],
										_dataSource;

									_dataSource = noKendoDataSourceFactory.create(_config.kendoDataSource, _table);

									_config.kendoGrid.dataSource = _dataSource;

									el.kendoGrid(_config.kendoGrid);

								}
							});
						})
						.catch(function(err){
							console.error(err);
						});

                     //Ensure with have a propertly configured application.
                    //In this case a properly configured IndexedDB also.

                }
            };
        }]);

})(angular);
