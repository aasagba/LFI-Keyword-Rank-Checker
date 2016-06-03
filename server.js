// modules =================================================

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var config = require('app-config');
var dbUser = config.db.user;
var dbPass = config.db.password;
var dbHostname = config.db.hostname;
var dbPort = config.db.port;
var dbName = config.db.dbname;
var databaseUrl = "";
var hma = require('hma-proxy-scraper');
var mongojs = require('mongojs');
var collections = config.db.collections;
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: "lfi@littleforest.co.uk",
		pass: "L1ttleF0rest"
	}
})
var environment = app.get('env');

if (environment === "dev" || environment === "production"){
	databaseUrl = "mongodb://" + dbHostname + "/" + dbName;
} else {
	databaseUrl = 'mongodb://' + dbUser + ':' + dbPass + '@' + dbHostname + ':' + dbPort + '/' + dbName; // "username:password@example.com/mydb"
}
//var databaseUrl = "mongodb://test:test@ds033754.mongolab.com:33754/keywordranking";

var db = mongojs(databaseUrl, collections, {authMechanism: 'ScramSHA1'});
var bodyParser = require('body-parser');
var randomProxy = '';

console.log('DB URL:', databaseUrl + ',' + collections);
console.log('Log Level: ', config.log.fileLogConfig.level);

// set the static files location
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
totalResults = 0;

db.on('error', function(error) {
  console.trace('We had an Database error.');
  console.error(error.stack)
});

if(process.env.NODE_ENV === 'production') {
	process.on('uncaughtException', function (error) {
		console.error(error.stack)
		sendEmail("Keyword Rank Checker Error - TEST ", error.stack)
	})
}

app.get('/proxies', function(req, res) {

	hma.getProxies(function (err,proxies) {
	    if(err)
	        throw err
	
	    randomProxy = proxies[Math.floor(proxies.length * Math.random())];
	    res.send(proxies);
	});
	
});

// Get keywords from db
app.get('/keywords/:domain/:region', function(req, res){
	
	console.log("Getting Keywords");
	
	var url = "www." + req.params.domain;
	var region = req.params.region;
	
	db.keywordranking.find({
			url: url,
			"regions": {"$elemMatch": { "region": region }}
		}).toArray(function(err, doc) {
		if(err){
			throw err;
		} else{
			
			var isValidDocument = doc.length > 0;
			if(isValidDocument) {
				    //console.log("response length: " + doc.length);
				    //console.log(JSON.stringify(doc));
				    res.json(doc);
			} else {
				console.log("No Keywords!");
				 res.json(doc);
			}
		}
	});
	
});
	
	
/* get keywordranking object*/
app.get('/history/:keyword', function(req, res){
	
	console.log("in /history/:keyword");
	
	db.keywordranking.find(function (err, docs) {
		if(err){
			throw err;
		} else{
			console.log(JSON.stringify(docs));
			res.json(docs);
		}
	});
});

