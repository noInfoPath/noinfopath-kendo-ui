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
		.factory("noKendoDataSourceFactory", ["$injector", "$q", "noQueryParser", "noTransactionCache", "noDynamicFilters", "lodash", "$state", "noCalculatedFields", "noActionQueue", "noAreaLoader", function($injector, $q, noQueryParser, noTransactionCache, noDynamicFilters, _, $state, noCalculatedFields, noActionQueue, noAreaLoader) {

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

				this.create = function(_, noFormAttr, userId, config, scope, watch) {
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
							.then(success.bind(null, options.success, noTrans, op))
							.catch(errors.bind(options.data, options.error));

					}

					function read(_, options) {
						var provider = $injector.get(config.noDataSource.dataProvider),
							db = provider.getDatabase(config.noDataSource.databaseName),
							noTable = db[config.noDataSource.entityName],
							noReadOptions = new noInfoPath.data.NoReadOptions(config.noDataSource.noReadOptions),
							readArgs;

						noReadOptions.followForeignKeys = true;
						noReadOptions.followRelations = false;
						noReadOptions.followParentKeys = false;

						if (options.data.sort) {
							if (config.noDataSource.sortMap) {
								for (var s in options.data.sort) {
									var sort = options.data.sort[s],
										mapped = config.noDataSource.sortMap[sort.field];

									if (mapped) {
										sort.field = mapped;
									}
								}
							}
						} else {
							if (config.noDataSource.sort) {
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

						readArgs = noQueryParser.parse(options.data);
						readArgs.push(noReadOptions);

						noAreaLoader.markComponentLoading($state.current.name, noFormAttr);

						noTable.noRead.apply(noTable, readArgs)
							.then(function(data) {

								if(config.noDataSource.actions && config.noDataSource.actions.post) {
									var queue = noActionQueue.createQueue(data, scope, null, config.noDataSource.actions.post);

									noActionQueue.synchronize(queue)
										.then(function(results){
											options.success(results[0]);
										});
								} else {
									options.success(data);
								}

							})
							.catch(function(e) {
								options.error(e);
							})
							.finally(function(){
								noAreaLoader.markComponentLoaded($state.current.name, noFormAttr);
							});
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
							.then(success.bind(null, options.success, noTrans, op))
							.catch(errors.bind(null, options.error));

					}

					function destroy(options) {
						var noTrans = noTransactionCache.beginTransaction(userId, config, scope),
							op = config.noDataSource.noTransaction.destroy[0];

						noTrans.destroy(options.data)
							.then(success.bind(options.data, options.success, noTrans, op))
							.catch(errors.bind(options.data, options.error));

					}

					function errors(reject, err) {
						console.error(err);
						reject(err);
					}

					function success(resolve, noTrans, op, resp) {
						noTransactionCache.endTransaction(noTrans)
							.then(function(op) {
								if(op.actions && op.actions.post){
									var q = noActionQueue.createQueue({}, scope, {}, op.actions.post);
									noActionQueue.synchronize(q)
										.then(function(){
											resolve(resp);
											if (scope.noGrid) {
												scope.noGrid.dataSource.read();
											}
										})
										.catch(function(err){
											throw err;
										});
								} else {
									resolve(resp);
									if (scope.noGrid) {
										scope.noGrid.dataSource.read();
									}
								}
							}.bind(null, op));

					}

					var yesNo = [
							"No",
							"Yes"
						],
						parsers = {
							"date": function(data) {
								return data ? new Date(data) : "";
							},
							"utcDate": function(data) {
								return data ? moment.utc(noInfoPath.toDisplayDate(data)).format("L") : "";
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

						ds.filter = angular.merge({}, ds.filter, $state.current.data.entities[name].filters);

					}

					if (dsCfg.preserveUserSort && $state.current.data.entities && $state.current.data.entities[name] && $state.current.data.entities[name].sort) {

						ds.sort = $state.current.data.entities[name].sort;

					}

					kds = new kendo.data.DataSource(ds);

					return kds;
				}.bind(this, _);

			}

			return new KendoDataSourceService();
		}])
		;
})(angular, kendo);
