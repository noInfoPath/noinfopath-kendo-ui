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
						var grid = scope.noGrid;

						this.value = newval;

						if(grid){
							grid.dataSource.read();
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
