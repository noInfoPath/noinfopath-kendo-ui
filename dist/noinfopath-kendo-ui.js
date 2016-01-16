//global.js

/*
 *	# noinfopath-kendo-ui
 *	@version 1.0.23
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
		.factory("noKendoDataSourceFactory", ["$injector", "$q", "noQueryParser", "noTransactionCache", "lodash", "$state", function($injector, $q, noQueryParser, noTransactionCache, _, $state) {

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

				this.create = function(userId, config, scope) {
					//console.warn("TODO: Implement config.noDataSource and ???");
					if (!config) throw "kendoDataSourceService::create requires a config object as the first parameter";

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

					function read(options) {
						var provider = $injector.get(config.noDataSource.dataProvider),
							db = provider.getDatabase(config.noDataSource.databaseName),
							noTable = db[config.noDataSource.entityName];

						if (config.noDataSource.sortMap && options.data.sort) {
							for (var s in options.data.sort) {
								var sort = options.data.sort[s],
									mapped = config.noDataSource.sortMap[sort.field];

								if (mapped) {
									sort.field = mapped;
								}

							}

						}
						noTable.noRead.apply(null, noQueryParser.parse(options.data))
							.then(options.success)
							.catch(options.error);
					}

					function update(options) {
						var noTrans = noTransactionCache.beginTransaction(userId, config, scope),
							op = config.noDataSource.noTransaction.update[0],
							entityName = op.scopeKey ? op.scopeKey : op.entityName,
							scopeData = scope[entityName] ? scope[entityName] : {},
							tmpRec = {};

						options.data = angular.merge(options.data, scopeData);

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
								create: create,
								read: read,
								update: update,
								destroy: destroy
							},
							schema: {
								data: function(data) {
									return data.paged;
								},
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
					if (dsCfg.filter) {

						var filters = {};

						filters.logic = dsCfg.filterLogic ? dsCfg.filterLogic : "and";
						filters.filters = [];

						for (var fi in dsCfg.filter) {
							var filterCfg = dsCfg.filter[fi],
								filter = angular.copy(filterCfg),
								source;

							if (angular.isObject(filter.value)) {

								if (filter.value.source === "scope") {
									source = scope;
								} else {
									source = $injector.get(filter.value.source);
								}

								filter.value = noInfoPath.getItem(source, filter.value.property);

								filters.filters.push(filter);

								if (filterCfg.value.watch && ["scope", "$scope", "$rootScope"].indexOf(filterCfg.value.source) > -1) {
									source.$watch(filterCfg.value.property, watch.bind(filter, filterCfg));
								}
							}
						}

						/*
						 * In the case of a user wanting filters and sorts to persist across states this check makes sure that userFilters/sorts are
						 * enabled in no-forms.json. At each grid load, this will check to see if any filters/sorts have been persisted and load them
						 * for the user automatically.
						 */
						var entityName = $state.params.entity ? $state.params.entity : $state.current.name;

						ds.filter = filters;
						//grid.dataSource.filter(filters);
					}

					if (dsCfg.preserveUserFilters && $state.current.data.entities && $state.current.data.entities[name] && $state.current.data.entities[name].filters) {

						ds.filter = angular.merge({}, $state.current.data.entities[name].filters, ds.filter);

					}

					if (dsCfg.preserveUserSort && $state.current.data.entities && $state.current.data.entities[name] && $state.current.data.entities[name].sort) {

						ds.sort = $state.current.data.entities[name].sort;

					}

					kds = new kendo.data.DataSource(ds);

					return kds;
				};

			}

			return new KendoDataSourceService();
		}]);
})(angular, kendo);

