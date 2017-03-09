//global.js


/*
 *	[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)
 *
 *	___
 *
 *	[NoInfoPath Kendo UI (noinfopath-kendo-ui)](home) *@version 2.0.16*
 *
 *	Copyright (c) 2017 The NoInfoPath Group, LLC.
 *
 *	Licensed under the MIT License. (MIT)
 *
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

noInfoPath.kendo.normalizedRouteName = function(fromParams, fromState) {
	var normalizedName = fromParams ? fromParams : fromState;

	return normalizedName;
};

(function(angular, undefined) {
	"use strict";

	angular.module("noinfopath.kendo.ui", ['ui.router', "noinfopath.app", "noinfopath.data"])

	;
})(angular);

// datasource.js
(function(angular, kendo) {
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
		.factory("noKendoDataSourceFactory", ["$injector", "$q", "noQueryParser", "noTransactionCache", "noDynamicFilters", "lodash", "$state", "noCalculatedFields", "noActionQueue", "noAreaLoader", function($injector, $q, noQueryParser, noTransactionCache, noDynamicFilters, _, $state, noCalculatedFields, noActionQueue, noAreaLoader) {

			function KendoDataSourceService() {

				function toKendoModel(scope, entityName, data) {
					return $q(function(resolve, reject) {
						try {
							var kmodel = scope[entityName];

							// for (var k in data) {
							// 	var d = data[k];
							//
							// 	if (d) {
							// 		kmodel[k] = d;
							// 	}
							// }

							resolve(kmodel);
						} catch (ex) {
							reject(ex);
						}

					});
				}

				//deprecated
				function updateAngularScope(scopeData, config, kmodel) {
					return $q(function(resolve, reject) {
						try {


							for (var k in data) {
								var d = data[k];

								if (d) {
									kmodel[k] = d;
								}
							}

							resolve(kmodel);
						} catch (ex) {
							reject(ex);
						}

					});
				}

				this.create = function(_, noFormAttr, userId, config, scope, watch) {
					//console.warn("TODO: Implement config.noDataSource and ???");
					if (!config) throw "kendoDataSourceService::create requires a config object as the first parameter";

					var provider = $injector.get(config.noDataSource.dataProvider),
						db = provider.getDatabase(config.noDataSource.databaseName),
						noTable = db[config.noDataSource.entityName];

					function create(options) {


						var noTrans = noTransactionCache.beginTransaction(userId, config, scope),
							op = config.noDataSource.noTransaction.create[0],
							entityName = op.scopeKey ? op.scopeKey : op.entityName,
							scopeData = scope[entityName] ? scope[entityName] : {};


						noTrans.upsert(options.data)
							//.then(toKendoModel.bind(null, options.data, op))
							.then(success.bind(null, options.success, noTrans, op))
							.catch(errors.bind(options.data, options.error));

					}

					function read(_, options) {
						var provider = $injector.get(config.noDataSource.dataProvider),
							db = provider.getDatabase(config.noDataSource.databaseName),
							noTable = db[config.noDataSource.entityName],
							noReadOptions = new noInfoPath.data.NoReadOptions(config.noDataSource.noReadOptions),
							readArgs;

						noReadOptions.followForeignKeys = true;
						noReadOptions.followRelations = false;
						noReadOptions.followParentKeys = false;

						if (options.data.sort) {
							if (config.noDataSource.sortMap) {
								for (var s in options.data.sort) {
									var sort = options.data.sort[s],
										mapped = config.noDataSource.sortMap[sort.field];

									if (mapped) {
										sort.field = mapped;
									}
								}
							}
						} else {
							if (config.noDataSource.sort) {
								options.data.sort = config.noDataSource.sort;
							}
						}


						if (options.data.filter) {
							if (options.data.filter.logic) {
								options.data.filter.logic = _.first(_.pluck(config.noDataSource.filter, "logic"));
							} else {
								for (var f in config.noDataSource.filter) {
									var filterCfg = config.noDataSource.filter[f],
										filter = options.data.filter.filters[f];

									filter.logic = filterCfg.logic;
								}

							}
						}

						readArgs = noQueryParser.parse(options.data);
						readArgs.push(noReadOptions);

						if(config.noGrid && !config.noGrid.preventMarkingComponentLoading) noAreaLoader.markComponentLoading($state.current.name, noFormAttr);

						noTable.noRead.apply(noTable, readArgs)
							.then(function(data) {

								if(config.noDataSource.actions && config.noDataSource.actions.post) {
									var queue = noActionQueue.createQueue(data, scope, null, config.noDataSource.actions.post);

									noActionQueue.synchronize(queue)
										.then(function(results){
											options.success(results[0]);
										});
								} else {
									options.success(data);
								}

							})
							.catch(function(e) {
								options.error(e);
							})
							.finally(function(){
								noAreaLoader.markComponentLoaded($state.current.name, noFormAttr);
							});
					}

					function update(options) {
						var noTrans = noTransactionCache.beginTransaction(userId, config, scope),
							op = config.noDataSource.noTransaction.update[0],
							entityName = op.scopeKey ? op.scopeKey : op.entityName,
							scopeData = scope[entityName] ? scope[entityName] : {},
							tmpRec = {};

						options.data = angular.merge(scopeData, options.data);

						noTrans.upsert(options.data)
							.then(toKendoModel.bind(null, scope, entityName))
							.then(success.bind(null, options.success, noTrans, op))
							.catch(errors.bind(null, options.error));

					}

					function destroy(options) {
						var noTrans = noTransactionCache.beginTransaction(userId, config, scope),
							op = config.noDataSource.noTransaction.destroy[0];

						noTrans.destroy(options.data)
							.then(success.bind(options.data, options.success, noTrans, op))
							.catch(errors.bind(options.data, options.error));

					}

					function errors(reject, err) {
						console.error(err);
						reject(err);
					}

					function success(resolve, noTrans, op, resp) {
						noTransactionCache.endTransaction(noTrans)
							.then(function(op) {
								if(op.actions && op.actions.post){
									var q = noActionQueue.createQueue({}, scope, {}, op.actions.post);
									noActionQueue.synchronize(q)
										.then(function(){
											resolve(resp);
											if (scope.noGrid) {
												scope.noGrid.dataSource.read();
											}
										})
										.catch(function(err){
											throw err;
										});
								} else {
									resolve(resp);
									if (scope.noGrid) {
										scope.noGrid.dataSource.read();
									}
								}
							}.bind(null, op));

					}

					var yesNo = [
							"No",
							"Yes"
						],
						parsers = {
							"date": function(data) {
								return data ? new Date(data) : "";
							},
							"utcDate": function(data) {
								return data ? moment.utc(noInfoPath.toDisplayDate(data)).format("L") : "";
							},
							"ReverseYesNo": function(data) {
								var v = data === 0 ? 1 : 0;

								return yesNo[v];
							}
						},
						ds = angular.merge({
							serverFiltering: true,
							serverPaging: true,
							serverSorting: true,
							transport: {
								noTable: noTable,
								create: create,
								read: read.bind(null, _),
								update: update,
								destroy: destroy
							},
							schema: {
								data: function(config, data) {
									var outData = data.paged;

									outData = noCalculatedFields.calculate(config.noDataSource, outData);

									return outData;
								}.bind(null, config),
								total: function(data) {
									return data.total;
								}

							}
						}, config.noKendoDataSource),
						dsCfg = config.noDataSource ? config.noDataSource : config,
						kds,
						name = $state.params.entity ? $state.params.entity : $state.current.name;

					/**
					 *   #### Schema Model
					 *
					 *   When the noKendoDataSource config contains a schema.model
					 *   then loop through looking for fields that have a type and a
					 *   parser property and set the parser propety to one of
					 *   parse functions defined in the parsers collection.
					 */
					if (ds.schema.model && ds.schema.model.fields) {
						var fields = ds.schema.model.fields;
						for (var f in fields) {
							var field = fields[f];

							if (field.parse) {
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
					 *   example.
					 *
					 *   Filters now supports filterLogic. A sibling to filter in the
					 *   datasource configuration, it allows the user to specify
					 *   if the filters that are configured within the no-forms.json
					 *   should be evaluated as an 'and' or an 'or'. The 'and' logic
					 *   is the default is no filterLogic is defined.
					 */
					var tmpFilters = noDynamicFilters.configure(dsCfg, scope, watch);
					ds.filter = tmpFilters ? {
						filters: tmpFilters
					} : undefined;


					if (dsCfg.preserveUserFilters && $state.current.data.entities && $state.current.data.entities[name] && $state.current.data.entities[name].filters) {

						ds.filter = angular.merge({}, ds.filter, $state.current.data.entities[name].filters);

					}

					if (dsCfg.preserveUserSort && $state.current.data.entities && $state.current.data.entities[name] && $state.current.data.entities[name].sort) {

						ds.sort = $state.current.data.entities[name].sort;

					}

					kds = new kendo.data.DataSource(ds);

					return kds;
				}.bind(this, _);

			}

			return new KendoDataSourceService();
		}])
		;
})(angular, kendo);

