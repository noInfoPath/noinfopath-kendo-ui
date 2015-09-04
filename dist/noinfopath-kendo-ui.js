//global.js

/*
 *	# noinfopath-kendo-ui
 *	@version 0.0.0
 *
 *	## Overview
 *	NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
 *	it with NoInfoPath Data.
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

			Object.defineProperties(this, {
				"hasFilters": {
					"get": function(){
						return !!filters;
					}
				},
				"hasSort": {
					"get": function(){
						return !!sort;
					}
				},
				"hasPaging": {
					"get": function(){
						return !!paging;
					}
				}
			});

			this.parse = function(kendoOptions){
				//filter { logic: "and", filters: [ { field: "name", operator: "startswith", value: "Jane" } ] }
				//{"take":10,"skip":0,"page":1,"pageSize":10,"filter":{"logic":"and","filters":[{"value":"apple","operator":"startswith","ignoreCase":true}]}}
				if(!!kendoOptions.take) paging = new noInfoPath.data.NoPage(kendoOptions.skip, kendoOptions.take);
				if(!!kendoOptions.sort) sort = new noInfoPath.data.NoSort(kendoOptions.sort);
				if(!!kendoOptions.filter) filters = new noInfoPath.data.NoFilters(kendoOptions.filter);
			};

			this.toArray = function(){
				var arr = [];

				if(this.hasFilters) arr.push(filters);

				if(this.hasSort) arr.push(sort);

				if(this.hasPaging) arr.push(paging);

				if(arr.length === 0) arr = undefined;

				return arr;
			};
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
		.factory("noKendoDataSourceFactory", ["kendoQueryParser", function(kendoQueryParser){
			function KendoDataSourceService(){
				this.create = function (config, noTable){
					if(!config) throw "kendoDataSourceService::create requires a config object as the first parameter";
					if(!noTable) throw "kendoDataSourceService::create requires a no noTable object as the second parameter";
					if(noTable.constructor.name !== "NoTable") throw "noTable parameter is expected to be of type NoTable";

					var ds = angular.merge({
						transport: {
							create: function(options){
								noTable.noCreate(options.data)
									.then(options.sucess)
									.catch(options.error);
							},
							read: function(options){
								kendoQueryParser.parse(options.data);

								noTable.noRead.apply(null, kendoQueryParser.toArray())
									.then(options.sucess)
									.catch(options.error);
							},
							update: function(options){
								noTable.noUpdate(options.data)
									.then(options.sucess)
									.catch(options.error);
							},
							destroy: function(options){
								noTable.noDestroy(options.data)
									.then(options.sucess)
									.catch(options.error);
							}
						},
						schema: {
							data: function(data){
								return data;
							},
							total: function(data){
								return data.__total || data.length;
							}
						}
					}, config),
					kds = new kendo.data.DataSource(config);

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
