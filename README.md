# noinfopath-kendo-ui
@version 2.0.7

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

> NOTE: Kendo UI Grid is not open source, it is a licensed product from Kendo. In order to use noKendoGrid, you must aquire a license from Kendo (Telerik).

### Attributes

|Name|Descriptions|
|----|------------|
|no-form|The name of the configuration node in no-form.js. |

```html
<no-kendo-grid no-form="noForm.noComponents.cooperators"/>
```
#### Sample noComponent Configuration

Any of the configuration options in the noKendoGrid node are options taken directly
from the Kendo UI Grid documentations.

```json
 {
	 "noGrid": {
		 "referenceOnParentScopeAs": "docGrid"
	 },
	 "noDataSource": {
	 	...
	 },
	 "noKendoGrid": {
		 "sortable": true,
		 "pageable": {
			 "previousNext": false,
			 "numeric": false,
			 "pageSize": 50,
			 "refresh": true
		 },
		 "scrollable": {
			 "virtual": true
		 },
		 "columns": [{
			 "title": "Name",
			 "field": "FileID.name"
		 }, {
			 "title": "Description",
			 "field": "description"
		 }]
	 },
	 "noKendoDataSource": {
	 	...
	 }
 }

```

#### kendoGrid.selectable property.

When the selectable property is an object then apply configuration provided in the object.

When the actions property is provided then execute the actions using noActionQueue.

*Example*

```json
{
	"selectable":
	{
		"actions": []
	}
}
```

> NOTE: When the KendoGrid calls noInfoPath `change` event handler it calls `noAction.createQueue` with the actual KendoGrid object in place of the noKendoGrid directive element.
> This is important to know because when the `passElement` action property is true it will be passing a fully instanciated grid object, not and HTML element.

 Otherwise, use the provider/method/params configuration.

 When the selectable property is a string (assumed), then we
  listen on the Kendo UI Grid components change event
  and transitions the user to the `toState` specified
  in the noConfig node for this directive.


> NOTE: Currently only row selection is supported.

  `noFormOptionsKey` is required because it identifies where to get he configuration from
  to configure the noComponent when the time comes.

#### noDataSource::waitFor property

A noDataSource object can ```waitFor``` a property on the scope to be
Truthy before continuing with the grid's configuration proccess.

  ##### kendoGrid.editable

  When this property is truthy and an object, noKendoGrid Directive
  will look for the template property. When found, it will be
  expected to be a string that is the url to the editor template.
  When this occurs the directive must wait for the template
  before continuing with the grid initialization process.


#### Filter and Sort Options  Persistence

A stateChangeStart event is captured on each state change. We will then check to make
sure that the fromState name is the same as the one in the no-forms.json. We then
grab the name of the state, make a new object on the scope and persist any filter or
sort data in this object.

#### noGrid refresh to make sure grids are initliazed.

This fix was intended to remedy the scrollable issue when grids were located in
"hidden" elements, such as inactive tabs.

#### Nested grids

The `nestedGrid` grid property can be an object or a string. When it is
a string it is the key to the `noComponent` child node with a `noForm`
configuration.

When it is an object is because a filter needs to be defined on the grid.
The `noForm` property contains the `noComponent` key, and filterProperty
contains the name of the parent Kendo Grid column from which to get the filter
value for the child grid.

  #### @property binding

  Angular scope for setting and getting the date
  picker's value.  Otherwise, using kendo model for
  getting and setting data.


## NoKendoHelpersService

> @service noKendoHelpers

This services provide various helper functions that provide access
details about the a given row of data in a grid, as well as, access to
grid's currently selected row.

> NOTE: A future enhancements will be that it allows for multi-row selection,
> and cell slections.

### @method getConfigMethod

This is a specialty function that helps NoInfoPath wrapped widgets
determine where to read thier configuration data from.

> NOTE: This function may be either deprecated to relocated to
> NoInfoPath Helpers module in the future.

### @method resolveConfigType

This is a specialty function that is typically used in conjection with
`getConfigMethod`. It helps NoInfoPath wrapped widgets
resolve what type of configuration data a directive is using..

> NOTE: This function may be either deprecated to relocated to
> NoInfoPath Helpers module in the future.

### @method getGridRow

This method, given a `jQuery` element, returns the closest parent
that matches the `tr[data-uid]` selector, as a jQuery element.

This method is especially useful when used in conjection with
NoInfoPath's noActionQueue service to resolve action parameters
for Kendo Grid methods that require a row element as one of its
parameters. It is usually expected that the action be attached to
button that is child of a given row.


### @method getGridRowUID

This method, given a `jQuery` element, returns the data-uid of the
supplied element's parent row that matches the `tr[data-uid]` selector.

This method is especially useful when used in conjection with
NoInfoPath's noActionQueue service to resolve action parameters
for Kendo Grid methods that require a row data-uid as one of its
parameters. It is usually expected that the action be attached to
button that is child of a given row.


### @method getSelectedGridRow

### @method getSelectedGridRow

### @method getSelectedGridRowData

### @method currentGridRowData

### @method currentGridRow

### @method ngCompileSelectedRow