//grid.js
(function(angular, undefined) {

	function hide(noFormKey, container, options) {
		container.prev(".k-edit-label")
			.addClass("ng-hide");
		container.addClass("ng-hide");

	}

/*
 *
 *
 *	[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)
 *	___
 *
 *	[NoInfoPath Kendo UI (noinfopath-kendo-ui)](home) * @version 2.0.41 *
 *
 *	Copyright (c) 2017 The NoInfoPath Group, LLC.
 *
 *	Licensed under the MIT License. (MIT)
 *
 *	___
 *
 *
*/

	/**
	 * ## noKendoGrid (no-kendo-grid) Directive
	 *
	 * Creates a Kendo UI Grid, bound to a NoInfoPath data provider, and
	 * injects it into the DOM.
	 *
	 *	> NOTE: Kendo UI Grid is not open source, it is a licensed product from Kendo. In order to use noKendoGrid, you must aquire a license from Kendo (Telerik).
	 *
	 * ### Attributes
	 *
	 * |Name|Descriptions|
	 * |----|------------|
	 * |no-form|The name of the configuration node in no-form.js. |
	 *
	 * ```html
	 * <no-kendo-grid no-form="noForm.noComponents.cooperators"/>
	 * ```
	 * #### Sample noComponent Configuration
	 *
	 *	Any of the configuration options in the noKendoGrid node are options taken directly
	 *	from the Kendo UI Grid documentations.
	 *
	 * ```json
	 *	 {
	 *		 "noGrid": {
	 *			 "referenceOnParentScopeAs": "docGrid"
	 *		 },
	 *		 "noDataSource": {
	 *		 	...
	 *		 },
	 *		 "noKendoGrid": {
	 *			 "sortable": true,
	 *			 "pageable": {
	 *				 "previousNext": false,
	 *				 "numeric": false,
	 *				 "pageSize": 50,
	 *				 "refresh": true
	 *			 },
	 *			 "scrollable": {
	 *				 "virtual": true
	 *			 },
	 *			 "columns": [{
	 *				 "title": "Name",
	 *				 "field": "FileID.name"
	 *			 }, {
	 *				 "title": "Description",
	 *				 "field": "description"
	 *			 }]
	 *		 },
	 *		 "noKendoDataSource": {
	 *		 	...
	 *		 }
	 *	 }
	 *
	 * ```
	 */
	function NoKendoGridDirective($injector, $compile, $timeout, /*$http,*/ noTemplateCache, $state, $q, _, noLoginService, noKendoDataSourceFactory, noDataSource, noKendoHelpers, noActionQueue, PubSub) {

		function _getKendoGridEditorTemplate(config, scope) {
			return noTemplateCache.get(config.template)
				.then(function(tpl) {
					config.template = kendo.template($compile(tpl)(scope).html());
				})
				.catch(function(err) {
					throw err;
				});

		}

		function _getKendoGridRowTemplate(config, scope) {
			return $q(function(resolve, reject) {
				noTemplateCache.get(config.noGrid.rowTemplateUrl)
					.then(function(tpl) {

						var tmp = angular.element(tpl),
							nrs = tmp.find("no-record-stats");

						if (nrs.length > 0) {
							noTemplateCache.get("no-record-stats-kendo.html")
								.then(function(tpl) {
									nrs.append(tpl);
									config.noKendoGrid.rowTemplate = tmp[0].outerHTML;
									tmp.addClass("k-alt");
									config.noKendoGrid.altRowTemplate = tmp[0].outerHTML;
									resolve();
								});
						} else {
							config.noKendoGrid.rowTemplate = tmp[0].outerHTML;
							tmp.addClass("k-alt");
							config.noKendoGrid.altRowTemplate = tmp[0].outerHTML;
							resolve();
						}
					}).catch(reject);

			});


		}

		function _refreshKendoGrid(grid, e, t, p) {
			var pgridhtml = p ? p.find("no-kendo-grid") : null,
				pgridscope = pgridhtml ? pgridhtml.data("$scope") : {},
				pgrid = pgridscope ? pgridscope.noGrid : {};

			if (grid._id === pgrid._id) {
				grid.dataSource.read();
			}
		}


		/*
		 * ##### _resloveNoRecordsTemplate
		 *
		 * This function gets the template for a grid that uses noRecords.
		 * It can be either a template string, or a provider and method.
		 *
		 * ##### Example
		 * ```js
		 * "photos": {
		 * 	 "noGrid": {
		 * 		"referenceOnParentScopeAs": "reportPhotoGrid",
		 * 		 "noRecords": {
		 * 			"template": "<div>hello</div>"
		 * 		 }
		 * 	 },
		 * 	 "noDataSource": {
		 * 		 "dataProvider": "noIndexedDb",
		 * 		 "databaseName": "rmEFR2",
		 * 		 "entityName": "Documents",
		 * 		 "prim
		 * ```
		 *
		 */
		function _resloveNoRecordsTemplate(config) {
			var prov, meth, tpl;

			if (config.noGrid.noRecords.template) {
				tpl = config.noGrid.noRecords.template;
			}

			if (config.noGrid.noRecords.templateProvider) {
				prov = $injector.get(config.noGrid.noRecords.templateProvider);
				meth = prov[config.noGrid.noRecords.method];

				tpl = meth();
			}

			return tpl;
		}

		function _selectable(config, kgCfg, scope, el) {
			if (kgCfg.selectable === undefined || kgCfg.selectable) { //When Truthy because we always want row selection.

				/**
				*	#### kendoGrid.selectable property.
				*
				*	When the selectable property is an object then apply configuration provided in the object.
				*/
				if(angular.isObject(kgCfg.selectable)) {
					/**
					*	When the actions property is provided then execute the actions using noActionQueue.
					*
					*	*Example*
					*
					*	```json
					*	{
					*		"selectable":
					*		{
					*			"actions": []
					*		}
					*	}
					*	```
					*/
					if(kgCfg.selectable.actions){
						var actions = kgCfg.selectable.actions;

						kgCfg.change = function(actions, e) {
							/**
							*	> NOTE: When the KendoGrid calls noInfoPath `change` event handler it calls `noAction.createQueue` with the actual KendoGrid object in place of the noKendoGrid directive element.
							*	> This is important to know because when the `passElement` action property is true it will be passing a fully instanciated grid object, not and HTML element.
							*/
							var execQueue = noActionQueue.createQueue(config, scope, e.sender, actions);

							noActionQueue.synchronize(execQueue);
						}.bind(undefined, kgCfg.selectable.actions);
					} else {
						/**
						*  Otherwise, use the provider/method/params configuration.
   					 	*/
						if(!kgCfg.selectable.provider) throw {error: "`provider` property is required when selectable is an object."};
						if(!kgCfg.selectable.method) throw {error: "`method` property is required when selectable is an object."};

						var prov = $injector.get(kgCfg.selectable.provider),
							meth = prov[kgCfg.selectable.method],
							params = kgCfg.selectable.params || []
						;

						kgCfg.change = meth.bind.apply(meth, [null].concat(params));
					}

				} else {
					/**
					 *	 When the selectable property is a string (assumed), then we
					 *   listen on the Kendo UI Grid components change event
					 *   and transitions the user to the `toState` specified
					 *   in the noConfig node for this directive.
					 */
					kgCfg.change = function() {
						var dsCfg = config.noDataSource ? config.noDataSource : config,
							noGrid = config.noGrid ? config.noGrid : config,
							data = this.dataItem(this.select()),
							params = {},
							toState = config.noGrid ? config.noGrid.toState : config.toState,
							primaryKey = config.noGrid ? config.noGrid.primaryKey : config.primaryKey;

						params[primaryKey] = data[dsCfg.primaryKey];

						params = angular.merge(params, $state.params);

						if (angular.isString(toState)) {
							$state.go(toState, params);
						} else {
							var tableName = dsCfg.entityName;
							scope.$emit("noGrid::change+" + tableName, data);
							PubSub.publish("noGrid::rowSelected", {scope: scope, data: data, table: dsCfg.entityName});
						}
					};

				}

				/**
				*	When the selectable property is undefined or truthy then make the grid rows selectable.
				*
				*	> NOTE: Currently only row selection is supported.
				*/
				kgCfg.selectable = "row";

			}

		}

		function _editable(config, kgCfg, scope) {


			function _processColumns() {
				//This will assume that if there is no `provider` then the value of `editable`
				//is simply true. If so then the default MO is `inline editor`. In this case
				//We need to check the `columns` array for columns that have a custom editor
				//type defined.
				if (kgCfg.columns && kgCfg.columns.length) {
					var columns = kgCfg.columns;

					for (var ci = 0; ci < columns.length; ci++) {
						var col = columns[ci],
							fn2;

						if (col.editor) {
							if (col.editor.type === "provider") {
								var prov2 = $injector.get(col.editor.provider),
									editor = prov2[col.editor.editor],
									template = prov2[col.editor.template];


								col.template = template.bind(null, col);
								col.editor = editor.bind(null, scope, col);
							} else {
								//TODO: need to provide reference to editor initailizer.
								if (!col.editor.type) throw "col.editor.type is a required configuration value.";
								if (!col.editor.noFormOptionsKey) throw "col.editor.noFormOptionsKey is a required configuration value.";

								fn2 = noKendoHelpers.getConfigMethod(col.editor.type);
								/*
								 *   `noFormOptionsKey` is required because it identifies where to get he configuration from
								 *   to configure the noComponent when the time comes.
								 */
								col.editor = fn2.bind(null, col.editor.noFormOptionsKey, angular.copy(col.editor), scope);

							}
						}
					}

				}
			}

			if (config.noGrid && config.noGrid.editable) {
				if (angular.isObject(config.noGrid.editable)) {
					if (config.noGrid.editable.provider) {
						var prov = $injector.get(config.noGrid.editable.provider),
							provFn = config.noGrid.editable.function ,
							fnEdit, fnSave;

						if (angular.isObject(provFn)) {
							if (provFn.edit) {
								kgCfg.edit = prov[provFn.edit].bind(config, scope);
							}
							if (provFn.save) {
								kgCfg.save = prov[provFn.save].bind(config, scope);
							}
						} else {
							kgCfg.edit = prov[provFn].bind(config, scope);

							kgCfg.save = function(e) {
								$timeout(function() {
									e.sender.dataSource.read();
									scope.$broadcast("noKendoGrid::dataChanged", config.noGrid.editable.scopeKey);
								});
							};
						}

					} else if(config.noGrid.editable.templateUrls) {
						console.log("TODO: templateUrls");
					} else {
						_processColumns();
					}

				} else {
					_processColumns();
				}
			}

		}

		function _handleWaitForAndConfigure(config, scope, el, attrs) {
			var dsCfg = config.noDataSource ? config.noDataSource : config,
				cancelWait;

			/*
			 * #### noDataSource::waitFor property
			 *
			 * A noDataSource object can ```waitFor``` a property on the scope to be
			 * Truthy before continuing with the grid's configuration proccess.
			 */

			if (dsCfg.waitFor) {
				if (dsCfg.waitFor.source === "scope") {
					cancelWait = scope.$watch(dsCfg.waitFor.property, function(newval, oldval, scope) {
						if (newval) {
							cancelWait();
							_configure(config, scope, el, attrs, newval);
						}
					});
				} else {
					_configure(config, scope, el, attrs);
				}
			} else {
				_configure(config, scope, el, attrs);
			}
		}

		function _compile(el, attrs) {
			var method = noKendoHelpers.getConfigMethod(noKendoHelpers.resolveConfigType(attrs)),
				noForm = method(attrs);

			return _link.bind(null, noForm);
		}

		function _link(config, scope, el, attrs) {
			var promises = [];

			/*
			 *   ##### kendoGrid.editable
			 *
			 *   When this property is truthy and an object, noKendoGrid Directive
			 *   will look for the template property. When found, it will be
			 *   expected to be a string that is the url to the editor template.
			 *   When this occurs the directive must wait for the template
			 *   before continuing with the grid initialization process.
			 *
			 */
			if (angular.isObject(config.noKendoGrid.editable) && config.noKendoGrid.editable.template) {
				promises.push(_getKendoGridEditorTemplate(config.noKendoGrid.editable, scope));
			}

			if (config.noGrid && config.noGrid.rowTemplateUrl && angular.isString(config.noGrid.rowTemplateUrl)) {
				promises.push(_getKendoGridRowTemplate(config, scope));
			}

			if (promises.length) {
				$q.all(promises)
					.then(function() {
						_handleWaitForAndConfigure(config, scope, el, attrs);
					})
					.catch(function(err) {
						console.error(err);
					});
			} else {
				_handleWaitForAndConfigure(config, scope, el, attrs);
			}
		}

		function _rowTemplate(config, kgCfg, scope, el) {
			var fns = [];

			if (config.noGrid.rowTemplate && angular.isObject(config.noGrid.rowTemplate)) {
				var prov3 = $injector.get(config.noGrid.rowTemplate.provider),
					fn3 = prov3[config.noGrid.rowTemplate.method];

				kgCfg.rowTemplate = fn3.call(scope, kgCfg, config.noGrid);
				kgCfg.altRowTemplate = fn3.call(scope, kgCfg, config.noGrid, true);

				fns.push(_handleRowTemplate.bind(el, scope));
				fns.push(_handleNoRecords.bind(el, el));
			} else {
				fns.push(_handleNoRecords.bind(el, el));
			}

			fns.push(_ngCompileGrid.bind(el, scope, el));

			kgCfg.dataBound = function(fns, e) {
				for(var i=0; i<fns.length; i++) {
					var fn = fns[i];

					fn(e);
				}


			}.bind(null, fns);



		}

		function _columns(kgCfg) {
			if (kgCfg.columns) {
				for (var kci = 0; kci < kgCfg.columns.length; kci++) {
					var kcol = kgCfg.columns[kci];
					if (kcol.command) {
						for (var cmi = 0; cmi < kcol.command.length; cmi++) {
							var command = kcol.command[cmi];

							if (angular.isObject(command.click)) {
								var prov1 = $injector.get(command.click.provider);
								command.click = prov1[command.click.function];
							}
						}
					}
				}
			}

		}

		function _toolbar(kgCfg) {
			if (kgCfg.toolbar) {
				if (angular.isString(kgCfg.toolbar)) {
					kgCfg.toolbar = kendo.template(kgCfg.toolbar);
				}
			}

		}

		function _kendoize(config, kgCfg, scope, grid) {
			scope.noGrid = grid.kendoGrid(kgCfg)
				.data("kendoGrid");

			scope.noGrid._id = noInfoPath.createUUID();
			if (config.noGrid.referenceOnParentScopeAs) {
				grid.attr("id", config.noGrid.referenceOnParentScopeAs);
				noInfoPath.setItem(scope.$parent, config.noGrid.referenceOnParentScopeAs, scope.noGrid);
			}

			scope.noGrid.dataSource.component = scope.noGrid;
		}

		function _noRecords(config, el, grid, message) {
			el.empty();
			if (config.noGrid.noRecords) {

				el.append(grid);
				el.append(message);

				message.html($compile(_resloveNoRecordsTemplate(config))(scope));
			} else {

				grid.removeClass("ng-hide");
				el.append(grid);
			}
		}

		function _configureEventHandlers(config, scope) {
			/**
			 * #### Filter and Sort Options  Persistence
			 *
			 * A stateChangeStart event is captured on each state change. We will then check to make
			 * sure that the fromState name is the same as the one in the no-forms.json. We then
			 * grab the name of the state, make a new object on the scope and persist any filter or
			 * sort data in this object.
			 */
			scope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
				if (fromState.name === config.noGrid.stateName) {

					var normalizedName = noInfoPath.kendo.normalizedRouteName(fromParams.entity, fromState.name);

					fromState.data.entities[normalizedName] = {};
					fromState.data.entities[normalizedName].filters = scope.noGrid.dataSource.filter();
					fromState.data.entities[normalizedName].sort = scope.noGrid.dataSource.sort();
				}
			});

			/**
			 * #### noGrid refresh to make sure grids are initliazed.
			 *
			 * This fix was intended to remedy the scrollable issue when grids were located in
			 * "hidden" elements, such as inactive tabs.
			 */
			scope.$on("noTabs::Change", _refreshKendoGrid.bind(null, scope.noGrid));

			scope.$on("noSync::dataReceived", function(theGrid) {
				theGrid.dataSource.read();
			}.bind(null, scope.noGrid));

			scope.$on("noGrid::refresh", function(theGrid, e, targetGridID) {
				if (theGrid._id === targetGridID) {
					theGrid.dataSource.read();
				}
			}.bind(null, scope.noGrid));
		}

		function _handleRowTemplate(scope, e) {
			angular.element(".k-grid-edit").click(function(e) {
				e.preventDefault();
				scope.noGrid.editRow(this.closest("tr[data-uid]"));
				return false;
			});

			angular.element(".k-grid-delete").click(function(e) {
				e.preventDefault();
				scope.noGrid.removeRow(this.closest("tr[data-uid]"));
				return false;
			});
		}

		function _handleNoRecords(el, e) {
			var g = el.find("grid"),
				p = el.find(".k-pager-wrap"),
				m = el.find("message");

			if (m.length) {
				if (e.sender.dataItems().length) {
					g.removeClass("ng-hide");
					p.removeClass("ng-hide");
					m.addClass("ng-hide");
				} else {
					g.addClass("ng-hide");
					p.addClass("ng-hide");
					m.removeClass("ng-hide");
				}
			}


		}

		function _ngCompileGrid(scope, el, e) {
			//console.log("TODO: wire up checkboxes after data has been bound.", e, el);

			$compile(el.children().first("div"))(scope);

			//also add click handler for all other checkbox. when the
			//the event is handled, it should enable the "edit" button
			//when a single items is check. Multiples cause disabling.
			//
			// $(this).find("tbody input:checkbox").click(function (e) {
			// 	var checkedBoxes = $(this).closest("tbody").find("input:checkbox:checked");
			//
			// 	//$(this).closest("no-kendo-grid").parent().find("[no-kendo-grid-delete-selected-rows]");
			//
			// 	$(this).closest("no-kendo-grid").parent().find("[no-kendo-grid-delete-selected-rows]").prop("disabled",checkedBoxes.length === 0);
			// 	$(this).closest("no-kendo-grid").parent().find("[no-kendo-grid-edit-selected-row]").prop("disabled", checkedBoxes.length !== 1);
			// });
		}

		function _ngCompileRow(scope) {
			scope.noGrid.bind("save", function(scope, e){
				$compile(e.container)(scope);
			}.bind(scope.noGrid, scope));

		}

		function _detailRowExpand(config, kgCfg, scope) {

			// "detailRow": {
			// 	"templateProvider": "efrProjectService",
			// 	"method": "bidItemAttributesSelector"

			//detail row can only be used for one purpose; nestedGrid or provider method generated content.
			//It  needs to be backwards compatible with
			//with the legacy nestedGrid functionality.

			// var detailElement = angular.element("<div>boo</div>");
			//
			// $(detailElement).appendTo(e.detailCell);

			if (config.noGrid) {
				if (config.noGrid.detailRow) {
					//use detailRow code
					kgCfg.detailInit = _detailRow.bind(this, config, kgCfg, scope);

				} else if (config.noGrid.nestedGrid) {
					kgCfg.detailInit = _nestedGrid.bind(this, config, kgCfg, scope);
				}
			}
		}

		function _nestedGrid(config, kgCfg, scope, e) {
			var compiledGrid, tmpHtml;

			/*
			 * #### Nested grids
			 *
			 *	The `nestedGrid` grid property can be an object or a string. When it is
			 *	a string it is the key to the `noComponent` child node with a `noForm`
			 *	configuration.
			 *
			 *	When it is an object is because a filter needs to be defined on the grid.
			 *	The `noForm` property contains the `noComponent` key, and filterProperty
			 *	contains the name of the parent Kendo Grid column from which to get the filter
			 *	value for the child grid.
			 */
			if (angular.isObject(config.noGrid.nestedGrid)) {
				scope.childGridFilter = noInfoPath.getItem(e.data, config.noGrid.nestedGrid.filterProperty);
				compiledGrid = $compile("<div><no-kendo-grid no-form=\"" + config.noGrid.nestedGrid.noForm + "\"></no-kendo-grid></div>")(scope);
				if(config.noGrid.nestedGrid.referenceOnParentScopeAs) {
					var cg = noInfoPath.getItem(compiledGrid.scope(), config.noGrid.nestedGrid.referenceOnParentScopeAs);
					noInfoPath.setItem(e.detailRow.scope().$parent, config.noGrid.nestedGrid.referenceOnParentScopeAs, cg);
				}
			} else {
				compiledGrid = $compile("<div><no-kendo-grid no-form=\"" + config.noGrid.nestedGrid + "\"></no-kendo-grid></div>")(scope);
			}

			//console.log(compiledGrid);
			// angular.element(e.detailCell).append(tmpHtml);
			//angular.element(e.detailCell).append(compiledGrid.html());
			$(compiledGrid).appendTo(e.detailCell);


		}

		function _detailRow(config, kgCfg, scope, e) {
			var prov = $injector.get(config.noGrid.detailRow.provider),
				meth = prov[config.noGrid.detailRow.method];

			meth(config, kgCfg, scope, e)
				.then(function(tpl) {
					$($compile(tpl)(scope)).appendTo(e.detailCell);
				})
				.catch(function(err) {
					console.error(err);
				});
		}

		function _selectColumn(scope, el) {
			var tmp = el.find("[select-all-grid-rows]"),
				html;

			if(tmp.length) {
				parent = tmp.parent();

				$compile(tmp)(scope);


				//console.log(html);

				//parent.html(html);

			}


		}

		function _watch(dsConfig, filterCfg, valueObj, newval, oldval, scope) {
			var grid = scope.noGrid,
				filters = grid.dataSource.filter(),
				filter = _.find(filters.filters, {
					field: filterCfg.field
				});

			if(!filter) throw "Filter " + filterCfg.field + " was not found.";

			function handleKendoDataBoundControlsSimple(){
				//console.log("handleKendoDataBoundControlsSimple");
				filter.value = newval;
			}

			function handleKendoDataBoundControlsAdvanced(){
				//console.log("handleKendoDataBoundControlsAdvanced");
				//Need to reconstitue the values
				for(var fi=0; fi<filterCfg.value.length; fi++){
					var valCfg = filterCfg.value[fi];

					if(valCfg.property === valueObj.property){
						filter.value[fi] = newval;
					}else{
						if(valCfg.source === "scope"){
							filter.value[fi] = noInfoPath.getItem(scope, valCfg.property);
						}else if(["$scope", "$stateParams"].indexOf(valCfg.source) > -1){
							var prov = $injector.get(valCfg.source);
							filter.value[fi] = noInfoPath.getItem(prov, valCfg.property);
						}else{
							console.warn("TODO: May need to implement other sources for dynamic filters", valCfg);
						}
					}
				}
			}



			if(noInfoPath.isCompoundFilter(filterCfg.field)){
				//this.value[_.findIndex(this.value, {property: valueCfg.property})] = newval;
				handleKendoDataBoundControlsAdvanced();
			}else{
				handleKendoDataBoundControlsSimple();
			}

			grid.dataSource.page(0);
			grid.refresh();

		}

		function _configure(config, scope, el, attrs, params) {
			//console.log("configure");
			var dsCfg = config.noDataSource ? config.noDataSource : config,
				kgCfg = angular.copy(config.noKendoGrid),
				grid = angular.element("<grid></grid>"),
				message = angular.element("<message></message>"),
				dataSource;


			dataSource = noKendoDataSourceFactory.create(attrs.noForm, noLoginService.user.userId, config, scope, _watch);

			kgCfg.dataSource = dataSource;

			_wireUpKendoEvents(config, kgCfg, scope);

			_selectable(config, kgCfg, scope, el);

			_editable(config, kgCfg, scope);

			_detailRowExpand(config, kgCfg, scope);

			_rowTemplate(config, kgCfg, scope, el);

			_columns(kgCfg);

			_toolbar(kgCfg);

			_noRecords(config, el, grid, message);

			_kendoize(config, kgCfg, scope, grid);

			_configureEventHandlers(config, scope);

			_selectColumn(scope, el);

			_ngCompileRow(scope, el);
		}

		function _wireUpKendoEvents(config, kgCfg, scope){
			if(config.noGrid.events){
				for (var i = 0; i < config.noGrid.events.length; i++){
					var ev = config.noGrid.events[i],
						prov = $injector.get(ev.provider),
						meth = prov[ev.method],
						params = noInfoPath.resolveParams(ev.params);

					kgCfg[ev.eventName] = meth.bind.apply(meth, [null].concat(params));
				}
			}

		}

		return {
			scope: true,
			compile: _compile
		};
	}

	function NoKendoRowTemplates($q) {
		this.scaffold = function(cfg, noGrid, alt) {
			var holder = angular.element("<div></div>"),
				outerRow = angular.element("<tr data-uid=\"#= uid #\"></tr>"),
				outerCol = angular.element("<td class=\"no-p\" colspan=\"" + cfg.columns.length + "\"></td>"),
				table = angular.element("<table class=\"fcfn-row-template\"></table>"),
				row = angular.element("<tr></tr>"),
				colgroup = angular.element("<colgroup></colgroup>");

			if (alt) {
				outerRow.addClass("k-alt");
			}

			holder.append(outerRow);
			outerRow.append(outerCol);
			outerCol.append(table);
			table.append(colgroup);
			table.append(row);


			for (var c in cfg.columns) {
				var col = cfg.columns[c],
					colTpl = angular.element("<td></td>"),
					colg = angular.element("<col></col>");

				if (col.width) {
					colg.css("width", col.width);
				}

				colgroup.append(colg);

				if (col.command) {
					colTpl.append("<a class=\"k-button k-button-icontext k-grid-edit\" href=\"##\"><span class=\"k-icon k-edit\"></span>Edit</a>");
					colTpl.append("<a class=\"k-button k-button-icontext k-grid-delete\" href=\"##\"><span class=\"k-icon k-delete\"></span>Delete</a>");
				} else {
					if (col.template) {
						colTpl.text(col.template);
					} else {
						colTpl.text("#=" + col.field + "#");
					}
				}

				row.append(colTpl);
			}

			if (noGrid.rowTemplate.recordStats === undefined || noGrid.rowTemplate.recordStats === true) {
				table.append("<tr><td class=\"no-p\" colspan=\"" + cfg.columns.length + "\"><div class=\"fcfn-record-stats\"> <div class=\"clearfix pull-right\"> <div class=\"pull-left no-m-r-\">Created by #= CreatedBy # on #= kendo.format(\"{0:g}\", DateCreated) # <span class=\"no-p-sm\">|</span></div> <div class=\"pull-left\">Modified by #= ModifiedBy # on #= kendo.format(\"{0:g}\", ModifiedDate) #</div> </div> </div></td></tr>");
			}

			var t = holder.html();

			return kendo.template(t);
		};

		// this.currentGridRowData = function(scope, el) {
		// 	var tr = el.closest("tr"),
		// 		grid = scope.noGrid,
		// 		data = grid.dataItem(tr);
		//
		//
		// 	return data;
		// };
		//
		// this.currentGridRow = function(scope, el) {
		// 	var tr = el.closest("tr");
		// 	return tr;
		// };
	}


	function SelectAllGridRowsDirective(PubSub) {
			return {
				restrict: "A",
				link: function (scope, el, attrs) {

					el.click(function (e) {
						var grid = $(this).closest("grid"),
							allCheckBoxes = grid.find("tbody input:checkbox");

						allCheckBoxes.prop("checked", this.checked);

						allCheckBoxes = grid.find("tbody input:checkbox:checked");
						//$(".edit-selected").prop("disabled", $("no-table.body input[type='checkbox']:checked").length !== 1);
						PubSub.publish("noGrid::rowsChecked", {grid: grid, allCheckBoxes: allCheckBoxes});
					});

					//also add click handler for all other checkbox. when the
					//the event is handled, it should enable the "edit" button
					//when a single items is check. Multiples cause disabling.
					el.closest("grid").find("tbody input:checkbox").click(function (e) {
						var grid = $(this).closest("grid"),
							allCheckBoxes = grid.find("tbody input:checkbox:checked");

						//$(".edit-selected").prop("disabled", $("no-table.body input[type='checkbox']:checked").length !== 1);
						PubSub.publish("noGrid::rowsChecked", {grid: grid, allCheckBoxes: allCheckBoxes});
					});

					// el.click(function (e) {
					// 	$(this).closest("grid").find("tbody input:checkbox").prop("checked", this.checked);
					// 	$(this).closest("[no-kendo-grid-delete-selected-rows]").prop("disabled", $(this).closest("grid").find("tbody input:checkbox:checked"));
					// 	$(this).closest("[edit-selected-row]").prop("disabled", $(this).closest("grid").find("tbody input:checkbox:checked"));
					//
					// 	//$(this).closest("no-kendo-grid").parent().find("[no-kendo-grid-delete-selected-rows]").prop("disabled",checkedBoxes.length === 0);
					//
					// });


				}
			};

	}

	function DeleteSelectedRows() {
		return  {
			restrict: "A",
			link : function(scope, el, attrs) {
				el.click(function(e) {
					var delFn = scope.noGrid.dataSource.transport.destroy
					;

					console.log(scope.noGrid);

				});

			}
		};
	}


	angular.module("noinfopath.kendo.ui")

		.directive("noKendoGrid", ['$injector', '$compile', '$timeout', 'noTemplateCache', '$state', '$q', 'lodash', 'noLoginService', 'noKendoDataSourceFactory', "noDataSource", "noKendoHelpers", "noActionQueue", "PubSub", NoKendoGridDirective])

		.directive("selectAllGridRows", ["PubSub", SelectAllGridRowsDirective])

		.directive("noKendoGridDeleteSelectedRows", [DeleteSelectedRows])

		.service("noKendoRowTemplates", ["$q", NoKendoRowTemplates])
	;


})(angular);