/* persist new ranking to mongodb */
app.put('/scrape/:region', function (req, res) {
	//var id = req.params.id;
	var region = req.params.region;
	//console.log("Update id: " + id);
	console.log("Update ranking: " + req.body.keyword);
	console.log("Region: " + region);
	
	var keyword = req.body.keyword, newrankdata = req.body.ranking, newdate = req.body.ranking[0].date;
	var newrank = req.body.ranking[0].rank;
	//var url = "www." + req.body.url + region;
	var url = "www." + req.body.url;
	console.log("new rank date: "+newdate + ", new rank: "+newrank+ ", url: "+url);
	
	var query = {};
	//db.keywordranking.findOne({_id: mongojs.ObjectId(id)}, function (err, docs) {
	db.keywordranking.findOne({url: url}, function(err, docs) {
		
		if(err){
			throw err;
		} else{
			
			/* CHECK TO SEE IF URL Exists */
			db.keywordranking.find({ url: url}).toArray(function(err, doc)  //find if a value exists
			{ 
				var isValidDocument = doc.length > 0;
				
				if(isValidDocument) //if url does exist
			    {
			    	console.log("URL Exists: "+ url);
			        console.log(doc); // print out what it sends back
			    	console.log("doc length" + doc.length);
			    	
					console.log("update find docs" + JSON.stringify(docs));
					    	
			    	// Find index of region
			    	rIndex = docs.regions.map(function(el) { 
			    			if (el.region === region) return 1; else return -1; 
			    		}).indexOf(1);
			    	
			    	console.log("rIndex is: " + rIndex);
			    	
			    	var id = doc[0]._id;
			    	console.log("ID from docs is: " + id);
			    	console.log("ID from docs is: " + doc._id);
			    	console.log("ID from docs is: " + doc[0]._id);
			    	
			    	// update region if exists
			    	// IF REGION
			    	if (rIndex != -1){
			    		console.log("Updating existing region: " + region);
			    		
			    		// find index of keyword in region
				    	iIndex = docs.regions[rIndex].keywords.map(function(el) { 
				    			if (el.keyword === keyword) {
				    				console.log("el.keyword does match keyword");
				    				return 1; 
				    			} else {
				    				console.log("el.keyword does not match keyword");
				    				return -1; 
				    			}
				    		}).indexOf(1);
				    	
				    	console.log("iIndex is: " + iIndex);

			    		
			    		// IF KEYWORD
				    	// Update keyword if exists
				    	var param = "regions." + rIndex + ".keywords." + iIndex + ".ranking";
				    	var qry = "\"regions." + rIndex + ".keywords." + iIndex + ".ranking\"";
				    	var ob = {};
				    	
				    	ob[param] = { "date": req.body.ranking[0].date, "rank": req.body.ranking[0].rank };
				    	console.log("ob json: "+JSON.stringify(ob));
				    	
				    	if (iIndex != -1){
				    		console.log("Updating keyword: " + keyword + "for region: " + region);
				    			db.keywordranking.update( 
				    				{_id: mongojs.ObjectId(id),'regions.region':region,'regions.keywords.keyword': keyword},
									{$push: ob }, 
									function(err, doc) {
										console.log("Error updating keyword: "+keyword+" error is: "+err);
										console.log("Doc is: "+JSON.stringify(doc));
										
										res.json(doc);
									}
								);
				    	} // IF NOT KEYWORD
				    	  // If not push new
				    	else{  //"keywords": { "keyword": keyword, "ranking": [{ "date": req.body.ranking[0].date, "rank": req.body.ranking[0].rank}]}
				    		console.log("pushing new keyword: " + keyword);
				    		db.keywordranking.update( 
				    			{_id: mongojs.ObjectId(id),'regions.region':region},
				    			{$push: { 
				    						"regions.$.keywords": { 
	    										"keyword": keyword, 
	    										"ranking": [{ 
	    												"date": req.body.ranking[0].date, 
	    												"rank": req.body.ranking[0].rank
	    										}]
				    						}
				    					}
				    			}, 
				    			function(err, doc) {
										res.json(doc);
								}
				    		);
				    	}
				    }// IF NOT REGION 
				     // else push push new region 
				    else {
				    	console.log("pushing new region: " + url);
				    	db.keywordranking.update( 
			    			{_id: mongojs.ObjectId(id),'url':url},
			    			{$push: { "regions": { 
			    							"region": region, 
			    							"keywords": [{ 
			    									"keyword": keyword, 
			    									"ranking": [{ 
			    											"date": req.body.ranking[0].date, 
			    											"rank": req.body.ranking[0].rank
			    									}]
			    							}] 
			    					}}
			    			}, 
			    			function(err, doc) {
									res.json(doc);
							}
			    		);
				    }
    	 		} 
    	 		else // if URL does not exist 
			    {
			        console.log(url + "Not in docs");
			        console.log(url + "Adding new domain");
			     	db.keywordranking.insert(
			     		{"url": url,
			     		"regions": [{ 
			     				"region": region,
					     		"keywords": [
					     			{
					     				"keyword" : keyword,
					     				"ranking" : [
					     					{
					     						"date" : req.body.ranking[0].date,
					     						"rank" : req.body.ranking[0].rank
					     					}
					     				]
					     			}
					     		]
							    
				     	}]},
			     		function(err, doc) {
							res.json(doc);
						}
			     	);
			    }
			});
    	 
    	 
    	 
    	}
    });
	/*
	db.keywordranking.update({_id: mongojs.ObjectId(id), 'keywords.keyword': keyword},
		{$push: { 'keywords.$.ranking': { "date": req.body.ranking[0].date, "rank": req.body.ranking[0].rank} } }, function(err, doc) {
			res.json(doc);
		}
	);*/
	
	
	
});

function sendEmail(subject, body) {
	transporter.sendMail({
		from: 'lfi@littleforest.co.uk',
		to: 'lfi@littleforest.co.uk',
		cc: 'adrian@littleforest.co.uk',
		subject: subject,
		text: body
	}, function (error, info) {
		if (error) {
			console.error(error)
		} else {
			console.log('Message sent: ' + info.response);
		}
		//process.exit(1)
	})
}

