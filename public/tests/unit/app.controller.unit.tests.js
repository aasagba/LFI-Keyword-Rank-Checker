"use strict";

describe("AppCtrl", function() {
	var $scope, AppController, httpMock, http;
	$scope = {};
	
	beforeEach(function() {
		module("myApp");
		
		inject(function($rootScope, $controller, $httpBackend, $http) {
			$scope = $rootScope.$new();
			AppController = $controller("AppCtrl", {$scope: $scope});
			httpMock = $httpBackend;
			http = $http;
			
			//httpMock.whenGET('http://localhost:8081/scrape/a3/audi/.co.uk').respond(200,mockScrape);
		});
	});
	
	it("Should be registered", function() {
    	expect(AppController).toBeDefined();
  	});
  	
  	it('expects GET http calls and returns mock data', function() {
  		var mockScrape = [{"title":"Audi A3 - Audi UK","url":"https://www.audi.co.uk/explore-models/explore-by-range/a3.html"
,"match":true,"ranking":1},{"title":"Audi A3 - Audi UK","url":"http://www.audi.co.uk/new-cars/a3.html","match":true,"ranking":2},{"title":"Audi A3 Sportback - Audi UK","url":"http://www.audi.co.uk/new-cars/a3/a3-sportback.html","match":true,"ranking":3}];
		$scope.domain = "audi";
		
		var mockHistory = [{"_id":"5673f402a4884869c06b4ef1","url":"www.audi.co.uk","keywords":[{"keyword":"a3","ranking":[{"date":"18/12/15 11:55:0","rank":3},{"date":"18/12/15 11:55:55","rank":3},{"date":"23/12/15 15:23:22","rank":1},{"date":"23/12/15 16:28:2","rank":1},{"date":"23/12/15 17:45:16","rank":1},{"date":"23/12/15 17:45:26","rank":1},{"date":"23/12/15 17:45:32","rank":1},{"date":"23/12/15 18:0:12","rank":1},{"date":"24/12/15 15:5:33","rank":1},{"date":"24/12/15 16:11:48","rank":1},{"date":"2/2/16 11:37:43","rank":1}]},{"keyword":"a4","ranking":[{"date":"24/12/15 15:49:58","rank":4},{"date":"24/12/15 16:29:40","rank":4},{"date":"3/2/16 16:14:47","rank":1}]},{"keyword":"a5","ranking":[{"date":"24/12/15 15:50:15","rank":4},{"date":"24/12/15 16:12:19","rank":4},{"date":"3/2/16 16:15:1","rank":3}]},{"keyword":"A3","ranking":[{"date":"24/12/15 16:7:10","rank":1}]}]}];
		
		httpMock.expectGET("/scrape/a3/audi/.co.uk").respond(200, mockScrape);
		httpMock.expectGET("/history/a3").respond(200, mockHistory);
  		$scope.search("a3",".co.uk");
  		httpMock.flush();

        console.log($scope.searchresults);
		console.log($scope.history);
		
        expect($scope.searchresults).not.toEqual(undefined);
  		
	});
	
	it('should return average ranking', function() {
		var rankings = {
							"ranking":[
								{"date":"18/12/15 11:55:0","rank":3},{"date":"18/12/15 11:55:55","rank":3},{"date":"23/12/15 15:23:22","rank":1},{"date":"23/12/15 16:28:2","rank":1}
							]
						};
		
		expect($scope.getAverageRank(rankings.ranking)).toEqual(2);
	});
	
});
