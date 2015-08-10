(function (angular, undefined){
	"use strict";

	angular.module("noinfopath.data.mock", [])
		.service("queryParser", [function(){
			var filters, sort, paging;

			this.parse = function(query){
				//This is very implementation specific operation.
				//For the purpose of this mock, we'll assume that,
				//query supports the filter, sort and paging as named.

				filters = query.filters;
				sort = query.sort;
				paging = query.paging;
			};

			this.toArray = function(){
				return [filters, sort, paging];
			};
		}])

		.service("queryBuilder", [function(){
			this.toODATA = function (queryOptions, parser) {
				return "$filter=foo eq 'bar'&$orderby=foo desc&$skip=10&$top=10";
			};

			this.toSQL = function (queryOptions, parser) {
				return "WHERE foo = 'bar' ORDER BY foo DESC";
			};
		}])

		.service("db", ["$q", "$timeout", "queryParser", "queryBuilder", "noDbSchema", function($q, $timeout, queryParser, queryBuilder, noDbSchema){
			var THIS = this;

			function NoTable(tableOptions, queryParser, queryBuilder){
				if(!queryParser) throw "TODO: implement default queryParser service";
				if(!queryBuilder) throw "TODO: implement default queryBuilder service";

				this.noCreate = function(data){

					var deferred = $q.defer();

					$timeout(function(){
						deferred.resolve();
					});

					return deferred.promise;
				};

				this.noRead = function() {
					var filters, sort, page;

					for(var ai in arguments){
						var arg = arguments[ai];

						//success and error must always be first, then
						if(angular.isObject(arg)){
							switch(arg.constructor.name){
								case "NoFilters":
									filters = arg;
									break;
								case "NoSort":
									sort = arg;
									break;
								case "NoPage":
									page = arg;
									break;
							}
						}
					}

					var deferred = $q.defer();

					$timeout(function(){
						deferred.resolve();
					});

					$timeout.flush();

					return deferred.promise;
				};

				this.noUpdate = function(data) {
					var json = angular.toJson(data);

					var deferred = $q.defer();

					$timeout(function(){
						deferred.promise();
					});

					$timeout.flush();

					return deferred.promise;

				};

				this.noDestroy = function(data) {
					var deferred = $q.defer();

					$timeout(function(){
						deferred.promise();
					});

					$timeout.flush();

					return deferred.promise;
				};
			}


			this.whenReady = function(queryOptions){
				//var d = $q.defer();

				//$timeout(function(){
					configure.call(this,queryOptions);
				//});

				//$timeout.flush();

				//return d.promise;
			};

			function configure(){
				for(var s in noDbSchema.tables){
					var schema = noDbSchema.tables[s];
					THIS[schema.tableName] = new NoTable(schema, queryParser, queryBuilder);
				}
			}
		}]);
})(angular);
