

[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)
___

[NoInfoPath Kendo UI (noinfopath-kendo-ui)](home) * @version 2.0.41 *

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___



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

##### _resloveNoRecordsTemplate

This function gets the template for a grid that uses noRecords.
It can be either a template string, or a provider and method.

##### Example
```js
"photos": {
	 "noGrid": {
		"referenceOnParentScopeAs": "reportPhotoGrid",
		 "noRecords": {
			"template": "<div>hello</div>"
		 }
	 },
	 "noDataSource": { }
```
*or*
```js
"photos": {
	 "noGrid": {
		"referenceOnParentScopeAs": "reportPhotoGrid",
		 "noRecords": {
			"templateProvider": "noTemplateGetterJawn",
		"method": "getMyFavoriteTemplate"
		 }
	 },
	 "noDataSource": { }
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

