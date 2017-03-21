
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