//datepicker.js
(function(angular, undefined) {

	function DatePicker1(noFormConfig, $state, $timeout, noNCLManager, noParameterParser) {
		function _compile(el, attrs) {
			var noid = el.parent().parent().attr("noid"),
				config,
				noForm,
				ncl,
				input = angular.element("<input type=\"date\">");

			if(noid) {
				config = noNCLManager.getHashStore($state.params.fid || $state.current.name.pop("."));
				ncl = config.get(noid);
				noForm = ncl.noComponent;
			} else {
				config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity);
				noForm = noInfoPath.getItem(config, attrs.noForm);
			}

			el.attr("name", noForm.ngModel);  //Make validation work.

			el.empty();

			if (noForm.binding === "kendo") {
				input.attr("name", noForm.kendoModel);
				//	input.attr("data-bind", "value: " + noForm.kendoModel);
				// config.options.change = function(data) {
				// 	var tmp = noInfoPath.getItem(scope, config.ngKendo);
				// 	tmp.set(config.kendoModel, this.value());
				// 	//noInfoPath.setItem(scope, config.ngKendo, this.value());
				// };

				// internalDate = new Date(noInfoPath.getItem(scope, noForm.ngModel));
			}


			if (noForm.disabled === true) {
				input.attr("disabled", true);
			}

			if(ncl) {
				el.removeAttr("required");
				var hidden = angular.element("<input />");
				hidden.attr("type", "hidden");
				hidden.attr("required", true);
				noForm.ngModel = ($state.params.fid || $state.current.name.split(".").pop()) + "." + ncl.noElement.label; // do the escape thing
				hidden.attr("ng-model", noForm.ngModel); //TODO add the ngmodel dynanmically
				el.append(hidden);
			}


			//Warn: this usage is deprecated.  Use noForm.required instead.
			if (attrs.$attr.required || noForm.required) {
				el.removeAttr("required");
				var inputHidden = angular.element("<input />");

				inputHidden.attr("type", "hidden");
				inputHidden.attr("required", "required");

				inputHidden.attr("ng-model", attrs.ngModel || noForm.ngModel);
				inputHidden.attr("name", inputHidden.attr("ng-model"))
				//inputHidden.attr("name", attrs.noModel);

				el.append(inputHidden);
			}

			el.append(input);

			return _link.bind(null, noForm);
		}

		function _link(noForm, scope, el, attrs) {
			var	ngModelCtrl,
				datePicker,
				internalDate;

			if (noForm.binding === "kendo") {
				noForm.options.change = function(data) {
					var tmp = noInfoPath.getItem(scope, noForm.ngKendo);
					tmp.set(noForm.kendoModel, this.value());
					//noInfoPath.setItem(scope, config.ngKendo, this.value());
				};

				internalDate = noInfoPath.getItem(scope, noForm.ngModel);
			}

			//Create the Kendo date picker.
			datePicker = el.find("input[type='date']").kendoDatePicker(noForm.options).data("kendoDatePicker");

			/*
			 *   #### @property binding
			 *
			 *   When binding property is `ng` or undefined use
			 *   Angular scope for setting and getting the date
			 *   picker's value.  Otherwise, using kendo model for
			 *   getting and setting data.
			 *
			 */
			if (noForm.binding === "ng" || noForm.binding === undefined) {
				scope.$watch(noForm.ngModel, function(newval, oldval) {
					if (newval != oldval) {
						if (newval !== null) {
							datePicker.value(new Date(noInfoPath.toDisplayDate(newval)));
						} else if (noForm.initValue === true) {
							var tmp = noInfoPath.getItem(scope, noForm.ngModel);
							noParameterParser.updateOne(ngModelCtrl, moment().utc());

							// if something overwrites the value of the date picker
							// (loading of a record with null data for example) this
							// will default to a new date if the initValue parameter is true.
							// Assume that if a date has an initValue that the field is required.
						}
					}
				});

				datePicker.bind("change", function() {
					var newDate = angular.isDate(this.value()) ? this.value() : null,
						dataName = this.element.closest("[ng-form]").attr("name"),
						ctl = noInfoPath.getItem(scope, dataName + "." + noForm.ngModel);

					noParameterParser.updateOne(ctl, newDate);

					//this will solve the issue of the data not appearing on the scope
					scope.$apply();
				});
				var dataName = el.closest("[ng-form]").attr("name");
				internalDate = noInfoPath.getItem(scope, dataName + "." + noForm.ngModel);
			}

			if ((noForm.initValue === undefined || noForm.initValue) && !internalDate) {
				internalDate = new Date();
			}

			datePicker.value(noInfoPath.toDisplayDate(new Date(internalDate)));

			//fixing the issue where the data is not on the scope on initValue load
			var dataName = el.closest("[ng-form]").attr("name");
			ngModelCtrl = noInfoPath.getItem(scope, dataName + "." + noForm.ngModel);
			noParameterParser.updateOne(ngModelCtrl, noInfoPath.toDbDate(internalDate));

			if(noForm.readOnly){
				datePicker.element.attr("readonly", true);
			}

			$timeout(function() {
				scope.$apply();
			});
		}

		directive = {
			restrict: "E",
			compile: _compile,
			scope: false
		};

		return directive;

	}

	function DatePicker2(noFormConfig, $state, $timeout, noNCLManager, noParameterParser) {
		function _link(scope, el, attrs, ngModel) {
			console.log("DatePicker2", ngModel);
		}

		function _compile(el, attrs) {
			return _link;
		}

		directive = {
			restrict: "E",
			require: "?ngModel",
			compile: _compile,
			scope: false
		};

		return directive;
	}

	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", "$timeout", "noNCLManager", "noParameterParser", DatePicker1]);
})(angular);

