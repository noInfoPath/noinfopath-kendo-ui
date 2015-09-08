# noinfopath-kendo-ui
@version 0.0.0

## Overview
NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
it with NoInfoPath Data. It is important to note that this module inplements
 implied interfaces that NoInfoPath defines. For the sake if this discussion
 we'll use the generic object oriented notation of "Ixyz", where "I" stands
 for interface. This particular module will implement the IQueryParser, and
 IQueryBuilder interface.

## Dependencies

- AngularJS
- jQuery
- ngLodash
- noinfopath
- noinfopath.data

## Development Dependencies

> See `package.json` for exact version requirements.

- indexedDB.polyfill
- angular-mocks
- es5-shim
- grunt
- grunt-bumpup
- grunt-version
- grunt-contrib-concat
- grunt-contrib-copy
- grunt-contrib-watch
- grunt-karma
- jasmine-ajax
- jasmine-core
- jshint-stylish
- karma
- karma-chrome-launcher
- karma-coverage
- karma-firefox-launcher
- karma-html-reporter
- karma-ie-launcher
- karma-jasmine
- karma-phantomjs-launcher
- karma-safari-launcher
- karma-verbose-reporter
- noinfopath-helpers
- phantomjs

## Developers' Remarks

|Who|When|What|
|---|----|----|
|Jeff|2015-08-08T16:38:00Z|Creating a new NoInfoPath module.|

## kendoQueryParser :: INoQueryParser

### Overview
For standardization reasons let's call this an Interface that is required
when you have a user interface that provides instructions as how to filter,
sort and page a given table or set of data. This particular implementation
is specific to Kendo UI DataSources, and the Kendo Widgets that interact
with them.

The kendoQueryParser takes the `data` property of the `options`
parameter passed to the Kendo DataSources transport.read method. The
`data` object is inspected and its filter, sort, and paging values are
converted to NoInfoPath compatible versions.

### Methods

#### parse(kendoOptions)
Parses the Kendo options into NoInfoPath compatible objects. Stores
the results internally for future use.

#### toArray()
Returns any filters, sorts or paging data as an array compatible
with a call to `function.prototype.array`.

### Properties

|Name|Type|Description|
|----|----|-----------|
|hasFilters|Boolean|Returns true if filters are available.|
|hasSort|Boolean|Returns true if sorts are available.|
|hasPaging|Boolean|Returns true if paging data is available.|

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

