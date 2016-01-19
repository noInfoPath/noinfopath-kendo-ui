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
					// Since we save form configuration on the scope with nif-forms, we need to see if the already compiled kendo template replaced the template route or not.
					if (angular.isString(config.template))
					{
					return $http.get(config.template)
						.then(function(resp) {
							config.template = kendo.template($compile(resp.data)(scope)
								.html());
						})
						.catch(function(err) {
							throw err;
						});
					}
					else {
						return config.template;
					}
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
