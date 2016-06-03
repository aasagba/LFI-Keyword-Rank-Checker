/*
 *  Example URL: http://localhost:8081/#/data/audi.co.uk
 */

var myApp = angular.module('myApp', ["ng-fusioncharts", "ui.bootstrap", "ngSanitize", "ngRoute"]); 

/** 
 * Routing Setup
 */
myApp.config(["$routeProvider", function($routeProvider) {
   $routeProvider
   .when('/domain/:domain', {
		controller: 'AppCtrl'
	})
   //$locationProvider.html5Mode(true);
}]);

myApp.controller('AppCtrl', ['$scope', '$http', 'RankingFactory', '$routeParams', '$route', '$rootScope', function($scope, $http, RankingFactory, $routeParams, $route, $rootScope) { 
	
	$scope.filteredresults = []
  	,$scope.searchresults = []
  	,$scope.domain = "No Domain Set"
  	,$scope.rank = "not set"
  	,$scope.region = "-"
  	,$scope.regions = {
  		availableOptions: [
  			{value:'.co.uk', label:'United Kingdom'}, 
  			{value:'.de', label:'Germany'}, 
  			{value:'.com.au', label:'Australia'}
  		],
  		selectedOption: {value:'.co.uk', label:'United Kingdom'}
  	}
  	,$scope.log = []
  	,$scope.history = ""
  	,$scope.history.ranking = ""
  	,$scope.regionResponse = []
  	,$scope.response = []
  	,$scope.searchKeyword = ''
  	,$scope.domainObject = []
  	,$scope.allKeywords = [];
  	
  	$scope.$watch( function () { 
	 	return $(document).height();
	}, function onHeightChange(height) {
	 	logIt("Height Change: " + height);
	 	 window.parent.postMessage(
           height // get height of the content
            ,"*" // set target domain
		)
	});
  	
  	$rootScope.$on('$routeChangeSuccess', function () {
  		
        $scope.domain = $routeParams.domain; 
        
        RankingFactory.getProxies()
	        .then(function(response) {
	        	logIt("Got Proxy servers.");
	    		//logIt(JSON.stringify(response));
	        })
	        .catch(function (error) {
	        	console.error(error)
	        });
        
        RankingFactory.getKeywords($scope.domain, $scope.region).then(function(response) {
        	var domain = $scope.domain;
        	var region;
        	var regions;
        	
        	if (response.data.length > 0) {
	        	region = $scope.region;
	        	regions = response.data[0].regions;
	        	console.log("response.data[0].regions " + JSON.stringify(response.data[0].regions));
	        	
	        	r = regions.map(function(el) { 
	    			if (el.region == region) {
	    				console.log("Region in regions.map: "+el.region);
	    				return 1; 
	    			}else {
	    				//console.log("Region in regions.map not found: "+el.region);
	    				return -1; 
	    			}
	    		}).indexOf(1);
	    		
	    		$scope.domainObject = response.data[0];
	       		$scope.regionResponse = regions[r].keywords;
	       		
	       		//console.log("$scope.domainObject " + JSON.stringify($scope.domainObject));
	       		//console.log("$scope.regionResponse " + JSON.stringify($scope.regionResponse));
	       		
	       		// populate all domain keywords array
		    	angular.forEach(regions[r].keywords, function (val, key) {  
		    		$scope.allKeywords.push({"keyword": val.keyword, "rank": val.ranking[val.ranking.length-1].rank});
		    	});
		    } else {
		    	console.log("No Keywords for " + domain);
		    	$scope.domainObject = [];
	       		$scope.regionResponse = [];
		    }
         })
         .catch(function (error) {
         	console.error(error)
         })
   });
  	
  	function logIt(text, params) {
  		//console.log('logIt: ' + text);
  		$scope.log.push(text);
  	}
  	
  	logIt("AppCtrl controller initialised");
  	
	$scope.onDomainChange = function(domain) {
       //alert("select changed " + domain);
        $scope.domain = domain;
    }
    
    $scope.onRegionChange = function(region) {
       //alert("select changed " + region);
        $scope.region = region;
    }
    
    $scope.getAverageRank = function(rankings) {
    	var count = 0;
    	angular.forEach(rankings, function(value, key){
    		count += value.rank;
    	});
    	return (count/rankings.length);
    }
    
    $scope.calculateRankChange = function(lastRank, currentRank) {
    	
    	return lastRank - currentRank;
    }
    
    $scope.sortKeywords = function (keywords) {
    	if (keywords.keyword === $scope.searchKeyword) {
    		return '';
    	}
    	
    	return keywords.keyword;
    }
    
    $scope.remove = function(keyword) {
		logIt(keyword);
		logIt("Domain Object: " + JSON.stringify($scope.domainObject));
		logIt("Domain ID: " + JSON.stringify($scope.domainObject._id));
		var id = $scope.domainObject._id;
		var region = $scope.region;
		logIt("region: " + region);
		var responseObj = [];
		
		$http.delete('/delete/'+ keyword + '/' + region + '/' + id).success(function(response) {
			//refresh();
			logIt(JSON.stringify(response.regions[0].keywords));
			$scope.regionResponse = response.regions[0].keywords;
			$scope.history.ranking = [];
		});

	};
	
	var refresh = function() {
		$http.get('/contactlist').success(function(response){
			logIt("I got the data I requested");
			$scope.contactlist = response;
			$scope.contact = "";
		});
	};
		
	/* search(keyword)
	 * 
	 * Function makes GET request to scrape google for search results by user input keyword.
	 * Function also makes GET request to retrieve ranking history of keyword from database.
	 */		
	$scope.search = function(keyword, region) {
		keyword = angular.lowercase(keyword);
		$scope.searchKeyword = keyword;
		
		logIt("Search keyword is: " + keyword);
		logIt("Making GET Request for ranking data.");
		//alert("Search Region is: " + region);
		$scope.region = region;
				
		var data = { "url": $scope.domain };
		
		var domain = $scope.domain;
		logIt("Search domain is: "+domain);
		
			/*
			 * Get search results
			 */
			RankingFactory.getResults(keyword, domain, region).then(function(response) {
				logIt("Ranking data request successfully retrieved.");
				$scope.searchresults = response.data;
				logIt("Using factory: " + JSON.stringify($scope.searchresults));
				$scope.checkDomain($scope.searchresults);
				

				/*
				 * Update database with new ranking data then get ranking history for domain to update front-end.
				 */
				RankingFactory.updateData($scope.rank, region, keyword, domain).then(function(response) {
					logIt("put response: " + JSON.stringify(response.data));
					
					RankingFactory.getHistory(keyword).then(function(response) {
					
						response = response.data;
						logIt("Response Data in GET History: " + JSON.stringify($scope.response));
						
						$scope.allKeywords = [];
						logIt("Response in get History: " + JSON.stringify(response));
						
						var url = "www." + domain; // Build url
						logIt("Domain in get History: "+ domain);
						
						// get index of response array item that we want histroy info for
						i = response.map(
				    		function(el) { 
				    			if (el.url == url) return 1; else return -1; }
				    	).indexOf(1);
				    	
				    	logIt("i: " + i);
				    	
				    	
				    	// if domain exists
				    	if(i != -1) {
							logIt("Object to process: " + JSON.stringify(response[i]));
							
							// Find index of region
					    	r = response[i].regions.map(function(el) { 
					    			if (el.region == region) {
					    				logIt("Region in regions.map: "+el.region);
					    				return 1; 
					    			}else {
					    				logIt("Region in regions.map not found: "+el.region);
					    				return -1; 
					    			}
					    		}).indexOf(1);
					    	
					    	$scope.domainObject = response[i];

					    	// if REGION
					    	if (r != -1) {
					    			
					    			$scope.regionResponse = response[i].regions[r].keywords;
									logIt("regionResponse: " + JSON.stringify($scope.regionResponse));
					    			
									// find index of keyword
									j = response[i].regions[r].keywords.map(
							    		function(el) { 
							    			if (el.keyword == keyword) return 1; else return -1; }
							    	).indexOf(1);
							    	
							    	logIt("J is: " + j);
							    	
							    	// populate all domain keywords array
							    	angular.forEach(response[i].regions[r].keywords, function (val, key) {  
							    		$scope.allKeywords.push({"keyword": val.keyword, "rank": val.ranking[val.ranking.length-1].rank});
							    	});
							    	
							    	// if keyword exists get data and set on scope.history object
							    	if (j != -1) {
							    		// get current keyword
							    		var value = response[i].regions[r].keywords[j];
										var length = value.ranking.lenth;
										var currank = value.ranking[value.ranking.length-1];
										var lastRank = value.ranking[value.ranking.length-2];
										
										/* How can I check to see if keyword is new and then reverse array if so
										 * if ()
										 * response[i].regions[r].keywords.reverse()
										 */ 
										
										// set keyword history data
										$scope.history = value;
							    		
										logIt("	Processing history for search keyword " + value.keyword);
										logIt("	Got previous ranking history: " + $scope.history + ", for keyword: " + value.keyword);
										logIt("	Rank: " + currank);
										return;
											
									} else {
										logIt("No previous keywords found after loop");
										$scope.allKeywords = [];
										$scope.rank = 'not set';
										$scope.history = {"keywords":[{"keyword":"","ranking":[{"date":"","rank":""}]}]};
										return;
									}
							} else {
								logIt("Region does not exist");
								logIt("This is a new region");
								$scope.regionResponse = [];
								$scope.history = {"keywords":[{"keyword":"","ranking":[{"date":"","rank":""}]}]};
								return;
							}
						} else {
							logIt("This is a new domain");
							//$scope.allKeywords.push({"keyword": "", "rank": ""});
							$scope.history = {"keywords":[{"keyword":"","ranking":[{"date":"","rank":""}]}]};
							return;
						}
						$scope.updateGraphData();
					}
				)
					
			})
		})
		.catch(function (error) {
	        	console.error(error)
	    });
	};
	

	
	/* checkDomain(results)
	 * 
	 * Function to check if domain is placed within the response 
	 * and to ascertain the ranking.
	 */
	$scope.checkDomain = function(results) {
		
		var match = false;
		//var query = "www." + $scope.domain + $scope.region;
		var query = "www." + $scope.domain;
		logIt("check domain query string: " + query);
		
		angular.forEach(results, function (value, key) {
			
			if (!match) {
				if (value.url.search(query) != -1) {
					
					logIt("Found match: " + value.url);
					$scope.rank = value.ranking;
				}
					
				if (value.match) {
					match = true;
				}
			}
		});
		
		if (!match) {
			$scope.rank = 0;
		}
	};
	
	$scope.initialiseGraphData = function() {
		
		$scope.myDataSource = {
	        chart: {
	            caption: "",
	            subCaption: "",
	            numberPrefix: "",
	            xAxisName: "Date",
	            yAxisName: "Rank",
	            "bgcolor": "FFFFFF",
	            "showalternatehgridcolor": "0",
    			"divlinecolor": "CCCCCC",
    			"showcanvasborder": "0",
			    "canvasborderalpha": "0",
			    "canvasbordercolor": "CCCCCC",
			    "canvasborderthickness": "1",
			    "captionpadding": "30",
			    "linethickness": "3",
			    "yaxisvaluespadding": "15",
			    "legendshadow": "0",
			    "legendborderalpha": "0",
			    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
			    "showborder": "0"			    
	        },
	        data: [{
                    label: "",
                    value: "0"
                },
                {
                    label: "",
                    value: "0"
                },
                {
                    label: "",
                    value: "0"
                },
                {
                    label: "",
                    value: "0"
                },
                {
                    label: "",
                    value: "0"
                }]
	    };
  	};
  	
  	/* initialise graph with default values on page load*/
  	$scope.initialiseGraphData();	
  	
  	$scope.updateGraphData = function() {
  		var items = [];
  		logIt("history ranking: " + JSON.stringify($scope.history.ranking));
  		
  		if ($scope.history.ranking){ 
  			logIt("Found History");
  			
  			angular.forEach($scope.history.ranking, function(value, key){
				items.push({label: value.date, value: value.rank});
			});
	  		$scope.myDataSource.data = items;
	  		logIt("Data source for rankings graph has been updated!");
		  	
  		} else {
  			logIt("No History");
  			$scope.history.ranking = [];
  			
  		}	
  	};
  	
   /* Watch page rank variable so when it is set the ranking graph is updated with
    * ranking history.
    */
   $scope.$watch(function(scope) { return scope.history.ranking }, function() {
    	logIt("Rank Changed");
    	logIt("Scope history length is: " + $scope.history.ranking);
    	if ($scope.rank != 'not set' && $scope.history.ranking != "" && $scope.history.ranking != undefined) {
    		var items = [];
			angular.forEach($scope.history.ranking, function(value, key){
				items.push({label: value.date, value: value.rank});
			});
	  		$scope.myDataSource.data = items;
	  		logIt("Data source for rankings graph has been updated!");     
  		} else {
  			logIt("No rank data to update graph!");
  			$scope.initialiseGraphData();	
  		}
   });		
}]);

