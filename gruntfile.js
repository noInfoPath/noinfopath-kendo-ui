module.exports = function(grunt) {
  	var DEBUG = !!grunt.option("debug");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
	    concat: {
		    noinfopath: {
		        src: [
		        	"src/global.js",
					"src/autocomplete.js",
                    "src/datasource.js",
					"src/datepicker.js",
                    "src/grid.js",
					"src/helpers.js",
					"src/lookup.js",
					"src/multiselect.js"
		        ],
		        dest: "dist/noinfopath-kendo-ui.js"
		    },
            readme: {
                src: ["docs/noinfopath-kendo-ui.md"],
		    	dest: "readme.md"
            }
	 	},
        karma: {
            unit: {
                configFile: "karma.conf.js"
            },
            continuous: {
                configFile: "karma.conf.js",
                singleRun: true
            },
            ugly: {
                configFile: "karma.ugly.conf.js",
                singleRun: true,
                browsers: ["Chrome"]
            }
        },
        bumpup: {
        	file: "package.json"
    	},
    	version: {
    		options: {
        		prefix: "@version\\s*"
      		},
    		defaults: {
    			src: ["src/global.js"]
    		}
    	},
        nodocs: {
    		internal: {
    			options: {
    				src: "dist/noinfopath-kendo-ui.js",
    				dest: "docs/noinfopath-kendo-ui.md",
    				start: ["/*","/**"]
    			}
    		},
    		public: {
    			options: {
    				src: "dist/noinfopath-kendo-ui.js",
    				dest: "docs/noinfopath-kendo-ui.md",
    				start: ["/*"]
    			}
    		}
    	},
        watch: {
            files: ["src/*.js", "test/*.spec.js"],
            tasks: ["build"]
        },
        uglify: {
            options: {
              mangle: false
            },
            my_target: {
                files: {
                    "dist/noinfopath-kendo-ui.min.js": ["dist/noinfopath-kendi-ui.js"]
                }
            }
        }
	});

	grunt.loadNpmTasks("grunt-bumpup");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-karma");
	grunt.loadNpmTasks("grunt-nodocs");
	grunt.loadNpmTasks("grunt-version");

	//Default task(s).
	grunt.registerTask("document", ["concat:noinfopath", "nodocs:internal", "concat:readme"]); //Documentation purposes
	grunt.registerTask("build", ["karma:continuous", "concat:noinfopath", "nodocs:internal", "concat:readme"]); //Code testing
	grunt.registerTask("deploy", ["karma:continuous", "bumpup", "version", "concat:noinfopath", "nodocs:internal", "concat:readme"]); //Bumpup to publish to npm
    grunt.registerTask("jenkins", ["karma:continuous"]); //Task for CI
};