//multiselect.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoMultiSelect", ["noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function(noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {

			function _watch(dsCfg, filterCfg, valueObj, newval, oldval, scope) {
			    console.warn("NOTE: noKendoMultiSelect does not support compound filters");
				var component = scope[dsCfg.entityName + "_multiSelect"],
					filters, filter;

				this.value = newval;

				//console.log("KendoMultiSelect Watch CB", dsCfg.entityName + "_multiSelect", newval);

				if (component && newval) {
					filters = component.dataSource.filter();
					filter = _.find(filters.filters, {
						field: filterCfg.field
					});
					if (filter) {
						filter.value = newval;
					}
					component.dataSource.page(0);
					component.refresh();

					//scope.$broadcast(dsCfg.entityName + "_multiSelect::populated");
				}
			}

			function _compile(el, attrs) {
				var noForm = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					config = noInfoPath.getItem(noForm, attrs.noForm),
					input = angular.element("<select/>");


				el.append(input);

				return _link.bind(null, config);
			}

			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noKendoMultiSelect.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource,
					multiSelect;

				dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope, _watch);

				kendoOptions.dataSource = dataSource;

				kendoOptions.change = function(e) {
					var value = this.value();
					noInfoPath.setItem(scope, config.noKendoMultiSelect.ngModel, value);
				};

				if (config.noKendoMultiSelect.waitFor) {
					scope.$watch(config.noKendoMultiSelect.waitFor.property, function(newval) {
						if (newval) {
							var values = _.pluck(newval, config.noKendoMultiSelect.waitFor.pluck);

							noInfoPath.setItem(scope, config.noKendoMultiSelect.ngModel, values);

							scope[dsCfg.entityName + "_multiSelect"].value(values);
						}
					});
				}

				scope[dsCfg.entityName + "_multiSelect"] = el.kendoMultiSelect(kendoOptions).data("kendoMultiSelect");

			}

			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;

		}]);

})(angular);

