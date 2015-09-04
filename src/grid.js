//grid.js
(function(angular, undefined){
    angular.module("noinfopath.kendo.ui")

		/**
		* ```html
		* <no-kendo-grid no-provider="noKendoDataSourceFactory" no-table="Cooperators" />
		* ```
		*/
        .directive("noGrid", ['$injector', '$state','$q','lodash', 'noConfig', function($injector, $state, $q, _, noConfig){
            return {
                link: function(scope, el, attrs){
                    if(!attrs.noProvider) throw "noGrid requires a noProvider attribute";
                    if(!attrs.noTable) throw "noGrid requires a noTable attribute.";

                    var _dataSource, _grid;

                     //Ensure with have a propertly configured application.
                    //In this case a properly configured IndexedDB also.
                    // noAppStatus.whenReady()
                    //     .then(_start)
                    //     .catch(function(err){
                    //         console.error(err);
                    //     });

                    function _bind(ds, config){
                        var componentBinder = $injector.get(attrs.noGrid);

                        var options = {
                            groupable: config.groupable || false,
                            pageSize: config.pageSize || 10,
                            pageable: config.pageable || false,
                            filterable: config.filterable || false,
                            sortable: true,
                            scrollable: {virtual: true},
                            selectable: "row",
                            dataSource: ds,
                            columns: config.columns ,
                            change: function(){
                                var data = this.dataItem(this.select()),
                                    params = {};

                                params[config.primaryKey] = data[config.primaryKey];

                                if(config.toState){
                                    $state.go(config.toState, params);
                                }else{
                                    var tableName = this.dataSource.transport.tableName;
                                    scope.$root.$broadcast("noGrid::change+" + tableName, data);
                                }
                            }
                        };

                        if(config.rowTemplate){
                            options.rowTemplate = kendo.template($(config.rowTemplate).html());
                        }

                        if(config.altRowTemplate){
                            options.altRowTemplate = kendo.template($(config.altRowTemplate).html());
                        }

                        if(config.toolbar){
                            options.toolbar = kendo.template($(config.toolbar).html());
                        }

                        el.empty();

                        _grid = componentBinder.noGrid(el, options);
                    }

                    function _watch(newval, oldval, scope){
                        if(newval && newval !== oldval){
                            var filters = window.noInfoPath.bindFilters(this.filter, scope, $state.params);
                            //console.log("watch", this, _grid, filters);
                            var curFilters = _grid.dataSource.filter();

                            _grid.dataSource.filter(filters);
                        }
                    }

                    function _start(){
                        //if(!$state.current.data) throw "Current state ($state.current.data) is expected to exist.";
                        //if(!$state.current.data.noDataSources) throw "Current state is expected to have a noDataSource configuration.";
                        //if(!$state.current.data.noComponents) throw "Current state is expected to have a noComponents configuration.";

                        // var dsConfig = $state.current.data.noDataSources[attrs.noDataSource],
                        //     gridConfig = $state.current.data.noComponents[attrs.noComponent];

                        //_dataSource = $inject()

						//new window.noInfoPath.noDataSource(attrs.noGrid, dsConfig, $state.params, scope);

                        if(dsConfig.filter){
                            //watch each dynamic filter's property if it is on the scope
                            angular.forEach(dsConfig.filter, function(fltr){
                                if(angular.isObject(fltr.value) && fltr.value.source === "scope"){
                                    scope.$watch(fltr.value.property, _watch.bind(dsConfig));
                                }
                            });
                        }

                        _bind(_dataSource, gridConfig);

                    }

                    _start();
                }
            };
        }]);

})(angular);
