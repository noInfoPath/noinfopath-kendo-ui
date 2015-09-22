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
		.factory("noKendoDataSourceFactory", ["$injector", "kendoQueryParser", function($injector, kendoQueryParser){
			function KendoDataSourceService(){
				this.create = function (config, noTable){
					if(!config) throw "kendoDataSourceService::create requires a config object as the first parameter";
					if(!noTable) throw "kendoDataSourceService::create requires a no noTable object as the second parameter";
					//if(noTable.constructor.name !== "NoTable") throw "noTable parameter is expected to be of type NoTable";

					var ds = angular.merge({
                        serverFiltering: true,
                        serverPaging: true,
						transport: {
							create: function(options){
								noTable.noCreate(options.data)
									.then(options.success)
									.catch(options.error);
							},
							read: function(options){

								noTable.noRead.apply(null, kendoQueryParser.parse(options.data))
									.then(options.success)
									.catch(options.error);
							},
							update: function(options){
								noTable.noUpdate(options.data)
									.then(options.success)
									.catch(options.error);
							},
							destroy: function(options){
								noTable.noDestroy(options.data)
									.then(options.success)
									.catch(options.error);
							}
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
                    kds;

                    /*
                    *   The `filter` property requires special processing because
                    *   it supports dynamic value binding from any injectable
                    *   data source location.  $scope or $stateParams for
                    *   exmaple.
                    */
                    if(config.filter){

                        var filters = [];

                        for(var f in config.filter){
                            var filter = angular.copy(config.filter[f]);

                            if(angular.isObject(filter.value)){
                                var source = $injector.get(filter.value.source);

                                filter.value = noInfoPath.getItem(source, filter.value.property);

                                filters.push(filter);
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
