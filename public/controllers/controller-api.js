Controller.js

var myApp = angular.module('myApp', ["ng-fusioncharts", "ui.bootstrap", "ngSanitize", "ngRoute"]);
var domainTest = '';
  // Routing Setup
  myApp.config(function($routeProvider,$locationProvider) {
            $routeProvider
                .when('/data/:domain/:region', {


                    controller: 'AppCtrl'
                })
               //$locationProvider.html5Mode(true);

        });

//$http.get('/data/' + domain).success(function(response) {
  // $scope.domain = domain;
  //});

myApp.controller('AppCtrl', ['$scope', '$http', 'myService', '$routeParams', '$route', '$rootScope', function($scope, $http, myService, $routeParams, $route, $rootScope) {


$rootScope.$on('$routeChangeSuccess', function () {
            console.log("Route param: " + $routeParams.domain);
            console.log("Route param2: " + $routeParams.region);
            domainTest = $routeParams.domain;
            console.log('domainTest set: ' + domainTest);



console.log("AppCtrl controller initialised");
console.log("Domain is: " + domainTest);
$scope.filteredresults = []
  ,$scope.currentPage = 1
  ,$scope.numPerPage = 10
  ,$scope.maxSize = 10
  ,$scope.searchresults = []
  ,$scope.domain = $routeParams.domain
  ,$scope.rank = "not set"
  ,$scope.region = $routeParams.region
  ,$scope.domains = [{value:'audi', label:'audi'}, {value:'littleforest', label:'littleforest'}]
  //,$scope.regions = [{value:'.co.uk', label:'UK'}, {value:'.de', label:'DE'}];
  ,$scope.regions = [{value:'.co.uk', label:$scope.region}];


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




var regionMap = new Object();
regionMap["uk"] = ".co.uk";
regionMap["de"] = ".de";


function getRegion(r) {
return regionMap[r];

}





/* search(keyword)
*
* Function makes GET request to scrape google for search results by user input keyword.
* Function also makes GET request to retrieve ranking history of keyword from database.
*/


$scope.search = function(keyword, region) {
keyword = angular.lowercase(keyword);





console.log("Search keyword is: " + keyword);

console.log("Search region is: " + region);

console.log("Making GET Request for ranking data.");





//alert("Search Region is: " + region);

region = getRegion(region);

$scope.region = region;













var data = { "url": $scope.domain };





var domain = $scope.domain;

console.log("Search domain is: "+domain);





$http.get('/scrape/' + keyword + '/' + domain + '/' + region).success(function(response) {

console.log("Ranking data request successfully retrieved.");


$scope.searchresults = response;


$scope.checkDomain($scope.searchresults);


$scope.updateGraphDate();


});





$http.get('/history/' + keyword).success(function(response) {

$scope.history = "";


$scope.datatest = "";


$scope.datatest = response;


$scope.allKeywords = [];


console.log("Response in get History: " + JSON.stringify(response));








var url = "www." + domain + "" + $scope.region; // Build url


console.log("Domain in get History: "+ domain);








// get index of response array item that we want histroy info for


i = response.map(


    function(el) {
    if (el.url == url) return 1; else return -1; }
    ).indexOf(1);




console.log("Object to process: " + JSON.stringify(response[i]));








// loop keywords


angular.forEach(response[i].keywords, function (value, key) {


console.log("Keyword in keywords array: "+value.keyword);











var length = value.ranking.lenth;



var lastRank = value.ranking[value.ranking.length-1];











$scope.allKeywords.push({"keyword": value.keyword, "rank": value.ranking[value.ranking.length-1].rank});



console.log("Rank: " + value.ranking[value.ranking.length-1].rank);











// set keyword history data



if (value.keyword.search(keyword) != -1 && value.keyword === keyword) {



$scope.history = value;




console.log(" Processing history for search keyword " + value.keyword);




console.log(" Got previous ranking history: " + $scope.history + ", for keyword: " + value.keyword);




console.log(" Rank: " + value.ranking[value.ranking.length-1].rank);




return;




}



});








//share data with other controllers


myService.set($scope.history);


});





};


/* update()
*
* Function makes PUT request to push new ranking data to database.
*/
$scope.update = function() {
console.log("in controller update id: " + $scope.datatest[0]._id);





var currentDate = new  Date(), mday = currentDate.getDate(), wday = currentDate.getDate(), hours = currentDate.getHours(), minutes = currentDate.getMinutes(), month = currentDate.getMonth() + 1,

seconds = currentDate.getSeconds(), year = currentDate.getYear()-100;

var currentDateTime = mday+"/"+month+"/"+year+" "+hours+":"+minutes+":"+seconds;





console.log("current date time: " + currentDateTime);





var currentRank = $scope.rank;





// Build ranking object to push to db

var rankData = {

"url": $scope.domain,



"keyword": angular.lowercase($scope.search.keyword),



"ranking": [



{





"date": currentDateTime,





"rank": $scope.rank





}




]



};





$http.put('/scrape/' + $scope.datatest[0]._id + '/' + $scope.region, rankData).success(function(response) {

console.log("put response: "+response);


$scope.search(angular.lowercase($scope.search.keyword),$scope.region);


});

};


/* checkDomain(results)
*
* Function to check if domain is placed within the response
* and to ascertain the ranking.
*/
$scope.checkDomain = function(results) {




var match = false;

var query = "www." + $scope.domain + $scope.region;

console.log("check domain query string: " + query);





angular.forEach(results, function (value, key) {







if (!match) {


if (value.url.search(query) != -1) {













console.log("Found match: " + value.url);




$scope.rank = value.ranking;




}













if (value.match) {



match = true;




}



}


});





if (!match) {

$scope.rank = "-";


}

};


$scope.initialiseGraphData = function() {




$scope.myDataSource = {

        chart: {
            caption: "Rankings",
            subCaption: "Rankings by date",
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


  $scope.updateGraphDate = function() {
  var items = [];
angular.forEach($scope.history.ranking, function(value, key){

items.push({label: value.date, value: value.rank});


});

  $scope.myDataSource.data = items;
  console.log("Data source for rankings graph has been updated!");
  };


   /* Watch page rank variable so when it is set the ranking graph is updated with
    * ranking history.
    */
   $scope.$watch(function(scope) { return scope.rank }, function() {
       //alert('hey, rank has changed:' + $scope.rank);


    var items = [];
    if ($scope.rank != 'not set') {
angular.forEach($scope.history.ranking, function(value, key){


items.push({label: value.date, value: value.rank});



});


  $scope.myDataSource.data = items;
  console.log("Data source for rankings graph has been updated!");
  }
   });


    });
}]);

myApp.controller('GraphCtrl', ['$scope', '$http', 'myService', function($scope, $http, myService) {
console.log("GraphCtrl controller initialised");
$scope.graphHistory = myService.get();
console.log("$scope.graphHistory: " + JSON.stringify($scope.graphHistory));
}]);

/* Factory service to share data between services */
myApp.factory('myService', function() {
var savedData = {}





function set(data) {

  savedData = data;
}

function get() {

  return savedData;
}



return {

  set: set,
  get: get
}


});

index.html

<!DOCTYPE>
<html ng-app="myApp">
<head>
<title>Keyword Rank Checker</title>

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap-theme.min.css">

<link rel="stylesheet" href="styles.css">

</head>
<body>
<div>

<div class="container" ng-controller="AppCtrl">

<div class="top-container" id="grad">



<h1 style="margin-bottom:35px;">Keyword Rank Checker</h1>



<div class="search-controls" style="">



<input class="form-control" ng-model="search.keyword"/>




<button ng-if="search.keyword" style="display: inline" class="btn btn-primary" ng-click="search(search.keyword.toLowerCase(), region);">Search</button>




<button ng-if="search.keyword" style="display: inline" class="btn btn-info" ng-click="update()">Update Rankings</button>




</div>



<div class="keyword-info">



<div class="info">




<span style="font-size:40px;color:#805300">{{search.keyword}}</span><br/>





<b style="font-size:12px">Keyword</b><br />





</div>




<div class="info">




<span style="font-size:40px;color:#805300">{{domain}}</span><br/>





<b style="font-size:12px">Domain</b><br />





</div>




<div class="info">




<span style="font-size:40px;color:#805300">{{searchresults.length}}</span><br/>





<b style="font-size:12px">Total Results</b><br />





</div>




<div class="info">




<span style="font-size:40px;color:#805300">{{rank}}</span><br/>





<b style="font-size:12px">Page Rank</b><br />





</div>




<div class="info">




<span style="font-size:40px;color:#805300">{{region}}</span><br/>





<b style="font-size:12px">Region</b><br />





</div>




<div class="dropdowns">




<select required="" ng-model="domainList" ng-options="domain as domain.label for domain in domains" ng-change="onDomainChange(domainList.label)">





<option style="display:none" value="">Domain</option>






</select>






<select required="" ng-model="regionList" ng-options="region as region.label for region in regions" ng-change="onRegionChange(regionList.label)">





<option style="display:none" value="">Region</option>






</select>






</div>




</div>



<form action="">



  <input ng-model="region" type="hidden">













</input>




</form>



<div ng-if="history.ranking" ng-init="count=0" class="rank-history">



<p><b>previous rankings ({{history.ranking.length}}):</b></p>




<div ng-repeat="keyword in history.ranking">




<span ng-init="$parent.count = count + keyword.rank"></span>





{{keyword.rank}} - {{keyword.date | filter: date}}





</div>




<!--<b ng-if="history.ranking">Average Ranking: {{count/history.ranking.length  | number:2 }}</b>-->




<b>Average Ranking: {{ getAverageRank(history.ranking) | number:2 }}</b>




</div>




<div ng-if="history.ranking" class="keywords">



<p><b>Keywords ({{allKeywords.length}}):</b></p>




{{lastRank=history.ranking[history.ranking.length-2].rank;""}}




{{curRank=history.ranking[history.ranking.length-1].rank;""}}




<div ng-repeat="keyword in allKeywords">




<span ng-if="keyword.keyword === search.keyword" ng-class="{'arrow-up' : lastRank > curRank}"></span><a href="graph.html">{{keyword.keyword}} - {{keyword.rank}}</a>






</div>




</div>



</div>



<div class="rankings-graph-container">


<div fusioncharts width="600" height="450" type="line" datasource="{{myDataSource}}"></div>



<div class="results-container">



<div ng-class="{'match': result.match}" class="result" ng-repeat="result in searchresults">




<div class="rank">{{result.ranking}}. </div>





<div class="result-details">





<h3 class="title" ng-bind-html="result.title" ng-class="{'match': result.match}"></h3>






<a class="url" href="{{result.url}}">{{result.url}}</a>






</div>





</div>




</div>



</div>


</div>

</div>

<script src="http://static.fusioncharts.com/code/latest/fusioncharts.js?cacheBust=56"></script>

<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js"></script>

<script data-require="ui-bootstrap@*" data-semver="0.12.1" src="http://angular-ui.github.io/bootstrap/ui-bootstrap-tpls-0.12.1.min.js"></script>

<script src="controllers/controller.js"></script>

<script type="text/javascript" src="http://fusioncharts.github.io/angular-fusioncharts/demos/js/angular-fusioncharts.min.js"></script>

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0-rc.0/angular-sanitize.js"></script>

<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular-route.min.js"></script>

</body>
</html>