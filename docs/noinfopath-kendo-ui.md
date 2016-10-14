# Module noinfopath-kendo-ui
@version 1.2.19

## Overview
NoInfoPath Kendo UI is a wrapper around Kendo UI in order to integrate
it with other NoInfoPath modules. It is important to note that this module inplements
 implied interfaces that NoInfoPath defines. For the sake of this discussion
 we will use the generic object oriented notation of "IXyz", where "I" stands
 for interface. This particular module will implement the IQueryParser, and
 IQueryBuilder interface.

## Dependencies

> See `package.json` for exact version requirements.

- @noinfopath/noinfopath
- @noinfopath/noinfopath-data
- @noinfopath/noinfopath-forms
- @noinfopath/noinfopath-logger
- @noinfopath/noinfopath-user
- angular
- angular-ui-router
- jquery
- lodash

## Development Dependencies

> See `package.json` for exact version requirements.

- grunt
- grunt-bumpup
- grunt-contrib-concat
- grunt-contrib-uglify
- grunt-contrib-watch
- grunt-karma
- grunt-nodocs
- grunt-version
- jasmine-ajax
- jasmine-core
- jsdoc
- jshint-stylish
- karma
- karma-chrome-launcher
- karma-coverage
- karma-verbose-reporter

## Developer Remarks

|Who|When|What|
|---|----|----|
|Jeff|2015-08-08T16:38:00Z|Creating a new NoInfoPath module.|
|Jeff|2015-09-15T11:10:00Z|Implemented noKendoGrid with noKendoDataSource, which integrates with the NoInfoPath Data Providers.|
|Adarian|2016-10-13T:10:10:00Z|Started documentation and creating unit tests for module, both the 1.x.x and 2.x.x versions|

## Directive noKendoAutoComplete($compile, noFormConfig, $state, noLoginService, noKendoDataSourceFactory, lodash)

### Overview
`noKendoAutoComplete` is a directive that creates a kendo databound input of type text.

### Parameters

|Name|Type|Description|
|----|----|-----------|
|$compile|Object|Angular.js compile provider object|
|noFormConfig|Object|NoInfoPath noFormConfig object. Located within noinfopath.forms|
|$state|Object|ui-router state provider object|
|noLoginService|Object|NoInfoPath noLoginService object. Located within noinfopath.user|
|noKendoDataSourceFactory|Object|NoInfoPath noKendoDataSourceFactory object. Located within noinfopath.kendo.ui|
|lodash|Object|Lodash provider object|

### Configuration

The noKendoAutoComplete configuration object can have all of the kendo supported configuration configured within the noKendoAutoComplete.options object.
There are some specific configuration values for the noInfoPath noKendoAutoComplete directive, which are detailed below.

|Name|Type|Description|
|----|----|-----------|
|scopeKey|string|The scope key that the directive will store the value of the noKendoAutoComplete|
|noKendoAutoComplete|object|Configuration object specific to the noKendoAutoComplete|
|noKendoAutoComplete.options|object|Configuration for a kendoAutoComplete module|
|noKendoAutoComplete.ngModel|string|The scope key where the noKendoAutoComplete will be databound to|
|noKendoAutoComplete.waitFor|object|Configuration object to have the noKendoAutoComplete wait for a property on the scope and updates the kendo data model with the configured property|
|noKendoAutoComplete.waitFor.property|string|The property on the scope to watch. Watches only for truthy values|
|noKendoAutoComplete.waitFor.pluck|string|Plucks the configured property off the object being watched on the scope. It then sets those values on the scope based on the noKendoAutoComplete.ngModel property and updates the kendo data model with the same values.|
|noDataSource|object|A noInfoPath noDataSource configuration object. See noInfoPath.data documentation|
|noKendoDataSource|object|A noInfoPath configuration to pass into noKendoDataSourceFactory. See noKendoDataSourceFactory documentation|

### Example Configuration

```json
...
"trial" : {
	"scopeKey": "trialList",
	"noKendoAutoComplete": {
		"options": {
			...
		},
		"ngModel": "Trial",
		"waitFor": {
			"property": "trialPlot",
			"pluck": "TrialPlotID"
		}
	},
	"noDataSource" :{
		...
	},
	"noKendoDataSource": {
		...
	}
}
```


### Private Function _compile(el, attrs)

`_compile` is the compile function for the noKendoAutoComplete directive.
It uses `noFormConfig` to get the noForm configuration based on the current
state, and uses the attribute on the element to get the configuration specific
to the noKendoAutoComplete element. It binds the noForm configuration to `_link`
before returning the `_link` function.

