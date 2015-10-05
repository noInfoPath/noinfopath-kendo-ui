describe("Testing noinfopath.kendo.ui", function(){
	var $timeout, db, noKendoDataSourceFactory;

	beforeEach(function(){
		module("noinfopath.data");
		module("noinfopath.kendo.ui");
		inject(function($injector){
			//noDbSchema = $injector.get("noDbSchema");
			//noHTTP = $injector.get("noHTTP");
			//db = $injector.get("db");
			$timeout = $injector.get("$timeout");
			noKendoDataSourceFactory = $injector.get("noKendoDataSourceFactory");

			// $rootScope = $injector.get("$rootScope");
			// $controller = $injector.get("$controller");
		});
	});

	describe("testing noKendoDataSourceFactory", function(){

		it("should have been injected properly", function(){
			expect(noKendoDataSourceFactory).toBeDefined();
			expect(noKendoDataSourceFactory.create).toBeDefined();
		});

		it("should create a kendo data source", function(){
			var noTable = new NoTable(mockTable.LU_Flavor, "LU_Flavor", {}),
				kds = noKendoDataSourceFactory.create({}, noTable);

			expect(kds).toBeDefined();
			console.log(kds);
		});
	});

});
