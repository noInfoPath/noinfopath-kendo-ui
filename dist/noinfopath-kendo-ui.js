//global.js

/*
 *	# noinfopath-kendo-ui
 *	@version 0.0.3
 *
 *	## Overview
 *	NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
 *	it with NoInfoPath Data. It is important to note that this module inplements
 *  implied interfaces that NoInfoPath defines. For the sake if this discussion
 *  we'll use the generic object oriented notation of "Ixyz", where "I" stands
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

/*
*	## kendoQueryParser
*
*	### Overview
*	The kendoQueryParser takes the `data` property of the options
*	parameter passed to the Kendo DataSources transport.read method. The
*	data object is inspected and its filter, sort, and paging values are
*	converted to NoInfoPath compatible versions.
*
*	### Methods
*
*	#### parse(kendoOptions)
*	Parses the Kendo options into NoInfoPath compatible objects. Stores
*	the results internally for future use.
*
*	#### toArray()
*	Returns any filters, sorts or paging data as an array compatible
*	with a call to `function.prototype.array`.
*
*	### Properties
*
*	|Name|Type|Description|
*	|----|----|-----------|
*	|hasFilters|Boolean|Returns true if filters are available.|
*	|hasSort|Boolean|Returns true if sorts are available.|
*	|hasPaging|Boolean|Returns true if paging data is available.|
*/
(function(angular, undefined){
	"use strict";

	angular.module("noinfopath.kendo.ui")
		.service("kendoQueryParser",[function(){
			var filters, sort, paging;

			this.parse = function(kendoOptions){
                var filters, sort, paging;

				//filter { logic: "and", filters: [ { field: "name", operator: "startswith", value: "Jane" } ] }
				//{"take":10,"skip":0,"page":1,"pageSize":10,"filter":{"logic":"and","filters":[{"value":"apple","operator":"startswith","ignoreCase":true}]}}
				if(!!kendoOptions.take) paging = new noInfoPath.data.NoPage(kendoOptions.skip, kendoOptions.take);
				if(!!kendoOptions.sort) sort = new noInfoPath.data.NoSort(kendoOptions.sort);
				if(!!kendoOptions.filter) filters = new noInfoPath.data.NoFilters(kendoOptions.filter);

                return toArray(filters, sort, paging);
            };

			function toArray(filters, sort, paging){
				var arr = [];

				if(!!filters) arr.push(filters);

				if(!!sort) arr.push(sort);

				if(!!paging) arr.push(paging);

				if(arr.length === 0) arr = undefined;

				return arr;
			}
		}]);
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
		.factory("noKendoDataSourceFactory", ["$injector", "kendoQueryParser", function($injector, kendoQueryParser){
			function KendoDataSourceService(){
				this.create = function (config, noTable){
					if(!config) throw "kendoDataSourceService::create requires a config object as the first parameter";
					if(!noTable) throw "kendoDataSourceService::create requires a no noTable object as the second parameter";
					//if(noTable.constructor.name !== "NoTable") throw "noTable parameter is expected to be of type NoTable";

					var ds = angular.merge({
                        serverFiltering: true,
                        serverPaging: true,
						transport: {
							create: function(options){
								noTable.noCreate(options.data)
									.then(options.success)
									.catch(options.error);
							},
							read: function(options){

								noTable.noRead.apply(null, kendoQueryParser.parse(options.data))
									.then(options.success)
									.catch(options.error);
							},
							update: function(options){
								noTable.noUpdate(options.data)
									.then(options.success)
									.catch(options.error);
							},
							destroy: function(options){
								noTable.noDestroy(options.data)
									.then(options.success)
									.catch(options.error);
							}
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
                    kds;

                    /*
                    *   The `filter` property requires special processing because
                    *   it supports dynamic value binding from any injectable
                    *   data source location.  $scope or $stateParams for
                    *   exmaple.
                    */
                    if(config.filter){

                        var filters = [];

                        for(var f in config.filter){
                            var filter = angular.copy(config.filter[f]);

                            if(angular.isObject(filter.value)){
                                var source = $injector.get(filter.value.source);

                                filter.value = noInfoPath.getItem(source, filter.value.property);

                                filters.push(filter);
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
        *                   KendoGrid: {},
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

                    cfgFn[configurationType](attrs)
                        .then(function(config){
                            var provider = $injector.get(config.dataProvider),
						 		db = provider.getDatabase(config.databaseName),
                                entity = db[config.entityName],
								dataSource;

                            if(!entity) throw config.entityName + " not found in provider " + config.dataProvider;

							dataSource = noKendoDataSourceFactory.create(config, entity);

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

                        })
                        .catch(function(err){
                            console.error(err);
                        });
                }
            };
        }]);

})(angular);
