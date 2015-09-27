//grid.js
(function(angular, undefined){
    angular.module("noinfopath.kendo.ui")

		/**
        * ## noKendoGrid (no-kendo-grid) Directive
        *
        * Creates a Kendo UI Grid, bound to a NoInfoPath data provider, and
        * injects it into the DOM.
        *
        * ### Attributes
        *
        * |Name|Descriptions|
        * |----|------------|
        * |no-config|The name of the configuration node in noConfig.current. |
        *
		* ```html
		* <no-kendo-grid no-config="noComponents.cooperators"/>
		* ```
        * #### Sample noComponent Configuration
        *
        * ```json
        *   {
        *       noComponents: {
        *           "cooperators": {
        *               dataProvider: "noWebSQL",
        *               entityName: "vw_Cooperator_Summary",
        *               noKendoGrid: {},
        *               noKendoDataSource: {}
        *           }
        *       }
        *   }
        * ```
        *
        * OR
        *
        * |Name|Descriptions|
        * |----|------------|
        * |noForm|Name of the noForm configuration to retreive from the noFormBuilderService.|
        * |noComponent|Name of the noForm component to use for configuration data.|
        *
        * ```html
		* <no-kendo-grid no-form="form1" no-component="grid1" />
		* ```
        *
        * #### Sample noForm Configuration
        *
        * ```json
        *   {
        *       form1: {
        *           components: {
        *               "grid1": {
        *                   dataProvider: "noWebSQL",
        *                   databaseName: "FCFNv2",
        *                   entityName: "vw_Cooperator_Summary"
        *                   kendoGrid: {},
        *                   kendoDataSource: {}
        *               }
        *           }
        *       }
        *   }
        * ```
		*/
        .directive("noKendoGrid", ['$injector', '$state','$q','lodash','noKendoDataSourceFactory', function($injector, $state, $q, _, noKendoDataSourceFactory){
            return {
                link: function(scope, el, attrs){
                    var configurationType,
                        cfgFn = {
                            "noConfig": function(attrs){
                                var noConfig = $injector.get("noConfig");
                                return noConfig.whenReady()
                                    .then(function(){
                                        return noInfoPath.getItem(noConfig.current, attrs.noConfig);
                                    })
                                    .catch(function(err){
                                        console.error(err);
                                        return $q.reject(err);  //Log in re-throw.
                                    });
                            },
                            "noForm": function(attrs){
                                var noForms = $injector.get("noForms");
                                return $q.resolve(noForms);
                            }
                        };


                    if(attrs.noConfig){
                        configurationType = "noConfig";
                    }else if(attrs.noForm){
                        if(!attrs.noComponent) throw "noGrid, using a noForm configuration, requires a noComponent attribute";
                        configurationType = "noForm";
                    }else{
                        throw "noKendoGrid requires either a noConfig or noForm attribute";
                    }

                    function configure(config, params){
                        var provider = $injector.get(config.dataProvider),
                            db = provider.getDatabase(config.databaseName),
                            entity = db[config.entityName],
                            dataSource;

                        if(!entity) throw config.entityName + " not found in provider " + config.dataProvider;


                        dataSource = noKendoDataSourceFactory.create(config, entity, params);

                        config.noKendoGrid.dataSource = dataSource;

                        config.noKendoGrid.selectable = "row";

                        config.noKendoGrid.change = function(){
                            var data = this.dataItem(this.select()),
                                params = {};

                            params[config.primaryKey] = data[config.primaryKey];

                            if(config.toState){
                                $state.go(config.toState, params);
                            }else{
                                var tableName = this.dataSource.transport.tableName;
                                scope.$root.$broadcast("noGrid::change+" + tableName, data);
                            }
                        };

                        var grid = el.kendoGrid(config.noKendoGrid).data("kendoGrid");

                    }

                    cfgFn[configurationType](attrs)
                        .then(function(config){
                            if(config.waitFor){
                                if(config.waitFor.source === "scope"){
                                    scope.$watch(config.waitFor.property, function(newval, oldval, scope){
                                        if(newval){
                                            configure(config, scope);
                                        }
                                    });
                                }else{
                                    configure(config);
                                }
                            }else{
                                configure(config);
                            }


                        })
                        .catch(function(err){
                            console.error(err);
                        });
                }
            };
        }]);

})(angular);