//autocomplete.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoAutoComplete", ["$compile", "noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm),
					input = angular.element("<input type=\"text\"/>");

				el.append(input);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noKendoAutoComplete.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

				kendoOptions.dataSource = dataSource;

				kendoOptions.change = function(e) {
					var value = this.dataItem(this.current());

					if (!value) {
						value = {};
					}

					value[kendoOptions.dataTextField] = this.value();

					noInfoPath.setItem(scope, config.noKendoAutoComplete.ngModel, value);

					scope.$apply();
				};

				if (config.noKendoAutoComplete.waitFor) {
					scope.$watch(config.noKendoAutoComplete.waitFor.property, function(newval) {
						if (newval) {
							var values = _.pluck(newval, config.noKendoAutoComplete.waitFor.pluck);

							noInfoPath.setItem(scope, config.noKendoAutoComplete.ngModel, values);

							scope[config.scopeKey + "_autoComplete"].value(values);
						}
					});
				}

				scope[config.scopeKey + "_autoComplete"] = el.find("input").kendoAutoComplete(kendoOptions).data("kendoAutoComplete");
			}

			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;

		}]);

})(angular);

//helpers.js
(function(angular) {
	/**
	*	## NoKendoHelpersService
	*
	*	> @service noKendoHelpers
	*
	*	This services provide various helper functions that provide access
	*	details about the a given row of data in a grid, as well as, access to
	*	grid's currently selected row.
	*
	*	> NOTE: A future enhancements will be that it allows for multi-row selection,
	*	> and cell slections.
	*/
	function NoKendoHelpersService($injector, $compile, $q, $state) {
		function _newRow(ctx, scope, el, gridName, navBarName) {
			var grid = scope[gridName],
				nonav,
				barid;

			grid.addRow();

			nonav = grid.editable.element.find("no-navigation");
			barid = $(nonav.find("navbar")[0]).attr("bar-id") + ".dirty";

			this.changeRowNavBar(ctx, scope, nonav, gridName, navBarName, barid);

			this.changeRowNavBarWatch(ctx, scope, nonav, barid, barid, scope)

		}
		this.newRow = _newRow.bind(this);

		function _editRow(ctx, scope, el, gridName, navBarName) {
			var grid = scope[gridName],
				row = this.getGridRow(el),
				barid;

			grid.editRow(row);

			barid = $(el.find("navbar")[0]).attr("bar-id") + ".dirty";

			this.changeRowNavBar(ctx, scope, el, gridName, navBarName, barid);

			this.changeRowNavBarWatch(ctx, scope, el, barid, barid, scope)

		}
		this.editRow = _editRow.bind(this);

		function _cancelRow(ctx, scope, el, gridName, navBarName) {
			var grid = scope[gridName],
				row,
				barid;

			grid.cancelRow();

			row = this.getSelectedGridRow(grid);

			this.ngCompileSelectedRow(ctx, scope, el, gridName);

			barid = $(el.find("navbar")[0]).attr("bar-id");

			this.changeRowNavBar(ctx, scope, el, gridName, navBarName, barid);

			this.changeRowNavBarWatch(ctx, scope, el, barid, barid, scope)

		}
		this.cancelRow = _cancelRow.bind(this);

		function _resolveCurrentNavigationRow(grid, el) {
			var tr;

			if(grid.editable) {
				tr = grid.editable.element;
			} else {
				tr = _getSelectedGridRow(grid);

				if(tr.length === 0) tr = _getGridRow(el);
			}

			// tr = _getGridRow(el);
			//
			// 	if(tr.length === 0) {
			//
			// }

			if(tr.length === 0) throw {error: "Could not resolve current row related to changing the rows navbar state." };

			return tr;
		}

		/*
		*	### @method getConfigMethod
		*
		*	This is a specialty function that helps NoInfoPath wrapped widgets
		*	determine where to read thier configuration data from.
		*
		*	> NOTE: This function may be either deprecated to relocated to
		*	> NoInfoPath Helpers module in the future.
		*/
		this.getConfigMethod = function(type) {
			var cfgFn = {
					"noConfig": function($injector, $compile, $state, attrs, editor) {
						var noConfig = $injector.get("noConfig");
						return noConfig.whenReady()
							.then(function() {
								return noInfoPath.getItem(noConfig.current, attrs.noConfig);
							})
							.catch(function(err) {
								console.error(err);
								return $q.reject(err); //Log in re-throw.
							});
					},
					"noForm": function($injector, $compile, $state, attrs, editor) {
						var noFormConfig = $injector.get("noFormConfig"),
							config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
							noForm = noInfoPath.getItem(config, attrs.noForm);

						return angular.copy(noForm);
					},
					"noLookup": function($injector, $compile, $state, noFormKey, editor, scope, container, options) {
						//console.log(this);

						var noFormConfig = $injector.get("noFormConfig"),
							config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
							lu = noInfoPath.getItem(config, noFormKey),
							tpl = "<no-kendo-lookup no-form=\"" + noFormKey + "\"></no-kendo-lookup>",
							comp;


						scope[lu.noLookup.scopeKey] = options.model;

						//noInfoPath.setItem(scope, editor.options.noLookup.scopeKey, options.model);

						comp = $compile(tpl)(scope);
						container.append(comp);
					},
					"noid": function($injector, $compile, $state, attrs) {
						var noNCLManager = $injector.get("noNCLManager"),
							hashStore = noNCLManager.getHashStore($state.params.fid || $state.current.name.split(".").pop()),
							ncl = hashStore.get(attrs.noid);

						return ncl.noComponent;
					}
				},
				method = cfgFn[type];

			return (method || cfgFn.noForm).bind(null, $injector, $compile, $state);
		};

		/**
		*	### @method resolveConfigType
		*
		*	This is a specialty function that is typically used in conjection with
		*	`getConfigMethod`. It helps NoInfoPath wrapped widgets
		*	resolve what type of configuration data a directive is using..
		*
		*	> NOTE: This function may be either deprecated to relocated to
		*	> NoInfoPath Helpers module in the future.
		*/
		this.resolveConfigType = function(attrs) {
			var configurationType;

			if (attrs.noConfig) {
				configurationType = "noConfig";
			} else if (attrs.noForm) {
				configurationType = "noForm";
			} else if (attrs.noid) {
				configurationType = "noid";
			} else {
				throw "noKendoGrid requires either a noConfig or noForm attribute";
			}

			return configurationType;
		};

		/**
		*	### @method getGridRow
		*
		*	This method, given a `jQuery` element, returns the closest parent
		*	that matches the `tr[data-uid]` selector, as a jQuery element.
		*
		*	This method is especially useful when used in conjection with
		*	NoInfoPath's noActionQueue service to resolve action parameters
		*	for Kendo Grid methods that require a row element as one of its
		*	parameters. It is usually expected that the action be attached to
		*	button that is child of a given row.
		*
		*/
		function _getGridRow(el) {
			var tr = el.is("[data-uid]") ? el : el.closest("tr[data-uid]");
			return $(tr);
		}
		this.getGridRow = _getGridRow;

		/**
		*	### @method getGridRowUID
		*
		*	This method, given a `jQuery` element, returns the data-uid of the
		*	supplied element's parent row that matches the `tr[data-uid]` selector.
		*
		*	This method is especially useful when used in conjection with
		*	NoInfoPath's noActionQueue service to resolve action parameters
		*	for Kendo Grid methods that require a row data-uid as one of its
		*	parameters. It is usually expected that the action be attached to
		*	button that is child of a given row.
		*
		*/
		function _getGridRowUID(el) {
			var tr = _getGridRow(el),
				uid = tr.attr("data-uid");

			return uid;
		}
		this.getGridRowUID = _getGridRowUID;

		/**
		*	### @method getSelectedGridRow
		*/
		function _getSelectedGridRow(grid) {
			return grid.select();
		}
		this.getSelectedGridRow = _getSelectedGridRow;

		/**
		*	### @method getSelectedGridRow
		*/
		function _getCurrentGridRow(scope, tragetGridID) {
			return _getSelectedGridRow(scope[targetGridID]);
		}
		this.getCurrentGridRow = _getCurrentGridRow;


		/**
		*	### @method getSelectedGridRowData
		*/
		function _getSelectedGridRowData(grid) {
			var tr = _getSelectedGridRow(grid),
				data = grid.dataItem(tr);

			return data;
		}
		this.getSelectedGridRowData = _getSelectedGridRowData;


		/**
		*	### @method currentGridRowData
		*/
		this.currentGridRowData = function(scope, el) {
			var tr = _getGridRow(el),
				grid = scope.noGrid || tr.scope().noGrid,
				data = grid.dataItem(tr);


			return data;
		};

		/**
		*	### @method currentGridRow
		*/
		this.changeRowNavBar = function(ctx, scope, el, gridScopeId, navBarName, barid) {
			var grid = scope[gridScopeId],
				tr = _resolveCurrentNavigationRow(grid, el),
				uid = noInfoPath.toScopeSafeGuid(_getGridRowUID(tr)),
				barkey = navBarName + "_" + uid,
				scopeKey = "noNavigation." + barkey + ".currentNavBar";

			if(!uid) return;

			if(grid.editable && grid.editable.validatable && grid.editable.validatable.errors().length > 0) return;

			noInfoPath.setItem(scope, scopeKey , barid);

		};

		this.changeRowNavBarWatch = function(ctx, scope, el, barid, o, s) {

			if(barid) {
				el.find("navbar").addClass("ng-hide");
				el.find("navbar[bar-id='" + barid + "']").removeClass("ng-hide");

			}

			// if(!uid) return;
			//
			// if(grid.editable && grid.editable.validatable && grid.editable.validatable.errors().length > 0) return;

			//console.log("changeNavBar", arguments);
			// if(barid === "^") {
			// 	var t = noInfoPath.getItem(scope,  "noNavigation." + barkey + ".currentNavBar"),
			// 		p = t.split(".");
			//
			// 	barid = p[0];
			// }



			//console.info("changeRowNavBarWatch",ctx.component, barid, scope.noNavigation);
			//console.log("scope, grid, tr, scopeKey, barid", scope, grid, tr, scopeKey, barid);
		}.bind(this);

		/**
		*	### @method ngCompileSelectedRow
		*/
		function _ngCompileRow(ctx, scope, el, targetGridID) {
			var grid = scope[targetGridID],
				tr = grid.select();

			$compile(tr)(scope);

			return true;

		}
		this.ngCompileSelectedRow = _ngCompileRow;


	}

	function NoKendoInlineGridEditors($state, noLoginService, noKendoDataSourceFactory, noFormConfig) {
		var editors = {
			text: function (scope, def, options) {
				// create an input element
				var input = $("<input/>");

				// set its name to the field to which the column is bound ('name' in this case)
				input.attr("name", options.field);

				return input;
			},
			combobox: function (scope, def, options) {

				var input = $("<div style=\"position: relative\"><input /></div>"),
					ctx = noFormConfig.getComponentContextByRoute($state.current.name, $state.params.entity, "noKendoGrid", "custom"),
					dataSource;

				ctx.component = {
					noDataSource: {
						"name": def.ListSource,
						"dataProvider": "noIndexedDb",
						"databaseName": "rmEFR2",
						"entityName": def.ListSource,
						"primaryKey": def.ValueField,
						"sort": [{
							"field": def.SortField
						}]
					}
				};

				if(def.Filter){
					ctx.component.noDataSource.filter = def.Filter;
				}

				dataSource = noKendoDataSourceFactory.create("combobox", noLoginService.user.userId, ctx.component, scope);

				dataSource.noInfoPath = def;

				input.find("input").attr("name", options.field);

				input.find("input").kendoComboBox({
					autobind: false,
					dataTextField: def.TextField,
					dataValueField: def.ValueField,
					dataSource: dataSource,
					template: def.Template ? def.Template : undefined,
					change: function (e) {
						var tr = e.sender.element.closest("TR"),
							grid = e.sender.element.closest("[data-role='grid']").data("kendoGrid"),
							data = grid.dataItem(tr);

						data[def.SaveColumn || "Value"] = this.dataItem();
					}
				});

				angular.element(input).children().first().addClass("full-width");
				return input;
			},
			timepicker: function(scope, def, options){
				var input = $("<div><input /></div>");

				// set its name to the field to which the column is bound ('name' in this case)
				input.find("input").attr("name", options.field);
				// input.attr("type", "time");
				input.find("input").kendoTimePicker({
					"interval": 10
				});

				return input;
			}
		},
		templates = {
			"text": function (valueObj, def) {
 				var value = angular.isObject(valueObj) ?  valueObj[def.TextField] || valueObj.Description : valueObj || "";
				return value;
			},
			"timepicker": function(valueObj) {
				var value = valueObj && valueObj.toLocaleTimeString ? valueObj.toLocaleTimeString() : "";
				return value;
			}
		},
		templateNameMap = {
			"text": "text",
			"combobox": "text",
			"timepicker": "timepicker"
		};

		this.getEditor = function(type) {
			var r = editors[type];

			if(!r) throw "Invalid inline component type: " + type;

			return r;
		};

		this.getTemplate = function(type) {
			var r = templates[templateNameMap[type]];

			if(!r) throw "Invalid inline component type: " + type;

			return r;
		};

		this.renderEditor = function(container, scope, def, options) {
			var	render = this.getEditor(def.InputType),
				input;

			if(render) {
				input = render(scope, def, options);
				input.appendTo(container);
			}
		}

		this.renderTemplate = function(def, col, model) {
			var valueObj = model[col.field],
				value = this.getTemplate(def.InputType)(valueObj, def);

			return value;
		}
	}
	angular.module("noinfopath.kendo.ui")
		.service("noKendoHelpers", ["$injector", "$compile", "$q", "$state", NoKendoHelpersService])
		.service("noKendoInlineGridEditors", ["$state", "noLoginService", "noKendoDataSourceFactory", "noFormConfig", NoKendoInlineGridEditors]);
})(angular);

