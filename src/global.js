//global.js


/*
 *	[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)
 *
 *	___
 *
 *	[NoInfoPath Kendo UI (noinfopath-kendo-ui)](home) *@version 2.0.19*
 *
 *	Copyright (c) 2017 The NoInfoPath Group, LLC.
 *
 *	Licensed under the MIT License. (MIT)
 *
 *
 *	## Overview
 *	NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
 *	it with NoInfoPath Data. It is important to note that this module inplements
 *  implied interfaces that NoInfoPath defines. For the sake if this discussion
 *  we'll use the generic object oriented notation of "IXyz", where "I" stands
 *  for interface. This particular module will implement the IQueryParser, and
 *  IQueryBuilder interface.
 *
 *
 *
 *
 *	### Directives
 *
 *  TODO Needs better descriptions
 *
 *	|Name|Description|
 *	|----|-----------|
 *	|[noKendoAutoComplete](autocomplete)|Autocomplete|
 *	|[noKendoCombobox](combobox)|combobox|
 *	|[noKendoDatePicker](datepicker)|pick dates|
 *	|[noKendoGrid](grid)|The infamous Kendo Grid|
 *	|[noKendoListView](listview)|List view|
 *	|[noKendoLookup](lookup)|A glorified select tag|
 *	|[noKendoMultiSelect](multiselect)|A glorified select tag that is actually cool|
 *
 *	### Services
 *	|[kendoQueryParser](query-parser)|Query Parser|
 *	|[noKendoHelpers](helpers)|Helpers for Kendo|
 *	|[noKendoDataSourceFactory](datasource)|Helps with kendo data source|
 *
 * test
 *
 *	## Dependencies
 *
 *	- AngularJS
 *	- jQuery
 *	- ngLodash
 *	- noinfopath
 *	- noinfopath.data
 */

/**
 *	## Development Dependencies
 *
 *	> See `package.json` for exact version requirements.
 *
 *	- indexedDB.polyfill
 *	- angular-mocks
 *	- es5-shim
 *	- grunt
 *	- grunt-bumpup
 *	- grunt-version
 *	- grunt-contrib-concat
 *	- grunt-contrib-copy
 *	- grunt-contrib-watch
 *	- grunt-karma
 *	- jasmine-ajax
 *	- jasmine-core
 *	- jshint-stylish
 *	- karma
 *	- karma-chrome-launcher
 *	- karma-coverage
 *	- karma-firefox-launcher
 *	- karma-html-reporter
 *	- karma-ie-launcher
 *	- karma-jasmine
 *	- karma-phantomjs-launcher
 *	- karma-safari-launcher
 *	- karma-verbose-reporter
 *	- noinfopath-helpers
 *	- phantomjs
 */

/**
 *	## Developers' Remarks
 *
 *	|Who|When|What|
 *	|---|----|----|
 *	|Jeff|2015-08-08T16:38:00Z|Creating a new NoInfoPath module.|
 *	|Jeff|2015-09-15T11:10:00Z|Implemented noKendoGrid with noKendoDataSource, which integrates with the NoInfoPath Data Providers.|
 */

//Establish noInfoPath.kendo namespace.
noInfoPath.kendo = {};

noInfoPath.kendo.normalizedRouteName = function(fromParams, fromState) {
	var normalizedName = fromParams ? fromParams : fromState;

	return normalizedName;
};

(function(angular, undefined) {
	"use strict";

	angular.module("noinfopath.kendo.ui", ['ui.router', "noinfopath.app", "noinfopath.data"])

	;
})(angular);
