

var optionsProto = {

},
mockTable = {
	"LU_Flavor": {
        "columns": {
            "Description": {
                "nullable": "true",
                "type": "varchar",
                "length": 50
            },
            "FlavorID": {
                "nullable": "false",
                "type": "uniqueidentifier",
                "length": 0
            },
            "Value": {
                "nullable": "true",
                "type": "int",
                "length": 0
            }
        },
        "foreignKeys": {},
        "primaryKey": "FlavorID"
    }
},
mockKendoQueryOptions = {
	"take":10,
	"skip":0,
	"page":1,
	"pageSize":10,
	"filter": {
		"logic":"and",
		"filters": [
				{ field: "name", operator: "startswith", value: "Jane" }
		]
	},
	"sort" : [
		{field: "name", dir: "desc"}
	]
};
