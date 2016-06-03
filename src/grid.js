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

		.directive("noKendoGrid", ['$injector', '$compile', '$timeout', 'noTemplateCache', '$state', '$q', 'lodash', 'noLoginService', 'noKendoDataSourceFactory', "noDataSource", "noKendoHelpers", NoKendoGridDirective])

		.service("noKendoRowTemplates", [NoKendoRowTemplates]);

})(angular);
