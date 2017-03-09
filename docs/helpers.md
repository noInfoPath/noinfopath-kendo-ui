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

