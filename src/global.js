//global.js

/*
 *	# Module noinfopath-kendo-ui
 *	@version 1.2.18
 *
 *	## Overview
 *	NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
 *	it with other NoInfoPath modules. It is important to note that this module inplements
 *  implied interfaces that NoInfoPath defines. For the sake of this discussion
 *  we'll use the generic object oriented notation of "IXyz", where "I" stands
 *  for interface. This particular module will implement the IQueryParser, and
 *  IQueryBuilder interface.
 *
 *	## Dependencies
 *
 *	> See `package.json` for exact version requirements.
 *
 *	- @noinfopath/noinfopath
 *	- @noinfopath/noinfopath-data
 *	- @noinfopath/noinfopath-forms
 *	- @noinfopath/noinfopath-logger
 *	- @noinfopath/noinfopath-user
 *	- angular
 *	- angular-ui-router
 *	- jquery
 *	- lodash
 */

/**
 *	## Development Dependencies
 *
 *	> See `package.json` for exact version requirements.
 *
 *	- grunt
 *	- grunt-bumpup
 *	- grunt-contrib-concat
 *	- grunt-contrib-uglify
 *	- grunt-contrib-watch
 *	- grunt-karma
 *	- grunt-nodocs
 *	- grunt-version
 *	- jasmine-ajax
 *	- jasmine-core
 *	- jsdoc
 *	- jshint-stylish
 *	- karma
 *	- karma-chrome-launcher
 *	- karma-coverage
 *	- karma-verbose-reporter
 */

/**
 *	## Developers' Remarks
 *
 *	|Who|When|What|
 *	|---|----|----|
 *	|Jeff|2015-08-08T16:38:00Z|Creating a new NoInfoPath module.|
 *	|Jeff|2015-09-15T11:10:00Z|Implemented noKendoGrid with noKendoDataSource, which integrates with the NoInfoPath Data Providers.|
 *	|Adarian|2016-10-13T:10:10:00Z|Started documentation and creating unit tests for module, both the 1.x.x and 2.x.x versions|
 */

noInfoPath.kendo = {};

noInfoPath.kendo.normalizedRouteName = function(fromParams, fromState) {
	var normalizedName = fromParams ? fromParams : fromState;

	return normalizedName;
};

(function(angular, undefined) {
	"use strict";

	angular.module("noinfopath.kendo.ui", [
		"ui.router",
		"noinfopath",
		"noinfopath.data",
		"noinfopath.forms",
		"noinfopath.logger",
		"noinfopath.user"
	])

	;
})(angular);
