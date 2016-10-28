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

		function _getGridRow(el) {
			var tr = el.closest("tr");
			return $(tr);
		}
		this.getGridRow = _getGridRow;

		function _getGridRowUID(el) {
			var tr = _getGridRow(el),
				uid = tr.attr("data-uid");

			return uid;
		}
		this.getGridRowUID = _getGridRowUID;

	}

	angular.module("noinfopath.kendo.ui")
		.service("noKendoHelpers", ["$injector", "$compile", "$state", NoKendoHelpersService]);
})(angular);
