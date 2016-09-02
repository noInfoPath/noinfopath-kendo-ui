// Karma configuration
// Generated on Wed Dec 31 2014 11:18:56 GMT-0500 (Eastern Standard Time)

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],


		// list of files / patterns to load in the browser
		files: [
			'bower_components/jquery/dist/jquery.js',
			'node_modules/angular/angular.js',
			'node_modules/angular-sanitize/angular-sanitize.js',
			'node_modules/angular-mocks/angular-mocks.js',
			'node_modules/angular-ui-router/release/angular-ui-router.js',
			'bower_components/ng-lodash/build/ng-lodash.js',
			'lib/js/kendo/kendo.all.min.js',
			'node_modules/noinfopath/dist/noinfopath.js',
			'node_modules/noinfopath-helpers/src/noinfopath-helpers.js',
			'node_modules/@noinfopath/noinfopath-logger/dist/noinfopath-logger.js',
			'node_modules/@noinfopath/noinfopath-data/dist/noinfopath-dexie.js',
			'node_modules/@noinfopath/noinfopath-user/dist/noinfopath-user.js',
			'node_modules/@noinfopath/noinfopath-data/dist/noinfopath-data.js',
			'node_modules/@noinfopath/noinfopath-app/dist/noinfopath-app.js',
			'src/global.js',
			'src/datasource.js',
			'src/grid.js',
			'src/query-parser.js',
			'test/mock/*.mock.js',
			'test/datasource.spec.js',
			'test/query-parser.spec.js'

    ],


		// list of files to exclude
		exclude: [
    ],


		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'src/*.js': 'coverage'
		},

		coverageReporter: {
			type: 'cobertura',
			dir: 'coverage/'
		},


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['verbose', 'coverage'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['Chrome'],


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false
	});
};