//grid.js
(function(angular, undefined) {
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
	.directive("noKendoGrid", ['$injector', '$compile', '$timeout', '$http', '$state', '$q', 'lodash', 'noLoginService', 'noKendoDataSourceFactory', "noDataSource", function($injector, $compile, $timeout, $http, $state, $q, _, noLoginService, noKendoDataSourceFactory, noDataSource) {
		return {
			scope: true,
			link: function(scope, el, attrs) {
				var configurationType,
					cfgFn = {
						"noConfig": function(attrs) {
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
						"noForm": function(attrs) {
							var noFormConfig = $injector.get("noFormConfig");

							return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
								.then(function(config) {
									return noInfoPath.getItem(config, attrs.noForm);
								});
						},
						"noLookup": function(noFormKey, container, options) {
							//console.log(this);

							var lu = noInfoPath.getItem(this, noFormKey),
								tpl = "<no-lookup no-form=\"" + noFormKey + "\"></no-lookup>",
								comp;

							noInfoPath.setItem(scope, this.options.noLookup.scopeKey, options.model);

							//console.log(scope);

							comp = $compile(tpl)(scope);

							container.append(comp);

							// var cfg = noInfoPath.getItem(this, noFormKey),
							//     dataSource = noDataSource.create(cfg.noDataSource, scope, scope);

							// $('<input required data-text-field="ActionTable" data-value-field="ActionTableID" data-bind="value:' + options.field + '"/>')
							//     .appendTo(container)
							//     .kendoDropDownList({
							//         autoBind: true,
							//         dataSource: dataSource
							//     });

							console.warn("TODO: add dropdown to the container, based on options.");
						},
						"hide": function(noFormKey, container, options) {
							container.prev(".k-edit-label")
								.addClass("ng-hide");
							container.addClass("ng-hide");

						}
					};

				function configure(config, params) {
					var dsCfg = config.noDataSource ? config.noDataSource : config,
						kgCfg = angular.copy(config.noKendoGrid),
						dataSource;

					//if(!entity) throw dsCfg.entityName + " not found in provider " + dsCfg.dataProvider;


					dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, params);


					kgCfg.dataSource = dataSource;


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

					if (config.noGrid && config.noGrid.editable) {
						if (config.noGrid.editable.provider) {
							var prov = $injector.get(config.noGrid.editable.provider),
								fn = prov[config.noGrid.editable.function];

							kgCfg.edit = fn.bind(config, scope);

                            kgCfg.save = function(e){
                                $timeout(function(){
									e.sender.dataSource.read();
								});
                            };
						} else {
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
										//TODO: need to provide reference to editor initailizer.
										if (!col.editor.type) throw "col.editor.type is a required configuration value.";
										if (!col.editor.noFormOptionsKey) throw "col.editor.noFormOptionsKey is a required configuration value.";

										fn2 = cfgFn[col.editor.type];
										/*
										 *   `noFormOptionsKey` is required because it identifies where to get he configuration from
										 *   to configure the noComponent when the time comes.
										 */

										col.editor = fn2.bind(angular.copy(col.editor), col.editor.noFormOptionsKey);
									}
								}
							}
						}
					}

					if (config.noGrid.rowTemplate && angular.isObject(config.noGrid.rowTemplate)) {
						var prov3 = $injector.get(config.noGrid.rowTemplate.provider),
							fn3 = prov3[config.noGrid.rowTemplate.method];

						kgCfg.rowTemplate = fn3.call(scope, kgCfg, config.noGrid);
						kgCfg.altRowTemplate = fn3.call(scope, kgCfg, config.noGrid, true);

						kgCfg.dataBound = function(e) {
							//console.log(e);
							angular.element(".k-grid-edit")
								.click(function(e) {
									e.preventDefault();
									scope.noGrid.editRow(this.closest("tr[data-uid]"));
									return false;
								});
							angular.element(".k-grid-delete")
								.click(function(e) {
									e.preventDefault();
									scope.noGrid.removeRow(this.closest("tr[data-uid]"));
									return false;
								});
						};
					}

					scope.noGrid = el.kendoGrid(kgCfg)
						.data("kendoGrid");

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

					function refresh(e, t, p) {
						var grid = p ? p.find("no-kendo-grid").data("kendoGrid") : null;

						if(grid){
							grid.dataSource.read();
						}
					}

					/**
					 * #### noGrid refresh to make sure grids are initliazed.
					 *
					 * This fix was intended to remedy the scrollable issue when grids were located in
					 * "hidden" elements, such as inactive tabs.
					*/
					scope.$on("noTabs::Change", refresh);

					scope.$on("noSync::dataReceived", function(theGrid){
						theGrid.dataSource.read();
					}.bind(null, scope.noGrid));
				}

				function getEditorTemplate(config) {
					return $http.get(config.template)
						.then(function(resp) {
							config.template = kendo.template($compile(resp.data)(scope)
								.html());
						})
						.catch(function(err) {
							throw err;
						});
				}

				function getRowTemplate(config) {
					return $q(function(resolve, reject) {
						$http.get(config.noGrid.rowTemplateUrl)
							.then(function(resp) {
								var tmp = angular.element($compile(resp.data)(scope));

								$timeout(function() {
									config.noKendoGrid.rowTemplate = tmp[0].outerHTML;

									tmp.addClass("k-alt");

									config.noKendoGrid.altRowTemplate = tmp[0].outerHTML;

									resolve();
								}, 20);
							})
							.catch(function(err) {
								reject(err);
							});
					});

				}

				function handleWaitForAndConfigure(config) {
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
									configure(config, scope);
								}
							});
						} else {
							configure(config, scope);
						}
					} else {
						configure(config, scope);
					}
				}

				if (attrs.noConfig) {
					configurationType = "noConfig";
				} else if (attrs.noForm) {
					configurationType = "noForm";
				} else {
					throw "noKendoGrid requires either a noConfig or noForm attribute";
				}

				cfgFn[configurationType](attrs)
					.then(function(config) {
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
							promises.push(getEditorTemplate(config.noKendoGrid.editable));
						}

						if (config.noGrid && config.noGrid.rowTemplateUrl && angular.isString(config.noGrid.rowTemplateUrl)) {
							promises.push(getRowTemplate(config));
						}

						if (promises.length) {
							$q.all(promises)
								.then(function() {
									handleWaitForAndConfigure(config);
								})
								.catch(function(err) {
									console.error(err);
								});
						} else {
							handleWaitForAndConfigure(config);
						}
					})
					.catch(function(err) {
						console.error(err);
					});


			}
		};




	}])

	.service("noKendoRowTemplates", [function() {
		this.scaffold = function(cfg, noGrid, alt) {
			var holder = angular.element("<div></div>"),
				outerRow = angular.element("<tr data-uid=\"#= uid #\"></tr>"),
				outerCol = angular.element("<td class=\"no-p\" colspan=\"" + cfg.columns.length + "\"></td>"),
				table = angular.element("<table class=\"fcfn-row-template\"></table>"),
				row = angular.element("<tr></tr>"),
				colgroup = angular.element("<colgroup></colgroup>");

			// <tr data-uid="a40f44b9-d598-464d-b19e-7a3c07e1e485" role="row"><td role="gridcell"> Crossing </td>
			// <td role="gridcell">Do Not Sow</td><td role="gridcell">3</td><td role="gridcell"></td><td role="gridcell">
			// </td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell">
			// <a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span>Edit</a>
			// <a class="k-button k-button-icontext k-grid-delete" href="#"><span class="k-icon k-delete"></span>Delete</a>
			// </td></tr>

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
	}]);
})(angular);

