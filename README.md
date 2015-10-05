# noinfopath-kendo-ui
@version 0.0.4

## Overview
NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
it with NoInfoPath Data. It is important to note that this module inplements
 implied interfaces that NoInfoPath defines. For the sake if this discussion
 we'll use the generic object oriented notation of "IXyz", where "I" stands
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
|Jeff|2015-09-15T11:10:00Z|Implemented noKendoGrid with noKendoDataSource, which integrates with the NoInfoPath Data Providers.|

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

  #### Schema Model

  When the noKendoDataSource config contains a schema.model
  then loop through looking for fields that have a type and a
  parser property and set the parser propety to one of
  parse functions defined in the parsers collection.

  #### config::filter

  The `filter` property requires special processing because
  it supports dynamic value binding from any injectable
  data source location.  $scope or $stateParams for
  exmaple.

 ```scoped``` passed in from underlying directive as ```params```.

## noKendoGrid (no-kendo-grid) Directive

Creates a Kendo UI Grid, bound to a NoInfoPath data provider, and
injects it into the DOM.

### Attributes

|Name|Descriptions|
|----|------------|
|no-config|The name of the configuration node in noConfig.current. |

```html
<no-kendo-grid no-config="noComponents.cooperators"/>
```
#### Sample noComponent Configuration

```json
  {
      noComponents: {
          "cooperators": {
              dataProvider: "noWebSQL",
              entityName: "vw_Cooperator_Summary",
              noKendoGrid: {},
              noKendoDataSource: {}
          }
      }
  }
```

OR

|Name|Descriptions|
|----|------------|
|noForm|Name of the noForm configuration to retreive from the noFormBuilderService.|
|noComponent|Name of the noForm component to use for configuration data.|

```html
<no-kendo-grid no-form="form1" no-component="grid1" />
```

#### Sample noForm Configuration

```json
  {
      form1: {
          components: {
              "grid1": {
                  dataProvider: "noWebSQL",
                  databaseName: "FCFNv2",
                  entityName: "vw_Cooperator_Summary"
                  kendoGrid: {},
                  kendoDataSource: {}
              }
          }
      }
  }
```

  ##### change() event handler

  Listens on the Kendo UI Grid components change event
  and transitions the user to the ```toState``` specified
  in the noConfig node for this directive.

