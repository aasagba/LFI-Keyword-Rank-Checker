module.exports = function(config) {
  config.set({
  	basePath : '',
    frameworks: ['jasmine'],
    files: [
    'public/lib/angular/angular.min.js',
	  'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
	  'public/lib/angular-fusioncharts/angular-fusioncharts.min.js',
	  'public/lib/angular-fusioncharts/fusioncharts.js',
	  'public/lib/angular-mocks/angular-mocks.js',
	  'public/lib/angular-sanitize/angular-sanitize.min.js',
	  'public/lib/angular-route/angular-route.min.js',
	  'public/tests/unit/*.js',
	  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css',
	  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap-theme.min.css',
	  'public/*.css',
	  'public/*.html',
	   'public/controllers/controller.js'
    ],
    reporters: ['progress'],
    browsers: ['Firefox'],
    captureTimeout: 60000,
    singleRun: false,
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true
  });
};