This function also appends an input tag of type text to the directive element.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|el|Object|A jQuery object of the directive element. Provided by angular.js|
|attrs|Object|An object of the attributes on the directive element. Provided by angular.js|

#### Returns function specific for angular.js directive code.

### Private Function _link(config, scope, el, attrs)

`_link` is the link function for the noKendoAutoComplete directive.
Utilizing the noForm configuration bound into it from the `_compile` function,
the `_link` function parses out the specific configuration for the noKendoAutoComplete
directive and enables a data driven way to configure the noKendoAutoComplete element.

Since this is a kendo databound element, the configuration is similar to a kendo dataSource object.
However, this directive expands on kendo's kendoAutoComplete module by providing additional functionality.

Configuration can have a waitFor object that looks for a specific property on the scope,
and once it has a truthy value for that property on the scope, it pulls values based on that
configuraiton. After it finds the values, it sets them on the scope and updates the values
within the kendo data model.

This directive also puts the current selected value of the noKendoAutoComplete onto the scope to allow for angular
binding for a multitude of potential purposes, saving with noForms being a reason.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|config|Object|A NoInfoPath noForm configuration object bound in by the `_compile` function|
|scope|Object|A scope object provided by angular.js|
|el|Object|A jQuery object of the noKendoAutoComplete directive element|
|attrs|Object|An object of all the attributes on the noKendoAutoCompelte directive element. Provided by angular.js|

#### Returns Object specific for Angular.js directive code

## Factory noKendoDataSourceFactory($injector, $q, noQueryParser, noTransactionCache, noDynamicFilters, _, $state, noCalculatedFields)

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

### Parameters

|Name|Type|Description|
|----|----|-----------|
|$injector|Object|Angular.js injector provider|
|$q|Object|Angular.js promise provider|
|noQueryParser|Object|NoInfoPath noQueryParser service. Located in the noinfopath.data module|
|noTransactionCache|Object|NoInfoPath noTransactionCache factory. Located in the noinfopath.data module|
|noDynamicFilters|Object|NoInfoPath noDynamicFilters service. Located in the noinfopath.data module|
|lodash|Object|ng-lodash provider|
|$state|Object|angular-ui-router state provider|
|noCalculatedFields|Object|NoInfoPath noCalculatedFields service. Located in the noinfopath.data module|

### Configuration

The configuration passed into the noKendoDataSourceFactory is mostly kendo's configuration properties for their datasource object.
However, there are some NoInfoPath configuration properties which are detailed below.

#### noKendoDataSource Configuration

|Name|Type|Description|
|----|----|-----------|
|schema.model.field.parse|String|A string that parses the data for the kendo datamodel. Current supported types are "date", "utcDate", and "ReverseYesNo"|

#### noDataSource Configuration

|Name|Type|Description|
|----|----|-----------|
|preserveUserFilters|Boolean|A Boolean value that puts the current filter onto the $state so when the user navigates back to this state, the grid loads the previous filter if any|
|preserveUserSort|Boolean|A Boolean value that puts the current sort onto the $state so when the user navigates back to this state, the grid loads the previous sort if any|


  #### Schema Model

  When the noKendoDataSource config contains a schema.model
  noKendoDataSourceFactory loops through looking for fields
 that are an object that has a type and a
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

## Directive noKendoDatePicker(noFormConfig, $state, $timeout)

### Overview
This directive creates a kendo databound inpyt of type date.

### Parameters

|Name|Type|Description|
|----|----|-----------|
|noFormConfig|Object|NoInfoPath noFormConfig object. Located within noinfopath.forms|
|$state|Object|ui-router state provider object|
|$timeout|Object|Angular.js timeout service|

### Configuration

The noKendoDatePicker configuration object can have all the kendo supported configuration configured within the noKendoDatePicker.options object.
Other configuration properties are detailed below.

|Name|Type|Description|
|----|----|-----------|
|binding|String|The type of binding for the noKendoDatePicker. Defaults to "ng". Supported values are "kendo" and "ng"|
|disabled|Boolean|Boolean value to have the date picker have the attribute of disabled|
|required|Boolean|Boolean value to add the attribute of required to the datepicker|
|initValue|Boolean|A boolean value that indicates if the noKendoDatePicker should have a initial value of `new Date()`. Defaults to true|
|options|Object|An object of kendo's date picker configuration properties|
|ngModel|String|The value on the scope to databind the datepicker to|


### Private function _compile(el, attrs)

