//global.js

/*
 *	# noinfopath-kendo-ui
 *	@version 0.0.8
 *
 *	## Overview
 *	NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
 *	it with NoInfoPath Data. It is important to note that this module inplements
 *  implied interfaces that NoInfoPath defines. For the sake if this discussion
 *  we'll use the generic object oriented notation of "IXyz", where "I" stands
 *  for interface. This particular module will implement the IQueryParser, and
 *  IQueryBuilder interface.
 *
 *	## Dependencies
 *
 *	- AngularJS
 *	- jQuery
 *	- ngLodash
 *	- noinfopath
 *	- noinfopath.data
*/

/**
 *	## Development Dependencies
 *
 *	> See `package.json` for exact version requirements.
 *
 *	- indexedDB.polyfill
 *	- angular-mocks
 *	- es5-shim
 *	- grunt
 *	- grunt-bumpup
 *	- grunt-version
 *	- grunt-contrib-concat
 *	- grunt-contrib-copy
 *	- grunt-contrib-watch
 *	- grunt-karma
 *	- jasmine-ajax
 *	- jasmine-core
 *	- jshint-stylish
 *	- karma
 *	- karma-chrome-launcher
 *	- karma-coverage
 *	- karma-firefox-launcher
 *	- karma-html-reporter
 *	- karma-ie-launcher
 *	- karma-jasmine
 *	- karma-phantomjs-launcher
 *	- karma-safari-launcher
 *	- karma-verbose-reporter
 *	- noinfopath-helpers
 *	- phantomjs
*/

/**
 *	## Developers' Remarks
 *
 *	|Who|When|What|
 *	|---|----|----|
 *	|Jeff|2015-08-08T16:38:00Z|Creating a new NoInfoPath module.|
 *	|Jeff|2015-09-15T11:10:00Z|Implemented noKendoGrid with noKendoDataSource, which integrates with the NoInfoPath Data Providers.|
*/

//Establish noInfoPath.kendo namespace.
noInfoPath.kendo = {};

(function(angular, undefined){
 	"use strict";

	angular.module("noinfopath.kendo.ui", [])

	;
})(angular);

