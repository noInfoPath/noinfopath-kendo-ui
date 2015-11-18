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
        .directive("noKendoGrid", ['$injector', '$compile', '$timeout', '$http', '$state','$q','lodash', 'noLoginService', 'noKendoDataSourceFactory', function($injector, $compile, $timeout, $http, $state, $q, _, noLoginService, noKendoDataSourceFactory){
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
                                var noFormConfig = $injector.get("noFormConfig");

                                return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
                                    .then(function(config){
                                        return noInfoPath.getItem(config, attrs.noForm);
                                    });
                            }
                        };


                    if(attrs.noConfig){
                        configurationType = "noConfig";
                    }else if(attrs.noForm){
                        configurationType = "noForm";
                    }else{
                        throw "noKendoGrid requires either a noConfig or noForm attribute";
                    }


                    function configure(config, params){
                        var dsCfg = config.noDataSource ? config.noDataSource : config,
                            dataSource;

                        //if(!entity) throw dsCfg.entityName + " not found in provider " + dsCfg.dataProvider;


                        dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, params);


                        config.noKendoGrid.dataSource = dataSource;


                        if(config.noKendoGrid.selectable === undefined || config.noKendoGrid.selectable){ //When Truthy because we always want row selection.
                            config.noKendoGrid.selectable= "row";

                            /*
                            *   ##### change() event handler
                            *
                            *   Listens on the Kendo UI Grid components change event
                            *   and transitions the user to the ```toState``` specified
                            *   in the noConfig node for this directive.
                            */
                            config.noKendoGrid.change = function(){
                                var dsCfg = config.noDataSource ? config.noDataSource : config,
                                    noGrid = config.noGrid ? config.noGrid : config,
                                    data = this.dataItem(this.select()),
                                    params = {},
                                    toState = config.noGrid ? config.noGrid.toState : config.toState,
                                    primaryKey = config.noGrid ? config.noGrid.primaryKey : config.primaryKey;

                                params[primaryKey] = data[dsCfg.primaryKey];

                                params = angular.merge(params, $state.params);

                                if(toState){
                                    $state.go(toState, params);
                                }else{
                                    var tableName =dsCfg.entityName;
                                    scope.$emit("noGrid::change+" + tableName, data);
                                }
                            };

                        }

						if(config.noGrid && config.noGrid.editable && config.noGrid.editable.provider){
							var prov = $injector.get(config.noGrid.editable.provider),
								fn = prov[config.noGrid.editable.function];

							config.noKendoGrid.edit = fn.bind(config, scope);
						}

						scope.noGrid = el.kendoGrid(config.noKendoGrid).data("kendoGrid");

                    }

                    function getEditorTemplate(config){
                        return $http.get(config.template)
                            .then(function(resp){
                                config.template = kendo.template($compile(resp.data)(scope).html());
                            })
                            .catch(function(err){
                                throw err;
                            });
                    }

                    function getRowTemplate(config){
                        return $q(function(resolve, reject){
                            $http.get(config.noGrid.rowTemplateUrl)
                                .then(function(resp){
                                    var tmp = angular.element($compile(resp.data)(scope));

                                    $timeout(function(){
                                        config.noKendoGrid.rowTemplate = tmp[0].outerHTML;

                                        tmp.addClass("k-alt");

                                        config.noKendoGrid.altRowTemplate = tmp[0].outerHTML;

                                        resolve();
                                    }, 20);
                                })
                                .catch(function(err){
                                    reject(err);
                                });
                        });

                    }

                    function handleWaitForAndConfigure(config){
                        var dsCfg = config.noDataSource ? config.noDataSource : config;

                        if(dsCfg.waitFor){
                            if(dsCfg.waitFor.source === "scope"){
                                scope.$watch(dsCfg.waitFor.property, function(newval, oldval, scope){
                                    if(newval){
                                        configure(config, scope);
                                    }
                                });
                            }else{
                                configure(config, scope);
                            }
                        }else{
                            configure(config, scope);
                        }
                    }

                    cfgFn[configurationType](attrs)
                        .then(function(config){
                            var promises = [];

                            /*
                            *   ##### kendoGrid.editable
                            *
                            *   When this property is truthy and an object, noKendoGrid Directive
                            *   will look for the template property. When found, it will be
                            *   expected to be a string, that is the url to the editor template.
                            *   When this occurs the directive must wait for the template
                            *   before continuing with the grid initialization process.
                            *
                            */


                            if(angular.isObject(config.noKendoGrid.editable) && config.noKendoGrid.editable.template){
                                promises.push(getEditorTemplate(config.noKendoGrid.editable));
                            }

                            if(config.noGrid && config.noGrid.rowTemplateUrl){
                                promises.push(getRowTemplate(config));
                            }

                            if(promises.length){
                                $q.all(promises)
                                    .then(function(){
                                        handleWaitForAndConfigure(config);
                                    })
                                    .catch(function(err){
                                        console.error(err);
                                    });
                            }else{
                                handleWaitForAndConfigure(config);
                            }
                        })
                        .catch(function(err){
                            console.error(err);
                        });
                }
            };
        }])


        ;
})(angular);