`_compile` is the compile function for the noKendoDatePicker directive.
It uses `noFormConfig` to get the noForm configuration based on the current
state, and uses the attribute on the element to get the configuration specific
to the noKendoDatePicker element. It binds the noForm configuration to `_link`
before returning the `_link` function.

This function also appends an input tag of type date to the directive element.

This function also handles binding the input if the type of binding is Kendo,
adds the disabled attribute if that configuration is true, and adds the
required attribute if that configuration is true.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|el|Object|A jQuery object of the directive element. Provided by angular.js|
|attrs|Object|An object of the attributes on the directive element. Provided by angular.js|

#### Returns function specific for angular.js directive code.

### Private function _link(noForm, scope, el, attrs)

`_link` is the link function for the noKendoDatePicker directive.
Utilizing the noForm configuration bound into it from the `_compile` function,
the `_link` function parses out the specific configuration for the noKendoDatePicker
directive and enables a data driven way to configure the noKendoDatePicker element.

Since this is a kendo databound element, the configuration is similar to a kendo dataSource object.
However, this directive expands on kendo's kendoDatePicker module by providing additional functionality.

This directive also puts the current selected value of the noKendoDatePicker onto the scope to allow for angular
binding for a multitude of potential purposes, saving with noForms being a reason.

This function handles the initValue configuration property of the directive.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|config|Object|A NoInfoPath noForm configuration object bound in by the `_compile` function|
|scope|Object|A scope object provided by angular.js|
|el|Object|A jQuery object of the noKendoDatePicker directive element|
|attrs|Object|An object of all the attributes on the noKendoDatePicker directive element. Provided by angular.js|

#### Returns Object specific for Angular.js directive code

  #### @property binding

  Angular scope for setting and getting the date
  picker's value.  Otherwise, using kendo model for
  getting and setting data.

## Directive noKendoGrid($injector, $compile, $timeout, noTemplateCache, $state, $q, _, noLoginService, noKendoDataSourceFactory, noDataSource, noKendoHelpers)

### Overview

Creates a Kendo UI Grid, bound to a NoInfoPath data provider, and injects it into the DOM.

> NOTE: Kendo UI Grid is not open source, it is a licensed product from Kendo. In order to use noKendoGrid, you must aquire a license from Kendo (Telerik).

### Parameters

|Name|Type|Description|
|----|----|-----------|
|$injector|Object|Angular.js $injector service|
|$compile|Object|Angular.js $compile service|
|$timeout|Object|Angular.js $timeout service|
|noTemplateCache|Object|NoInfoPath noTemplateCache service. Located in noinfopath.data|
|$state|Object|ui-router state provider object|
|$q|Object|Angular.js promise service|
|lodash|Object|Lodash provider object|
|noLoginService|Object|NoInfoPath noLoginService service. Located in noinfopath.user|
|noKendoDataSourceFactory|Object|NoInfoPath noKendoDataSourceFactory. Located in noinfopath.kendo.ui|
|noDataSource|Object|NoInfoPath noDataSource service. Located in noinfopath.data|
|noKendoHelpers|Object|NoInfoPath noKendoHelpers service. Located in noinfopath.kendo.ui|

### Configuration

Any of the configuration options in the noKendoGrid node are options taken directly
from the Kendo UI Grid documentation.

|Name|Type|Description|
|----|----|-----------|
|noGrid|Object|Object to hold noInfoPath configuration that affects the grid itself|
|noGrid.toState|String|The state to navigate to when a user selects a row on the grid|
|noGrid.primaryKey|String|The primary key of the data stored within the grid|
|noGrid.stateName|String|The state the grid is in|
|noGrid.saveOnStateAs|String|The scope key that a reference to the grid will be saved|
|noDataSource|Object|A noInfoPath noDataSource object. Documentation can be found in noinfopath.data|
|noDataSource.preserveUserFilters|Boolean|Saves the filter object on $state if true, and loads that filter if there is one on $state|
|noDataSource.preserveUserSort|Boolean|Saves the sort object on $state if true, and loads that sort configuration if there is one on $state|
|noKendoGrid|Object|Configuration for a kendo grid. Any kendo supported properties can be configured here. There are a few special configuration properties that NoInfoPath uses to expand on the configuration, enabling additional functionality|
|noKendoDataSource|Object|Configuration for a kendo datasource. Any kendo supported properties can be configured here|

#### Sample HTML

```html
<no-kendo-grid no-form="noForm.noComponents.cooperators"/>
```

#### Sample noComponent Configuration

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

  ##### change() event handler

  Listens on the Kendo UI Grid components change event
  and transitions the user to the ```toState``` specified
  in the noConfig node for this directive.

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

