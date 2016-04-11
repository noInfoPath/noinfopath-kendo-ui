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
		.factory("noKendoDataSourceFactory", ["$injector", "$q", "noQueryParser", "noTransactionCache", "noDynamicFilters", "lodash", "$state", function($injector, $q, noQueryParser, noTransactionCache, noDynamicFilters, _, $state) {

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

						if (config.noDataSource.sortMap && options.data.sort) {
							for (var s in options.data.sort) {
								var sort = options.data.sort[s],
									mapped = config.noDataSource.sortMap[sort.field];

								if (mapped) {
									sort.field = mapped;
								}

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
								create: create,
								read: read.bind(null, _),
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
