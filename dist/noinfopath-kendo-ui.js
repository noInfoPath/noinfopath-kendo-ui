//global.js

/*
 *	# noinfopath-kendo-ui
 *	@version 1.2.12
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

	angular.module("noinfopath.kendo.ui", ['ui.router'])

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
		.factory("noKendoDataSourceFactory", ["$injector", "$q", "noQueryParser", "noTransactionCache", "noDynamicFilters", "lodash", "$state", "noCalculatedFields", function($injector, $q, noQueryParser, noTransactionCache, noDynamicFilters, _, $state, noCalculatedFields) {

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

				this.create = function(_, userId, config, scope) {
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
							.then(success.bind(null, options.success, noTrans))
							.catch(errors.bind(options.data, options.error));

					}

					function read(_, options) {
						var provider = $injector.get(config.noDataSource.dataProvider),
							db = provider.getDatabase(config.noDataSource.databaseName),
							noTable = db[config.noDataSource.entityName];

						if(options.data.sort){
							if (config.noDataSource.sortMap) {
								for (var s in options.data.sort) {
									var sort = options.data.sort[s],
										mapped = config.noDataSource.sortMap[sort.field];

									if (mapped) {
										sort.field = mapped;
									}
								}
							}
						}else{
							if(config.noDataSource.sort){
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

						noTable.noRead.apply(noTable, noQueryParser.parse(options.data))
							.then(function(data) {
								options.success(data);
							})
							.catch(options.error);
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
							.then(success.bind(null, options.success, noTrans))
							.catch(errors.bind(null, options.error));

					}

					function destroy(options) {
						var noTrans = noTransactionCache.beginTransaction(userId, config, scope);

						noTrans.destroy(options.data)
							.then(success.bind(options.data, options.success, noTrans))
							.catch(errors.bind(options.data, options.error));

					}

					function errors(reject, err) {
						console.error(err);
						reject(err);
					}

					function success(resolve, noTrans, resp) {
						noTransactionCache.endTransaction(noTrans)
							.then(function() {
								resolve(resp);
								if (scope.noGrid) {
									scope.noGrid.dataSource.read();
								}
							});

					}

					function watch(filterCfg, newval, oldval, scope) {
						var grid = scope.noGrid,
							filters, filter;

						this.value = newval;

						if (grid) {
							filters = grid.dataSource.filter();
							filter = _.find(filters.filters, {
								field: filterCfg.field
							});
							if (filter) {
								filter.value = newval;
							}
							grid.dataSource.page(0);
							grid.refresh();
						}
					}

					var yesNo = [
							"No",
							"Yes"
						],
						parsers = {
							"date": function(data) {
								return data ? new Date(data) : "";
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

						ds.filter = angular.merge({}, $state.current.data.entities[name].filters, ds.filter);

					}

					if (dsCfg.preserveUserSort && $state.current.data.entities && $state.current.data.entities[name] && $state.current.data.entities[name].sort) {

						ds.sort = $state.current.data.entities[name].sort;

					}

					kds = new kendo.data.DataSource(ds);

					return kds;
				}.bind(this, _);

			}

			return new KendoDataSourceService();
	}]);
})(angular, kendo);

//grid.js
(function(angular, undefined) {

	function hide(noFormKey, container, options) {
		container.prev(".k-edit-label")
			.addClass("ng-hide");
		container.addClass("ng-hide");

	}

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
	function NoKendoGridDirective($injector, $compile, $timeout, /*$http,*/ noTemplateCache, $state, $q, _, noLoginService, noKendoDataSourceFactory, noDataSource, noKendoHelpers) {

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

		function _refreshKendoGrid(e, t, p) {
			var grid = p ? p.find("no-kendo-grid").data("kendoGrid") : null;

			if (grid) {
				grid.dataSource.read();
			}
		}

		function _resloveNoRecordsTemplate() {
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

		function _selectable(config, kgCfg, scope) {
			if (kgCfg.selectable === undefined || kgCfg.selectable) { //When Truthy because we always want row selection.
				kgCfg.selectable = "row";

				/*
				 *   ##### change() event handler
				 *
				 *   Listens on the Kendo UI Grid components change event
				 *   and transitions the user to the ```toState``` specified
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

					if (toState) {
						$state.go(toState, params);
					} else {
						var tableName = dsCfg.entityName;
						scope.$emit("noGrid::change+" + tableName, data);
					}
				};

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
									method = prov2[col.editor.method];

								col.editor = method.bind(null, scope);
							} else {
								//TODO: need to provide reference to editor initailizer.
								if (!col.editor.type || col.editor.type !== "provider") throw "col.editor.type is a required configuration value.";
								if (col.editor.type !== "provider" && !col.editor.noFormOptionsKey) throw "col.editor.noFormOptionsKey is a required configuration value.";

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
							provFn = config.noGrid.editable.function,
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

					} else {
						_processColumns();
					}

				} else {
					_processColumns();
				}
			}

		}

		function _handleWaitForAndConfigure(config, scope, el, attrs) {
			var dsCfg = config.noDataSource ? config.noDataSource : config;

			/*
			 * #### noDataSource::waitFor property
			 *
			 * A noDataSource object can ```waitFor``` a property on the scope to be
			 * Truthy before continuing with the grid's configuration proccess.
			 */

			if (dsCfg.waitFor) {
				if (dsCfg.waitFor.source === "scope") {
					scope.$watch(dsCfg.waitFor.property, function(newval, oldval, scope) {
						if (newval) {
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
			if (config.noGrid.rowTemplate && angular.isObject(config.noGrid.rowTemplate)) {
				var prov3 = $injector.get(config.noGrid.rowTemplate.provider),
					fn3 = prov3[config.noGrid.rowTemplate.method];

				kgCfg.rowTemplate = fn3.call(scope, kgCfg, config.noGrid);
				kgCfg.altRowTemplate = fn3.call(scope, kgCfg, config.noGrid, true);

				kgCfg.dataBound = function(e) {
					_handleRowTemplate(scope, e);
					_handleNoRecords(e, el);
				};
			} else {
				kgCfg.dataBound = function(e) {
					_handleNoRecords(e, el);
				};
			}

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
				noInfoPath.setItem(scope.$parent, config.noGrid.referenceOnParentScopeAs, scope.noGrid);
			}
		}

		function _noRecords(config, el, grid, message) {
			if (config.noGrid.noRecords) {
				el.append(grid);
				el.append(message);

				message.html($compile(_resloveNoRecordsTemplate())(scope));
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
			scope.$on("noTabs::Change", _refreshKendoGrid);

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

		function _handleNoRecords(e, el) {
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
			 * 	#### Nested grids
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
				scope.childGridFilter = e.data[config.noGrid.nestedGrid.filterProperty];
				compiledGrid = $compile("<div><no-kendo-grid no-form=\"" + config.noGrid.nestedGrid.noForm + "\"></no-kendo-grid></div>")(scope);
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

		function _configure(config, scope, el, attrs, params) {
			//console.log("configure");
			var dsCfg = config.noDataSource ? config.noDataSource : config,
				kgCfg = angular.copy(config.noKendoGrid),
				grid = angular.element("<grid></grid>"),
				message = angular.element("<message></message>"),
				dataSource;


			dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

			kgCfg.dataSource = dataSource;


			_selectable(config, kgCfg, scope);

			_editable(config, kgCfg, scope);

			_detailRowExpand(config, kgCfg, scope);

			_rowTemplate(config, kgCfg, scope, el);

			_columns(kgCfg);

			_toolbar(kgCfg);

			_noRecords(config, el, grid, message);

			_kendoize(config, kgCfg, scope, grid);

			_configureEventHandlers(config, scope);


		}

		return {
			scope: true,
			compile: _compile
		};
	}

	function NoKendoRowTemplates() {
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
					if(col.template){
						if (col.template) {
							colTpl.text(col.template);
						} else {
							colTpl.text("#=" + col.field + "#");
						}
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
	}

	angular.module("noinfopath.kendo.ui")

		.directive("noKendoGrid", ['$injector', '$compile', '$timeout', 'noTemplateCache', '$state', '$q', 'lodash', 'noLoginService', 'noKendoDataSourceFactory', "noDataSource", "noKendoHelpers", NoKendoGridDirective])

		.service("noKendoRowTemplates", [NoKendoRowTemplates]);

})(angular);

//datepicker.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", "$timeout", function(noFormConfig, $state, $timeout) {
			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm),
					input = angular.element("<input type=\"date\">");

				if (config.binding === "kendo") {
					input.attr("name", config.kendoModel);
					input.attr("data-bind", "value: " + config.kendoModel);
					config.options.change = function(data) {
						var tmp = noInfoPath.getItem(scope, config.ngKendo);
						tmp.set(config.kendoModel, this.value());
						//noInfoPath.setItem(scope, config.ngKendo, this.value());
					};

					internalDate = new Date(noInfoPath.getItem(scope, config.ngModel));
				}

				if (config.disabled === true) {
					input.attr("disabled", true);
				}

				if (attrs.$attr.required) {
					el.removeAttr("required");
					var inputHidden = angular.element("<input />");

					inputHidden.attr("type", "hidden");
					inputHidden.attr("required", "required");

					inputHidden.attr("ng-model", attrs.ngModel);
					inputHidden.attr("name", attrs.noModel);

					el.append(inputHidden);
				}

				el.append(input);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				var
					datePicker,
					internalDate;

				//Create the Kendo date picker.
				datePicker = el.find("input[type='date']").kendoDatePicker(config.options).data("kendoDatePicker");

				/*
				 *   #### @property binding
				 *
				 *   When binding property is `ng` or undefined use
				 *   Angular scope for setting and getting the date
				 *   picker's value.  Otherwise, using kendo model for
				 *   getting and setting data.
				 *
				 */
				if (config.binding === "ng" || config.binding === undefined) {
					datePicker.value(new Date(noInfoPath.getItem(scope, config.ngModel)));

					scope.$watch(config.ngModel, function(newval, oldval) {
						if (newval != oldval) {
							if (newval !== null) {
								datePicker.value(new Date(newval));
							} else if (config.initValue === true) {
								noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(new Date()));

								// if something overwrites the value of the date picker
								// (loading of a record with null data for example) this
								// will default to a new date if the initValue parameter is true.
								// Assume that if a date has an initValue that the field is required.
							}
						}
					});

					datePicker.bind("change", function() {
						var newDate = angular.isDate(this.value()) ? noInfoPath.toDbDate(this.value()) : null;

						noInfoPath.setItem(scope, config.ngModel, newDate);
						//this will solve the issue of the data not appearing on the scope
						scope.$apply();
					});

					internalDate = noInfoPath.getItem(scope, config.ngModel);
				}

				if ((config.initValue === undefined || config.initValue) && !internalDate) {
					internalDate = noInfoPath.toDbDate(new Date());
				}

				datePicker.value(new Date(internalDate));

				//fixing the issue where the data is not on the scope on initValue load
				noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(internalDate));

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



		}]);

})(angular);

//multiselect.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoMultiSelect", ["noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function(noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
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

				//if(!entity) throw dsCfg.entityName + " not found in provider " + dsCfg.dataProvider;

				dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

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

							scope[config.scopeKey + "_multiSelect"].value(values);
						}
					});
				}


				scope[config.scopeKey + "_multiSelect"] = el.kendoMultiSelect(kendoOptions).data("kendoMultiSelect");

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
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope),
					noForm = noInfoPath.getItem(config, attrs.noForm);
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

	function NoKendoHelpersService($injector, $compile, $state) {
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
					}
				},
				method = cfgFn[type];

			return (method || cfgFn.noForm).bind(null, $injector, $compile, $state);
		};

		this.resolveConfigType = function(attrs) {
			var configurationType;

			if (attrs.noConfig) {
				configurationType = "noConfig";
			} else if (attrs.noForm) {
				configurationType = "noForm";
			} else {
				throw "noKendoGrid requires either a noConfig or noForm attribute";
			}

			return configurationType;
		};
	}

	angular.module("noinfopath.kendo.ui")
		.service("noKendoHelpers", ["$injector", "$compile", "$state", NoKendoHelpersService]);
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
