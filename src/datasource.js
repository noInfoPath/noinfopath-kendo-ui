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
		.factory("noKendoDataSourceFactory", ["$injector", "noQueryParser", function($injector, noQueryParser){
			function KendoDataSourceService(){
				this.create = function (config, noTable, params){
                    //console.warn("TODO: Implement config.noDataSource and ???");
					if(!config) throw "kendoDataSourceService::create requires a config object as the first parameter";
					if(!noTable) throw "kendoDataSourceService::create requires a no noTable object as the second parameter";
					//if(noTable.constructor.name !== "NoTable") throw "noTable parameter is expected to be of type NoTable";

					var parsers = {
                            "date": function(data){
                                return new Date(data);
                            }
                        },
                        ds = angular.merge({
                        serverFiltering: true,
                        serverPaging: true,
						transport: {
							create: function(options){
								noTable.noCreate(options.data)
									.then(options.success)
									.catch(options.error);
							},
							read: function(options){

								noTable.noRead.apply(null, noQueryParser.parse(options.data))
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

                            if(field.type && field.parse) {
                                field.parse = parsers[field.type];
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
                    if(config.filter){

                        var filters = [];

                        for(var fi in config.filter){
                            var filter = angular.copy(config.filter[fi]), source;

                            if(angular.isObject(filter.value)){

                                /*
                                 *  ```scoped``` passed in from underlying directive as ```params```.
                                */
                                if(filter.value.source === "scope") {
                                    //console.warn("TODO: Need to handle use case where scope is passed in from a directive.");
                                    source = params;
                                }else{
                                    source = $injector.get(filter.value.source);
                                }

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
