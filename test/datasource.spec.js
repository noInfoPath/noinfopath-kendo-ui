describe("Testing noinfopath.kendo.ui", function(){
	var $timeout, db, noKendoDataSourceFactory;

	beforeEach(function(){
		module("noinfopath.data");
		module("noinfopath.kendo.ui");
		module("noinfopath.data.mock");

		inject(function($injector){
			//noDbSchema = $injector.get("noDbSchema");
			//noHTTP = $injector.get("noHTTP");
			//db = $injector.get("db");
			$timeout = $injector.get("$timeout");
			noKendoDataSourceFactory = $injector.get("noKendoDataSourceFactory");

			$rootScope = $injector.get("$rootScope");
			// $controller = $injector.get("$controller");
		});
	});

	describe("testing noKendoDataSourceFactory", function(){

		it("should have been injected properly", function(){
			expect(noKendoDataSourceFactory).toBeDefined();
			expect(noKendoDataSourceFactory.create).toBeDefined();
		});

		xit("should create a kendo data source", function(){
			var config = {
					noDataSource: {
						dataProvider: "noIndexedDb",
						databaseName: "Test",
						entityName: "Test"
					}
				},
				kds = noKendoDataSourceFactory.create("a1b5be7e-4696-4bc0-847d-cafdcc52c4ca", config, $rootScope);

			expect(kds).toBeDefined();
			console.log(kds);
		});
	});

});
