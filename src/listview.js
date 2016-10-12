//lookup.js
(function (angular, undefined) {
	angular.module("noinfopath.kendo.ui")
		.directive("noKendoListView", ["$compile", "$injector", "noFormConfig", "$state", "noLoginService", "noKendoDataSourceFactory", "lodash", "noTemplateCache", "PubSub", function ($compile, $injector, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, _, noTemplateCache, PubSub) {
			function _watch(dsConfig, filterCfg, valueObj, newval, oldval, scope) {
				// var listview = scope.noListView,
				// 	filters = listview.dataSource.filter(),
				// 	filter = _.find(filters.filters, {
				// 		field: filterCfg.field
				// 	});

				// if(!filter) throw "Filter " + filterCfg.field + " was not found.";

				function handleKendoDataBoundControlsSimple(){
					console.log("handleKendoDataBoundControlsSimple");
					filter.value = newval;
				}

				function handleKendoDataBoundControlsAdvanced(){
					console.log("handleKendoDataBoundControlsAdvanced");
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

				// listview.dataSource.page(0);
				// listview.refresh();

			}

			function _compile(el, attrs) {
				var config = noFormConfig.getFormByRoute($state.current.name, $state.params.entity),
					noForm = noInfoPath.getItem(config, attrs.noForm);
				//select = angular.element("<select></select>");

				//el.append(select);

				return _link.bind(null, noForm);
			}

			function _link(config, scope, el, attrs) {
				noTemplateCache.get(config.noListView.templateUrl)
					.then(function (html) {
						var kendoOptions = {};
						kendoOptions.dataSource = noKendoDataSourceFactory.create(noLoginService.user.userId, config, scope, _watch);
						kendoOptions.template = kendo.template(html);
						scope.noListView = el.kendoListView(kendoOptions).data("kendoListView");
						if(config.noListView.referenceOnParentScopeAs) scope.$parent[config.noListView.referenceOnParentScopeAs] = scope.noListView;
					})
					.catch(function (err) {
						console.error(err);
					});

				var pubID = PubSub.subscribe("noTabs::change", function(data){
					console.log("noTabs::change", arguments);
				});

				scope.$on("$dispose", function(){
					PubSub.unsubscribe(pubID);
				});
					//kendoOptions.value = noInfoPath.getItem(scope, config.noLookup.ngModel);

					// kendoOptions.change = function(e) {
					// 	var value = this.dataItem(this.current());
					//
					// 	if (!value) {
					// 		value = {};
					// 	}
					//
					// 	//value[kendoOptions.dataTextField] = this.value();
					//
					// 	noInfoPath.setItem(scope, config.noLookup.ngModel, this.value());
					// 	scope[config.noLookup.scopeKey].dirty = true;
					// 	scope.$apply();
					// };


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
				scope: true
			};

			return directive;

		}]);

})(angular);
