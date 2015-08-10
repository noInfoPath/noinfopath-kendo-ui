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

	angular.module("noinfopath.kendu.ui")
		.service("kendoQueryParser",[function(){
			var filters, sort, paging;

			Object.defineProperties(this, {
				"hasFilters": {
					"get": function(){
						return !!filters;
					}
				},
				"hasSort": {
					"get": function(){
						return !!sort;
					}
				},
				"hasPaging": {
					"get": function(){
						return !!paging;
					}
				}
			});

			this.parse = function(kendoOptions){
				console.warn("TODO: Implement kendoQueryParser::parse method.");
			};

			this.toArray = function(){
				var arr = [];

				if(this.hasFilters) arr.push(filters);

				if(this.hasSort) arr.push(sort);

				if(this.hasPaging) arr.push(paging);

				if(arr.length === 0) arr = undefined;

				return arr;
			};
		}]);
})(angular);