(function(angular, kendo){
	angular.module("noinfopath.kendo.ui")
	/**
		## noKendoDataSourceFactory

		### Overview
		This factory returns a service that creates Kendo DataSource objects
		that are compatible with other NoInfoPath wrapped Kendo widgets. The
		configuration data is stored in the NoInfoPath Configuration database,
		placed there either by using the NoInfopath Designer or by a developer,
		creating bare metal applications using the NoInfoPath open source
		components.

		All properties mentioned in the Kendo DataSource documentation are
		supported with a few tactical exceptions. A few of options are set at
		runtime by the NoInfoPath Kendo UI DataSource wrapper.  This allows
		Kendo's data aware widgets to work with NoInfoPath's data providers,
		like the IndexedDB, WebSql and HTTP implementations.
	*/
		.factory("noKendoDataSourceFactory", ["$injector", "$q", "noQueryParser", "noTransactionCache", function($injector, $q, noQueryParser, noTransactionCache){
			function KendoDataSourceService(){
				this.create = function (userId, config, scope){
                    //console.warn("TODO: Implement config.noDataSource and ???");
					if(!config) throw "kendoDataSourceService::create requires a config object as the first parameter";

                    function create(options){
                        var noTrans = noTransactionCache.beginTransaction(userId, config, scope);

                        noTrans.upsert(options.data)
                            .then(noTransactionCache.endTransaction.bind(noTrans, noTrans))
                            .then(options.success)
                            .catch(function(err){
                                options.error(err);
                            });

                    }

                    function read(options){
                        var provider = $injector.get(config.noDataSource.dataProvider),
                            db = provider.getDatabase(config.noDataSource.databaseName),
                            noTable = db[config.noDataSource.entityName];

                        noTable.noRead.apply(null, noQueryParser.parse(options.data))
                           .then(options.success)
                           .catch(options.error);
                    }

                    function update(options){
                        var noTrans = noTransactionCache.beginTransaction(userId, config, scope);

                        noTrans.upsert(options.data)
                            .then(noTransactionCache.endTransaction.bind(noTrans, noTrans))
                            .then(options.success)
                            .catch(options.error);

                    }

                    function destroy(options){
                        var noTrans = noTransactionCache.beginTransaction(userId, config, scope);

                        noTrans.destory(options.data)
                            .then(noTransactionCache.endTransaction.bind(noTrans, noTrans))
                            .then(options.success)
                            .catch(options.error);

                    }

                    function errors(err){
                        console.error(err);
                    }

					function watch(filterCfg, newval, oldval, scope){
                        var grid = scope.noGrid;

                        this.value = newval;

                        grid.dataSource.read();
                        grid.refresh();
                    }

					var yesNo = [
                        "No",
                        "Yes"
                        ],
                        parsers = {
                            "date": function(data){
                                return new Date(data);
                            },
                            "ReverseYesNo": function(data){
                                var v = data === 0 ? 1 : 0;

                                return yesNo[v];
                            }
                        },
                        ds = angular.merge({
                        serverFiltering: true,
                        serverPaging: true,
                        serverSorting: true,
						transport: {
							create: create,
							read: read,
							update: update,
							destroy: destroy
						},
						schema: {
							data: function(data){
								return data.paged;
							},
							total: function(data){
								return data.total;
							}

						}
					}, config.noKendoDataSource),
                    dsCfg = config.noDataSource ? config.noDataSource : config,
                    kds;

                    /**
                    *   #### Schema Model
                    *
                    *   When the noKendoDataSource config contains a schema.model
                    *   then loop through looking for fields that have a type and a
                    *   parser property and set the parser propety to one of
                    *   parse functions defined in the parsers collection.
                    */
                    if(ds.schema.model && ds.schema.model.fields){
                        var fields = ds.schema.model.fields;
                        for(var f in fields){
                            var field = fields[f];

                            if(field.parse) {
                                field.parse = parsers[field.parse];
                            }
                        }
                    }

                    /*
                    *   #### config::filter
                    *
                    *   The `filter` property requires special processing because
                    *   it supports dynamic value binding from any injectable
                    *   data source location.  $scope or $stateParams for
                    *   exmaple.
                    */
                    if(dsCfg.filter){

                        var filters = [];

                        for(var fi in dsCfg.filter){
                            var filterCfg = dsCfg.filter[fi],
                                filter = angular.copy(filterCfg), source;

                            if(angular.isObject(filter.value)){

                                if(filter.value.source === "scope") {
                                    source = scope;
                                }else{
                                    source = $injector.get(filter.value.source);
                                }

                                filter.value = noInfoPath.getItem(source, filter.value.property);

                                filters.push(filter);

                                if(filterCfg.value.watch && ["scope", "$scope", "$rootScope"].indexOf(filterCfg.value.source) > -1){
                                    source.$watch(filterCfg.value.property, watch.bind(filter, filterCfg));
                                }
                            }
                        }


                        ds.filter = filters;
                        //grid.dataSource.filter(filters);
                    }

                    kds = new kendo.data.DataSource(ds);

					return kds;
				};

			}

			return new KendoDataSourceService();
		}]);
})(angular, kendo);

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
        .directive("noKendoGrid", ['$injector', '$http', '$state','$q','lodash', 'noLoginService', 'noKendoDataSourceFactory', function($injector, $http, $state, $q, _, noLoginService, noKendoDataSourceFactory){
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

                        scope.noGrid = el.kendoGrid(config.noKendoGrid).data("kendoGrid");

                    }

                    function getEditorTemplate(config){
                        return $http.get(config.template)
                            .then(function(resp){
                                config.template = kendo.template(resp.data);
                            })
                            .catch(function(err){
                                throw err;
                            });
                    }

                    function getRowTemplate(config){
                        return $http.get(config.noGrid.rowTemplateUrl)
                            .then(function(resp){
                                var tmp = angular.element(resp.data);

                                config.noKendoGrid.rowTemplate = tmp[0].outerHTML;

                                tmp.addClass("k-alt");

                                config.noKendoGrid.altRowTemplate = tmp[0].outerHTML;
                            })
                            .catch(function(err){
                                throw err;
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

                            if(config.noGrid.rowTemplateUrl){
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

                        noInfoPath.setItem(scope, config.ngModel,new Date());

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