//lookup.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoLookup", ["$compile", "noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm);
				select = angular.element("<select></select>");

				el.append(select);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				var kendoOptions = config.noLookup.options ? config.noLookup.options : {
						dataTextField: config.noLookup.textField,
						dataValueField: config.noLookup.valueField
					},
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

				kendoOptions.dataSource = dataSource;
				kendoOptions.value = noInfoPath.getItem(scope, config.noLookup.ngModel);

				kendoOptions.change = function(e) {
					var value = this.dataItem(this.current());

					if (!value) {
						value = {};
					}

					//value[kendoOptions.dataTextField] = this.value();

					noInfoPath.setItem(scope, config.noLookup.ngModel, this.value());
					scope[config.noLookup.scopeKey].dirty = true;
					scope.$apply();
				};

				scope[config.scopeKey + "_lookup"] = el.find("select").kendoDropDownList(kendoOptions).data("kendoLookup");

				// if (config.noKendoLookup.waitFor) {
				// 	scope.$watch(config.noKendoLookup.waitFor.property, function(newval) {
				// 		if (newval) {
				// 			var values = _.pluck(newval, config.noKendoLookup.waitFor.pluck);
				//
				// 			noInfoPath.setItem(scope, config.noKendoLookup.ngModel, values);
				//
				// 			scope[config.scopeKey + "_lookup"].value(values);
				// 		}
				// 	});
				// }

			}


			directive = {
				restrict: "E",
				compile: _compile,
				scope: false
			};

			return directive;

		}]);

})(angular);
