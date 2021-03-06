describe("Testing noinfopath.kendo.ui", function(){
	var $timeout, db, noKendoDataSourceFactory, kendoQueryParser;

	beforeEach(function(){
		module("ui.router");
		module("noinfopath");
		module("noinfopath.helpers");
		module("noinfopath.app");
		module("noinfopath.data");
		module("noinfopath.ui");
		module("noinfopath.forms");
		module("noinfopath.kendo.ui");
		module("noinfopath.data.mock");

		inject(function($injector){
			//noDbSchema = $injector.get("noDbSchema");
			//noHTTP = $injector.get("noHTTP");
			//db = $injector.get("db");
			$timeout = $injector.get("$timeout");
			noKendoDataSourceFactory = $injector.get("noKendoDataSourceFactory");
			kendoQueryParser = $injector.get("kendoQueryParser");

			// $rootScope = $injector.get("$rootScope");
			// $controller = $injector.get("$controller");
		});
	});

	describe("testing kendoQueryParser", function(){

		it("should exist", function(){
			expect(kendoQueryParser).toBeDefined();
			expect(kendoQueryParser.parse).toBeDefined();
		});

		it("toArray should have returned an array of three objects", function(){

			var arr = kendoQueryParser.parse(mockKendoQueryOptions);

			expect(arr.length).toBe(3);
			expect(arr[0].__type).toBe("NoFilters");
			expect(arr[1].__type).toBe("NoSort");
			expect(arr[2].constructor.name).toBe("NoPage");
		});
	});

});