/*
 * Factory service for Ranking 
 */
myApp.factory('RankingFactory', function($http) {
	
	return {
		getKeywords: function(domain, region) {
			var url = '/keywords/' + domain + '/' + region;
			return $http.get(url).success(function(response) {
				return response;
			})
			.error(function(response, status) {
				console.log("getKeywords request failed with response " + response + " and status code " + status);
			});
		},
		
		getResults: function(keyword, domain, region) {
			var url = '/scrape/' + keyword + '/' + domain + '/' + region;
			return $http.get(url).success(function(response) {
				return response;
			})
			.error(function(response, status) {
				console.log("getResults request failed with response " + response + " and status code " + status);
			});
		},
		
		getHistory: function(keyword) {
			var url = '/history/' + keyword;
			return $http.get(url).success(function(response) {
				return response;
			})
			.error(function(response, status) {
				console.log("getHistory request failed with response " + response + " and status code " + status);
			});
		},
		
		getProxies: function() {
			var url = '/proxies';
			return $http.get(url).success(function(response) {
				return response;
			})
			.error(function(response, status) {
				console.log("getProxies request failed with response " + response + " and status code " + status);
			});
		},		
		
		updateData: function(rank, region, keyword, domain) {
			
			var currentDate = new  Date(), mday = currentDate.getDate(), wday = currentDate.getDate(), hours = currentDate.getHours(), minutes = currentDate.getMinutes(), month = currentDate.getMonth() + 1,
			seconds = currentDate.getSeconds(), year = currentDate.getYear()-100;
			var currentDateTime = mday+"/"+month+"/"+year;
			//console.log("current date time: " + currentDateTime);
			var currentRank = rank;
			var url = '/scrape/' + region;
			// Build ranking object to push to db
			var rankData = { 
					"url": domain,
					"keyword": angular.lowercase(keyword), 
					"ranking": [
			 		{ 	
			 			"date": currentDateTime, 
			 			"rank": currentRank
			 		}
		 		]
			};
			
			return $http.put(url, rankData).success(function(response) {
				return response;
			})
			.error(function(response, status) {
				console.log("updateData request failed with response " + response + " and status code " + status);
			});
		}
	}
	
});
