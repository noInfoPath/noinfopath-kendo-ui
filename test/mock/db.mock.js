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

function NoTable(table, tableName, database){
	if(!table) throw "table is a required parameter";
	if(!tableName) throw "tableName is a required parameter";
	if(!database) throw "database is a required parameter";

	var _table = table,
		_tableName = tableName,
		_db = database
	;

	/**
	* ### _getOne(rowid)
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |rowid|Number or Object| When a number assume that you are filtering on "rowId". When an Object the object will have a key, and value property.|
	*/
	function _getOne(rowid){
		var deferred = $q.defer(),
			filters = new noInfoPath.data.NoFilters(),
			sqlExpressionData;

		if(angular.isObject(rowid)){
			filters.add(rowid.key, null, true, true, [{
				"operator" : "eq",
				"value": rowid.value,
				"logic": null
			}]);
		}else{
			filters.add("rowid", null, true, true, [{
				"operator" : "eq",
				"value": rowid,
				"logic": null
			}]);
		}

		sqlExpressionData = noDbSchema.createSqlReadStmt(_tableName, filters);

		_exec(sqlExpressionData)
			.then(function(resultset){
				if(resultset.rows.length === 0){
					deferred.resolve({});
				}else{
					deferred.resolve(resultset.rows[0]);
				}
			})
			.catch(deferred.reject);

		return deferred.promise;
	}

	/**
	* ### _exec(sqlExpressionData)
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |sqlExpressionData|Object|An object with two properties, queryString and valueArray. queryString is the SQL statement that will be executed, and the valueArray is the array of values for the replacement variables within the queryString.|
	*/

	function _exec(sqlExpressionData){
		var deferred = $q.defer(), valueArray;

		if(sqlExpressionData.valueArray){
			valueArray = sqlExpressionData.valueArray;
		} else {
			valueArray = [];
		}

		_webSQL.transaction(function(tx){
			tx.executeSql(
				sqlExpressionData.queryString,
				valueArray,
				function(t, resultset){
					deferred.resolve(resultset);
				},
				deferred.reject
			);
		});

		return deferred.promise;
	}

	/**
	* ### webSqlOperation(operation, noTransaction, data)
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |operation|String|Either a "C" "U" or "D"|
	* |noTransaction|Object|The noTransaction object that will commit changes to the NoInfoPath changes table for data synchronization|
	* |data|Object|Name Value Pairs|
	*/

	function webSqlOperation(operation, noTransaction, data){
		// noTransaction is not required, but is needed to track transactions
		var deferred = $q.defer(),
			createObject = noDbSchema.createSqlInsertStmt(_tableName, data),
			ops = {
				"C": noDbSchema.createSqlInsertStmt,
				"U": noDbSchema.createSqlUpdateStmt,
				"D": noDbSchema.createSqlDeleteStmt
			},
			sqlExpressionData,
			noFilters = new noInfoPath.data.NoFilters(),
			id;

			if(operation === "C"){
				id = data[_table.primaryKey] = noInfoPath.createUUID();
			} else {
				id = data[_table.primaryKey];
			}

			noFilters.add(_table.primaryKey, null, true, true, [{operator: "eq", value: id}]);

			sqlExpressionData = ops[operation](_tableName, data, noFilters);

			_db.transaction(function(tx){
				if(operation === "D"){
					_getOne({"key": _table.primaryKey, "value": data[_table.primaryKey]}, tx)
						.then(function(result){
							_exec(sqlExpressionData)
								.then(function(result){
									noTransaction.addChange(_tableName, this, "D");
									deferred.resolve(result);
								}.bind(result))
								.catch(deferred.reject);
						})
						.catch(deferred.reject);
				}else{
					_exec(sqlExpressionData)
						.then(function(result){
							_getOne(result.insertId)
								.then(function(result){
									noTransaction.addChange(_tableName, result, operation);
									deferred.resolve(result);
								})
								.catch(deferred.reject);
						})
						.catch(deferred.reject);
				}
			});

		return deferred.promise;
	}

	/**
	* ### noCreate(data, noTransaction)
	*
	* Inserts a record into the websql database with the data provided.
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |data|Object|Name Value Pairs|
	* |noTransaction|Object|The noTransaction object that will commit changes to the NoInfoPath changes table for data synchronization|
	*/

	this.noCreate = function(data, noTransaction){
		return webSqlOperation("C", noTransaction, data);
	};

	/**
	* ### noRead([NoFilters, NoSort, NoPage])
	*
	* Reads records from the websql database.
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |NoFilters|Object|(Optional) A noInfoPath NoFilters Array|
	* |NoSort|Object|(Optional) A noInfoPath NoSort Object|
	* |NoPage|Object|(Optional) A noInfoPath NoPage Object|
	*/

	this.noRead = function() {

		var filters, sort, page,
			deferred = $q.defer(),
			readObject;

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

		readObject = noDbSchema.createSqlReadStmt(_tableName, filters, sort, page);

		function _txCallback(tx){
			tx.executeSql(
				readObject.queryString,
				[],
				function(t, r){
					deferred.resolve(r);
				},
				function(t, e){
					deferred.reject(e);
				});
		}

		function _txFailure(error){
			console.error("Tx Failure", error);
		}

		function _txSuccess(data){
			console.log("Tx Success", data);
		}

		_db.transaction(_txCallback, _txFailure, _txSuccess);

		return deferred.promise;
	};

	/**
	* ### noUpdate(data, noTransaction)
	*
	* Updates a record from the websql database based on the Primary Key of the data provided.
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |data|Object|Name Value Pairs|
	* |noTransaction|Object|The noTransaction object that will commit changes to the NoInfoPath changes table for data synchronization|
	*/

	this.noUpdate = function(data, noTransaction) {
		// removed the filters parameter as we will most likely be updating one record at a time. Expand this by potentially renaming this to noUpdateOne and the replacement noUpdate be able to handle filters?
		return webSqlOperation("U", noTransaction, data);
	};

	/**
	* ### noDestroy(data, noTransaction)
	*
	* Deletes a record from the websql database based on the Primary Key of the data provided.
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |data|Object|Name Value Pairs|
	* |noTransaction|Object|The noTransaction object that will commit changes to the NoInfoPath changes table for data synchronization|
	*/

	this.noDestroy = function(data, noTransaction) {
		return webSqlOperation("D", noTransaction, data);
	};

	/**
	* ### noOne(data)
	*
	* Reads a record from the websql database based on the Primary Key of the data provided.
	*
	* #### Parameters
	*
	* |Name|Type|Description|
	* |----|----|-----------|
	* |data|Object|Name Value Pairs|
	*/

	this.noOne = function(data) {
		var deferred = $q.defer(),
			key = data[_table.primaryKey],
			oneObject = noDbSchema.createSqlOneStmt(_tableName, _table.primaryKey, key);

		function _txCallback(tx){

			tx.executeSql(oneObject.queryString,
				oneObject.valueArray,
				function(t, r){
					deferred.resolve(r);
				},
				function(t, e){
					deferred.reject(e);
				});

		}

		function _txFailure(error){
			console.error("Tx Failure", error);
		}

		function _txSuccess(data){
			console.log("Tx Success", data);
		}

		_db.transaction(_txCallback, _txFailure, _txSuccess);

		return deferred.promise;
	};

}