/* scrape google for keyword search results */
app.get('/scrape/:keyword/:domain/:region', function(req, res){

	console.log("in /scrape/:keyword");	
	
	var keyword = req.params.keyword;
	var region = req.params.region;
	var domain = "www." + req.params.domain;
	
	console.log("Region: " + region);
	console.log("Keyword: " + keyword);
	console.log("Domain: " + domain);
	
	/* Google Search Parameters:
	 * 
	 * 		num=		Number of results (<0..100>)
	 * 		q			The search query
	 * 		tbs=li:1	Results from a verbatim search  (looks for exactly what you type)
	 * 						- won't personalise search, 
	 * 						- won't include synonyms, 
	 * 						- won't make automatic spelling corrections,
	 * 						- won't search for words with the same stem or similar terms 
	 * 		oe			Output encoding
	 * 		pws=0		Disable personalized web search (0)
	 * 		
	 * 		refs:
	 * 		http://yoast-mercury.s3.amazonaws.com/uploads/2007/07/google-url-parameters.pdf
	 * 		https://stenevang.wordpress.com/2013/02/22/google-search-url-request-parameters/
	 */

	var url = "https://www.google" + region + "/search?num=50&q=" + keyword + "&oe=utf-8&tbs=li:1&pws=0";
	console.log("url: " + url);
	//url = "https://www.google" + region + "/search?num=50&q=" + keyword + "&oe=utf-8";
	
	var reqOpts = {
    	url: url, 
    	method: "GET", 
    	headers: {"Cache-Control" : "no-cache"}, 
    	proxy: randomProxy
	};
	
	request(reqOpts, function (error, response, body) {
		
		if (error) {
			console.trace("Couldn’t get Google page because of error.");
			console.error(error.stack);
			sendEmail("Keyword Rank Checker Failed Response from Google for "  + domain, JSON.stringify(body), error.stack)
			return;
		}
	
		// load the body of the page into Cheerio so we can traverse the DOM
		var $ = cheerio.load(body), result = $(".g"), json = [], heading = "", url = "", match = false;
		
		/*
		var fs = require('fs');
		fs.writeFile("out.txt", body, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("written body to file");
		}); 
		*/
		
		/*  To simulate no response from Google
		 *  result = [];
		 *  body = {"statusCode":503,"body":"<div style=\"font-size:13px;\">\n    <b>About this page</b><br><br>Our systems have detected unusual traffic from your computer network.  This page checks to see if it&#39;s really you sending the requests, and not a robot.  <a href=\"#\" onclick=\"document.getElementById('infoDiv').style.display='block';\">Why did this happen?</a><br><br>\n    <div id=\"infoDiv\" style=\"display:none; background-color:#eee; padding:10px; margin:0 0 15px 0; line-height:1.4em;\">\n     This page appears when Google automatically detects requests coming from your computer networkwhich appear to be in violation of the <a href=\"//www.google.com/policies/terms/\">Terms of Service</a>. The block will expire shortly after those requests stop.  In the meantime, solving the above CAPTCHA will let you continue to use ourservices.<br><br>This traffic may have been sent by malicious software, a browser plug-in, or a script that sends automated requests.  If you share your network connection, ask your administrator for help &mdash; a different computer usingthe same IP address may be responsible.  <a href=\"//support.google.com/websearch/answer/86640\">Learn more</a><br><br>Sometimes you may be asked to solve the CAPTCHA if you are using advanced terms that robots are known to use, or sendingrequests very quickly.\n    </div>\n  \n  \n \n \n IP address: 87.106.245.6<br>Time: 2016-03-16T14:48:11Z<br>URL: https://www.google.co.uk/search?num=50&amp;q=a3&amp;oe=utf-8&amp;tbs=li:1&amp;pws=0<br>\n </div>\n</div>"};
		 */ 
	
		console.log("result length: " + result.length);
		if (result.length === 0) {
			sendEmail("Keyword Rank Checker Issue with HTML Response from Google for " + domain, JSON.stringify(body))
		}
		else {
			//console.log(body);
			result.each(function (i, link) {
			
				heading = $(link).find('h3').text();
			    url = $(link).find('h3 a').attr("href");
			    rank = i + 1;
			    
				// strip out unnecessary junk
				if(url != undefined){
					url = url.replace("/url?q=", "").split("&")[0];
					
					if (url.charAt(0) === "/") {
						return;
					}
					
					if (url.search(domain) != -1) {
						console.log("Found match: " + url);
						console.log("Rank: " + rank);
						match = true;
					} else {
						match = false;
					}
				
					console.log("rank: " + rank + ", title: " + heading + ", url: " + url);
					
					json.push({
						title: heading,
						url: url,
						match: match,
						ranking: rank
					});
				}
				totalResults++;
			});
		}
		res.json(json);
	});
	
});

app.delete('/delete/:keyword/:region/:id', function (req, res) {
	
	var keyword = req.params.keyword;
	var region = req.params.region;
	var id = req.params.id;
	
	console.log(keyword);
	console.log(region);
	console.log(id);
	
	db.keywordranking.findAndModify({
	  query: {
	    '_id': mongojs.ObjectId(id), 'regions.region': region
	  },
	  update: {
	    $pull: {
	      'regions.$.keywords': {'keyword': keyword}
	    }
	  },
	  new: true,
	  fields: {"regions": {"$elemMatch": { "region": region } }, "_id": 0 } 
	}, function (error, doc) {
		
		if (error) {
			console.trace("There was a problem whilst deleting $keyword from the DB.");
			console.error(error.stack);
			return;
		}
		
		console.log("Keywords Object after keyword removal: ");
		console.log(JSON.stringify(doc));
		res.json(doc);
	});
	
});

app.listen(process.env.PORT || 8081);
console.log('Magic happens on port 8081'); 
exports = module.exports = app;