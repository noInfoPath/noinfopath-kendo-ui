describe("Testing noinfopath.kendo.ui", function(){
	var $timeout, db, noKendoDataSourceFactory, kendoQueryParser;

	beforeEach(function(){
		module("noinfopath.data.mock");
		module("noinfopath.kendo.ui");
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
			expect(kendoQueryParser.toArray).toBeDefined();
		});

		it("should parse a kendo option object", function(){
			kendoQueryParser.parse(mockKendoQueryOptions);

			expect(kendoQueryParser.hasFilters).toBeTruthy();
			expect(kendoQueryParser.hasSort).toBeTruthy();
			expect(kendoQueryParser.hasPaging).toBeTruthy();
		});

		it("toArray should have returned an array of three objects", function(){
			kendoQueryParser.parse(mockKendoQueryOptions);
			var arr = kendoQueryParser.toArray();

			expect(arr.length).toBe(3);
			expect(arr[0].__type).toBe("NoFilters");
			expect(arr[1].__type).toBe("NoSort");
			expect(arr[2].constructor.name).toBe("NoPage");
		});
	});

});
