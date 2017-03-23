module.exports = function(grunt) {

    var DEBUG = !!grunt.option("debug");
    var projectName = "noinfopath-kendo-ui";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            noinfopath: {
                src: [
                    'src/global.js',
                    //'src/query-parser.js',
                    'src/datasource.js',
                    'src/grid.js',
                    'src/datepicker.js',
                    'src/multiselect.js',
                    'src/autocomplete.js',
                    'src/helpers.js',
                    'src/lookup.js'
                ],
                dest: 'dist/noinfopath-kendo-ui.js'
            },
            readme: {
                src: ['docs/home.md'],
                dest: 'readme.md'
            },
            wikiHome: {
                src: ['docs/global.md'],
                dest: 'docs/home.md'
            }
        },
        karma: {
            unit: {
                configFile: "karma.conf.js"
            },
            continuous: {
                configFile: 'karma.conf.js',
                singleRun: true
                /*,
                               browsers: ['PhantomJS']*/
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
                src: ['src/global.js']
            }
        },
        nodocs: {
            "internal": {
                options: {
                    src: 'dist/noinfopath-kendo-ui.js',
                    dest: 'docs/noinfopath-kendo-ui.md',
                    start: ['/*', '/**']
                }
            },
            "public": {
                options: {
                    src: 'dist/noinfopath-kendo-ui.js',
                    dest: 'docs/noinfopath-kendo-ui.md',
                    start: ['/*']
                }
            },
            wiki: {
                options: {
                    src: 'src/*.js',
                    dest: 'docs/<%= pkg.shortName %>.md',
                    start: ['/*', '/**'],
                    multiDocs: {
                        multiFiles: true,
                        dest: "docs/"
                    }
                }
            }
        },
        watch: {
            files: ['src/*.js', 'test/*.spec.js'],
            tasks: ['compile']
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
        },
        copy: {
            test: {
                files: [
                    //{expand:true, flatten:false, src: [ 'lib/js/noinfopath/*.*'], dest: 'build/'},
                    {
                        expand: true,
                        flatten: true,
                        src: ['dist/*.js'],
                        dest: '../noinfopath-test-server-node/no/lib/js/noinfopath/'
                    },
                ]
            },
            wiki: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['docs/*.md', '!docs/global.md'],
                    dest: '../wikis/<%= pkg.shortName %>.wiki/'
                }]
            }
        },
        shell: {
            wiki1: {
                command: [
                    'cd ../wikis/<%= pkg.shortName %>.wiki',
                    'pwd',
                    'git stash',
                    'git pull'
                ].join(' && ')
            },
            wiki2: {
                command: [
                    'cd ../wikis/<%= pkg.shortName %>.wiki',
                    'pwd',
                    'git add .',
                    'git commit -m "Wiki Updated"',
                    'git push'
                ].join(' && ')
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
    grunt.loadNpmTasks('grunt-shell');


    //Default task(s).
    grunt.registerTask('build', ['karma:continuous', 'bumpup', 'version', 'concat:noinfopath', 'nodocs:internal', 'concat:readme']);
    grunt.registerTask('buildy', ['bumpup', 'version', 'concat:noinfopath', 'nodocs:internal', 'concat:readme']);
    grunt.registerTask('jenkins', ['karma:continuous']);

    grunt.registerTask('document', ['concat:noinfopath', 'nodocs:wiki']);
    grunt.registerTask('wikiWack', ['shell:wiki1', 'concat:wikiHome', 'copy:wiki', 'shell:wiki2']);
    grunt.registerTask('updateWiki', ['document', 'wikiWack']);

    grunt.registerTask('notest', ['concat:noinfopath', 'copy:test']);

	grunt.registerTask('compile', ['concat:noinfopath']);
};
