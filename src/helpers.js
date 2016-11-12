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
			var tr = el.closest("tr[data-uid]");
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

			//console.log("changeNavBar", arguments);
			// if(barid === "^") {
			// 	var t = noInfoPath.getItem(scope,  "noNavigation." + barkey + ".currentNavBar"),
			// 		p = t.split(".");
			//
			// 	barid = p[0];
			// }



			noInfoPath.setItem(scope, scopeKey , barid);

			console.log("scope, grid, tr, scopeKey, barid", scope, grid, tr, scopeKey, barid);
		};

		this.changeRowNavBarWatch = function(ctx, scope, el, barid, o, s) {
			// var grid = scope.noGrid,
			// 	tr = _resolveCurrentNavigationRow(grid, el);
			// 	// uid = noInfoPath.toScopeSafeGuid(_getGridRowUID(tr)),
				// barkey = ctx.component.scopeKey + "_" + uid,
				// scopeKey = "noNavigation." + barkey + ".currentNavBar";


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



			console.info("changeRowNavBarWatch",ctx.component, barid, scope.noNavigation);
			//console.log("scope, grid, tr, scopeKey, barid", scope, grid, tr, scopeKey, barid);
		};

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

	angular.module("noinfopath.kendo.ui")
		.service("noKendoHelpers", ["$injector", "$compile", "$q", "$state", NoKendoHelpersService]);
})(angular);
