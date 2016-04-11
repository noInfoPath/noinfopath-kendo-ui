# noinfopath-kendo-ui
@version 1.2.2

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
  example.

  Filters now supports filterLogic. A sibling to filter in the
  datasource configuration, it allows the user to specify
  if the filters that are configured within the no-forms.json
  should be evaluated as an 'and' or an 'or'. The 'and' logic
  is the default is no filterLogic is defined.

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

  ##### kendoGrid.editable

  When this property is truthy and an object, noKendoGrid Directive
  will look for the template property. When found, it will be
  expected to be a string that is the url to the editor template.
  When this occurs the directive must wait for the template
  before continuing with the grid initialization process.


  ##### change() event handler

  Listens on the Kendo UI Grid components change event
  and transitions the user to the ```toState``` specified
  in the noConfig node for this directive.

  `noFormOptionsKey` is required because it identifies where to get he configuration from
  to configure the noComponent when the time comes.

	#### Nested grids

The `nestedGrid` grid property can be an object or a string. When it is
a string it is the key to the `noComponent` child node with a `noForm`
configuration.

When it is an object is because a filter needs to be defined on the grid.
The `noForm` property contains the `noComponent` key, and filterProperty
contains the name of the parent Kendo Grid column from which to get the filter
value for the child grid.

#### Filter and Sort Options  Persistence

A stateChangeStart event is captured on each state change. We will then check to make
sure that the fromState name is the same as the one in the no-forms.json. We then
grab the name of the state, make a new object on the scope and persist any filter or
sort data in this object.

#### noGrid refresh to make sure grids are initliazed.

This fix was intended to remedy the scrollable issue when grids were located in
"hidden" elements, such as inactive tabs.

#### noDataSource::waitFor property

A noDataSource object can ```waitFor``` a property on the scope to be
Truthy before continuing with the grid's configuration proccess.

  #### @property binding

  Angular scope for setting and getting the date
  picker's value.  Otherwise, using kendo model for
  getting and setting data.


