//grid.js
(function(angular, undefined) {
	function getConfigMethod(type, $injector, $compile, $state){
		var cfgFn = {
			"noConfig": function($injector, attrs) {
				var noConfig = $injector.get("noConfig");
				return noConfig.whenReady()
					.then(function() {
						return noInfoPath.getItem(noConfig.current, attrs.noConfig);
					})
					.catch(function(err) {
						console.error(err);
						return $q.reject(err); //Log in re-throw.
					});
			}.bind(null, $injector),
			"noForm": function($injector, $state, attrs) {
				var noFormConfig = $injector.get("noFormConfig"),
					config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm);

				return angular.copy(noForm);
			}.bind(null, $injector, $state),
			"noLookup": function($compile, THIS, noFormKey, container, options) {
				//console.log(this);

				var lu = noInfoPath.getItem(THIS, noFormKey),
					tpl = "<no-lookup no-form=\"" + noFormKey + "\"></no-lookup>",
					comp;

				noInfoPath.setItem(scope, THIS.options.noLookup.scopeKey, options.model);

				comp = $compile(tpl)(scope);

				container.append(comp);
			}.bind(null, $compile)
		},
		method = cfgFn[type];

		return method || cfgFn.noForm;
	}

	function resolveConfigType(attrs){
		var configurationType;

		if (attrs.noConfig) {
			configurationType = "noConfig";
		} else if (attrs.noForm) {
			configurationType = "noForm";
		} else {
			throw "noKendoGrid requires either a noConfig or noForm attribute";
		}

		return configurationType;
	}

	function hide(noFormKey, container, options){
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
	function NoKendoGridDirective($injector, $compile, /*$timeout, $http,*/noTemplateCache , $state, $q, _, noLoginService, noKendoDataSourceFactory, noDataSource){

		function getKendoGridEditorTemplate(config, scope) {
			return noTemplateCache.get(config.template)
				.then(function(resp){
					config.template = kendo.template($compile(resp.data)(scope).html());
				})
				.catch(function(err) {
					throw err;
				});

		}

		function getKendoGridRowTemplate(config, scope) {
			return noTemplateCache.get()
				.then(function(resp){
					var tmp = angular.element($compile(resp.data)(scope));

					//$timeout(function() {
					config.noKendoGrid.rowTemplate = tmp[0].outerHTML;

					tmp.addClass("k-alt");

					config.noKendoGrid.altRowTemplate = tmp[0].outerHTML;

						//resolve();
					//}, 1);
				});


		}

		function refreshKendoGrid(e, t, p) {
			var grid = p ? p.find("no-kendo-grid").data("kendoGrid") : null;

			if (grid) {
				grid.dataSource.read();
			}
		}

		function resolveKendoGridTemplates(config, scope, el, attrs) {
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
				promises.push(getKendoGridEditorTemplate(config.noKendoGrid.editable, scope));
			}

			if (config.noGrid && config.noGrid.rowTemplateUrl && angular.isString(config.noGrid.rowTemplateUrl)) {
				promises.push(getKendoGridRowTemplate(config, scope));
			}

			if (promises.length) {
				$q.all(promises)
					.then(function() {
						handleWaitForAndConfigure(config, scope, el, attrs);
					})
					.catch(function(err) {
						console.error(err);
					});
			} else {
				handleWaitForAndConfigure(config, scope, el, attrs);
			}
		}

		function configure(config, scope, el, attrs, params) {
			var dsCfg = config.noDataSource ? config.noDataSource : config,
				kgCfg = angular.copy(config.noKendoGrid),
				dataSource;

			dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope);

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

			if (config.noGrid && config.noGrid.nestedGrid) {
				kgCfg.detailInit = function(e) {
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
					if(angular.isObject(config.noGrid.nestedGrid)){
						scope.childGridFilter = e.data[config.noGrid.nestedGrid.filterProperty];
						compiledGrid = $compile("<div><no-kendo-grid no-form=\"" + config.noGrid.nestedGrid.noForm + "\"></no-kendo-grid></div>")(scope);
					} else {
						compiledGrid = $compile("<div><no-kendo-grid no-form=\"" + config.noGrid.nestedGrid + "\"></no-kendo-grid></div>")(scope);
					}

					//console.log(compiledGrid);
					// angular.element(e.detailCell).append(tmpHtml);
					//angular.element(e.detailCell).append(compiledGrid.html());
					$(compiledGrid).appendTo(e.detailCell);
				};

			}

			if (config.noGrid.rowTemplate && angular.isObject(config.noGrid.rowTemplate)) {
				var prov3 = $injector.get(config.noGrid.rowTemplate.provider),
					fn3 = prov3[config.noGrid.rowTemplate.method];

				kgCfg.rowTemplate = fn3.call(scope, kgCfg, config.noGrid);
				kgCfg.altRowTemplate = fn3.call(scope, kgCfg, config.noGrid, true);

				kgCfg.dataBound = function(e) {
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

			if (kgCfg.toolbar) {
				if (angular.isString(kgCfg.toolbar)) {
					kgCfg.toolbar = kendo.template(kgCfg.toolbar);
				}
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

			/**
			 * #### noGrid refresh to make sure grids are initliazed.
			 *
			 * This fix was intended to remedy the scrollable issue when grids were located in
			 * "hidden" elements, such as inactive tabs.
			 */
			scope.$on("noTabs::Change", refreshKendoGrid);

			scope.$on("noSync::dataReceived", function(theGrid) {
				theGrid.dataSource.read();
			}.bind(null, scope.noGrid));
		}

		function handleWaitForAndConfigure(config, scope, el, attrs) {
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
							configure(config, scope, el, attrs, newval);
						}
					});
				} else {
					configure(config, scope, el, attrs);
				}
			} else {
				configure(config, scope, el, attrs);
			}
		}

		function _compile(el, attrs){
			var method = getConfigMethod(resolveConfigType(attrs), $injector, $compile, $state),
				noForm = method(attrs);

			return _link.bind(null, noForm);
		}

		function _link(config, scope, el, attrs){
			resolveKendoGridTemplates(config, scope, el, attrs);
		}

		return {
			scope: true,
			compile: _compile
		};

	}

	function NoKendoRowTemplates(){
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
	}

	angular.module("noinfopath.kendo.ui")

		.directive("noKendoGrid", ['$injector', '$compile', '$timeout', '$http', '$state', '$q', 'lodash', 'noLoginService', 'noKendoDataSourceFactory', "noDataSource", NoKendoGridDirective])

		.service("noKendoRowTemplates", [NoKendoRowTemplates]);

})(angular);
