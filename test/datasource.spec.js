describe("Testing noinfopath.kendo.ui", function(){
	var $timeout, db;

	beforeEach(function(){
		module("noinfopath.data.mock");
		inject(function($injector){
			//noDbSchema = $injector.get("noDbSchema");
			//noHTTP = $injector.get("noHTTP");
			db = $injector.get("db");
			$timeout = $injector.get("$timeout");

			// $rootScope = $injector.get("$rootScope");
			// $controller = $injector.get("$controller");
		});
	});

	describe("Quick db mock test", function(){
		it("Verify db mock is ready", function(){
			//var kds = noInfoPath.kendo.createDataSource({}, new noInfoPath.data.NoTable());
			expect(db);
			expect(db.whenReady);

			db.whenReady();

			expect(db.SampleTable);

			expect(db.SampleTable.noCreate);
			expect(db.SampleTable.noRead);
			expect(db.SampleTable.noUpdate);
			expect(db.SampleTable.noDelete);
		});

		it("db mock should be non-blocking", function(done){
			db.whenReady();

			db.SampleTable.noCreate({})
				.finally(done);

			$timeout.flush();
		});
	});

	describe("Testing noInfoPath.kendo.createDataSource", function(){
		it("Should exist on noInfoPath.kendo namespace.", function(){
			expect(noInfoPath.kendo.createDataSource).toBeDefined();
		});

		it("Should require a valid config object passed as first parameter.", function(){
			try{
				noInfoPath.kendo.createDataSource();
			}catch(err){
				expect(err).toBe("createDataSource requires a config object as the first parameter");
			}
		});

		it("Should require a valid NoTable object passed as second parameter.", function(){
			try{
				var kds = noInfoPath.kendo.createDataSource({});
				expect(kds).not.toBeDefined();
			}catch(err){
				expect(err).toBe("createDataSource requires a no noTable object as the second parameter");
			}
		});

		it("Should return a Kendo DataSource", function(){
			db.whenReady();

			var kds = noInfoPath.kendo.createDataSource({}, db.SampleTable);

			expect(kds);

		});
	});




});
