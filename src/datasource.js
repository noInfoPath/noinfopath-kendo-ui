(function(angular, kendo){
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
		.factory("noKendoDataSourceFactory", ["$injector", "$q", "noQueryParser", "noTransactionCache", function($injector, $q, noQueryParser, noTransactionCache){
			function KendoDataSourceService(){
				this.create = function (userId, config, scope){
                    //console.warn("TODO: Implement config.noDataSource and ???");
					if(!config) throw "kendoDataSourceService::create requires a config object as the first parameter";

                    function create(options){
                        var noTrans = noTransactionCache.beginTransaction(userId, config, scope);

                        noTrans.upsert(options.data)
                            .then(noTransactionCache.endTransaction.bind(noTrans, noTrans))
                            .then(options.success)
                            .catch(function(err){
                                options.error(err);
                            });

                    }

                    function read(options){
                        var provider = $injector.get(config.noDataSource.dataProvider),
                            db = provider.getDatabase(config.noDataSource.databaseName),
                            noTable = db[config.noDataSource.entityName];

                        noTable.noRead.apply(null, noQueryParser.parse(options.data))
                           .then(options.success)
                           .catch(options.error);
                    }

                    function update(options){
                        var noTrans = noTransactionCache.beginTransaction(userId, config, scope);

                        noTrans.upsert(options.data)
                            .then(noTransactionCache.endTransaction.bind(noTrans, noTrans))
                            .then(options.success)
                            .catch(options.error);

                    }

                    function destroy(options){
                        var noTrans = noTransactionCache.beginTransaction(userId, config, scope);

                        noTrans.destory(options.data)
                            .then(noTransactionCache.endTransaction.bind(noTrans, noTrans))
                            .then(options.success)
                            .catch(options.error);

                    }

                    function errors(err){
                        console.error(err);
                    }

					function watch(filterCfg, newval, oldval, scope){
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
                            "date": function(data){
								return data ? new Date(data) : "";
                            },
                            "ReverseYesNo": function(data){
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
							data: function(data){
								return data.paged;
							},
							total: function(data){
								return data.total;
							}

						}
					}, config.noKendoDataSource),
                    dsCfg = config.noDataSource ? config.noDataSource : config,
                    kds;

                    /**
                    *   #### Schema Model
                    *
                    *   When the noKendoDataSource config contains a schema.model
                    *   then loop through looking for fields that have a type and a
                    *   parser property and set the parser propety to one of
                    *   parse functions defined in the parsers collection.
                    */
                    if(ds.schema.model && ds.schema.model.fields){
                        var fields = ds.schema.model.fields;
                        for(var f in fields){
                            var field = fields[f];

                            if(field.parse) {
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
                    *   exmaple.
                    */
                    if(dsCfg.filter){

                        var filters = [];

                        for(var fi in dsCfg.filter){
                            var filterCfg = dsCfg.filter[fi],
                                filter = angular.copy(filterCfg), source;

                            if(angular.isObject(filter.value)){

                                if(filter.value.source === "scope") {
                                    source = scope;
                                }else{
                                    source = $injector.get(filter.value.source);
                                }

                                filter.value = noInfoPath.getItem(source, filter.value.property);

                                filters.push(filter);

                                if(filterCfg.value.watch && ["scope", "$scope", "$rootScope"].indexOf(filterCfg.value.source) > -1){
                                    source.$watch(filterCfg.value.property, watch.bind(filter, filterCfg));
                                }
                            }
                        }


                        ds.filter = filters;
                        //grid.dataSource.filter(filters);
                    }

                    kds = new kendo.data.DataSource(ds);

					return kds;
				};

			}

			return new KendoDataSourceService();
		}]);
})(angular, kendo);
