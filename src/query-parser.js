/*
*	## kendoQueryParser
*
*	### Overview
*	The kendoQueryParser takes the `data` property of the options
*	parameter passed to the Kendo DataSources transport.read method. The
*	data object is inspected and its filter, sort, and paging values are
*	converted to NoInfoPath compatible versions.
*
*	### Methods
*
*	#### parse(kendoOptions)
*	Parses the Kendo options into NoInfoPath compatible objects. Stores
*	the results internally for future use.
*
*	#### toArray()
*	Returns any filters, sorts or paging data as an array compatible
*	with a call to `function.prototype.array`.
*
*	### Properties
*
*	|Name|Type|Description|
*	|----|----|-----------|
*	|hasFilters|Boolean|Returns true if filters are available.|
*	|hasSort|Boolean|Returns true if sorts are available.|
*	|hasPaging|Boolean|Returns true if paging data is available.|
*/
(function(angular, undefined){
	"use strict";

	angular.module("noinfopath.kendo.ui")
		.service("kendoQueryParser",[function(){
			var filters, sort, paging;

			this.parse = function(kendoOptions){
                var filters, sort, paging;

				//filter { logic: "and", filters: [ { field: "name", operator: "startswith", value: "Jane" } ] }
				//{"take":10,"skip":0,"page":1,"pageSize":10,"filter":{"logic":"and","filters":[{"value":"apple","operator":"startswith","ignoreCase":true}]}}
				if(!!kendoOptions.take) paging = new noInfoPath.data.NoPage(kendoOptions.skip, kendoOptions.take);
				if(!!kendoOptions.sort) sort = new noInfoPath.data.NoSort(kendoOptions.sort);
				if(!!kendoOptions.filter) filters = new noInfoPath.data.NoFilters(kendoOptions.filter);

                return toArray(filters, sort, paging);
            };

			function toArray(filters, sort, paging){
				var arr = [];

				if(!!filters) arr.push(filters);

				if(!!sort) arr.push(sort);

				if(!!paging) arr.push(paging);

				if(arr.length === 0) arr = undefined;

				return arr;
			}
		}]);
})(angular);