//datepicker.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoDatePicker", ["noFormConfig", "$state", function(noFormConfig, $state) {
			function _link(scope, el, attrs) {
				return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
					.then(function(config) {
						var input = angular.element("<input type=\"date\">"),
							datePicker,
							internalDate;

						if(attrs.$attr.required)
						{
							input.attr("required", "true");
						}



						config = noInfoPath.getItem(config, attrs.noForm);



						//input.attr("value", internalDate);

                        //Kendo binding happens early.
                        if(config.binding === "kendo"){
                            input.attr("name", config.kendoModel);
                            input.attr("data-bind", "value: " + config.kendoModel);
                            config.options.change = function(data){
                                var tmp = noInfoPath.getItem(scope, config.ngKendo);
                                tmp.set(config.kendoModel, this.value());
                                //noInfoPath.setItem(scope, config.ngKendo, this.value());
                            };

                            internalDate = new Date(noInfoPath.getItem(scope, config.ngModel));
                        }
						//config.options.value =  config.kendoModel;

						// config.options.change = function(){
						//     //noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(this.value()));
						// };


						//Add input element to DOM.
						el.append(input);

						//Create the Kendo date picker.
						datePicker = input.kendoDatePicker(config.options).data("kendoDatePicker");

						// internalDate = noInfoPath.getItem(scope, config.ngModel);
						//
						// if(internalDate) {
						//     datePicker.value(new Date(internalDate));
						// } else {
						//     datePicker.value(null);
						// }



						//put back resolved
						// noInfoPath.setItem(scope, config.ngModel, internalDate);
						//

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
									datePicker.value(new Date(newval));
								}
							});

                            datePicker.bind("change", function(){

    						    noInfoPath.setItem(scope, config.ngModel, noInfoPath.toDbDate(this.value()));
    						});

                            internalDate = noInfoPath.getItem(scope, config.ngModel);
						}



                        if((config.initValue === undefined || config.initValue) && !internalDate){
						    internalDate = noInfoPath.toDbDate(new Date());
                        }

                        datePicker.value(internalDate);
						//when the internal date is falsey set it to null for Kendo compatibility
						//default display is empty
						//noInfoPath.setItem(scope, config.ngModel, internalDate ? internalDate : null);

					});

			}


			directive = {
				restrict: "E",
				link: _link,
				scope: false
			};

			return directive;



		}]);

})(angular);

//multiselect.js
(function(angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoMultiSelect", ["noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", function(noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _) {
			function configure(config, scope, el) {
				var kendoOptions = config.noKendoMultiSelect.options,
					dsCfg = config.noDataSource ? config.noDataSource : config,
					dataSource;

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

			function _link(scope, el, attrs) {
				return noFormConfig.getFormByRoute($state.current.name, $state.params.entity, scope)
					.then(function(config) {
						var input = angular.element("<select>"),
							multiSelect;

						config = noInfoPath.getItem(config, attrs.noForm);

						//noInfoPath.setItem(scope, config.ngModel,new Date());



						el.append(input);

						configure(config, scope, el);

					});

			}


			directive = {
				restrict: "E",
				link: _link,
				scope: false
			};

			return directive;



		}]);

})(angular);
