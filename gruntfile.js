module.exports = function(grunt) {

  	var DEBUG = !!grunt.option("debug");

  	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	    concat: {
		    noinfopath: {
		        src: [
		        	'src/global.js',
                    'src/query-parser.js',
                    'src/datasource.js',
                    'src/grid.js'
		        ],
		        dest: 'dist/noinfopath-kendo-ui.js'
		    },
            readme: {
                src: ['docs/noinfopath-kendo-ui.md'],
		    	dest: 'readme.md'
            }
	 	},
        karma: {
            unit: {
                configFile: "karma.conf.js"
            },
            continuous: {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            },
            ugly: {
                configFile: 'karma.ugly.conf.js',
                singleRun: true,
                browsers: ['Chrome']
            }
        },
        bumpup: {
        	file: 'package.json'
    	},
    	version: {
    		options: {
        		prefix: '@version\\s*'
      		},
    		defaults: {
    			src: ['src/globals.js']
    		}
    	},
        nodocs: {
    		"internal": {
    			options: {
    				src: 'dist/noinfopath-kendo-ui.js',
    				dest: 'docs/noinfopath-kendo-ui.md',
    				start: ['/*','/**']
    			}
    		},
    		"public": {
    			options: {
    				src: 'dist/noinfopath-kendo-ui.js',
    				dest: 'docs/noinfopath-kendo-ui.md',
    				start: ['/*']
    			}
    		}
    	},
        watch: {
            files: ['src/*.js', 'test/*.spec.js'],
            tasks: ['document']
        },
        uglify: {
            options: {
              mangle: false
            },
            my_target: {
                files: {
                    'dist/noinfopath-kendo-ui.min.js': ['dist/noinfopath-kendi-ui.js']
                }
            }
        }

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-bumpup');
	grunt.loadNpmTasks('grunt-version');
    grunt.loadNpmTasks('grunt-nodocs');

	//Default task(s).
	grunt.registerTask('build', ['karma:continuous', 'bumpup','version','concat:noinfopath']);
    grunt.registerTask('jenkins', ['karma:continuous']);
    grunt.registerTask('document', ['concat:noinfopath', 'nodocs:internal', 'concat:readme']);
};
