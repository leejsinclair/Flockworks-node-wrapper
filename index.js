var fs = require('fs');
var httpWrapper = require('./lib/httpWrapper');
var functions = require('./lib/functions');

var settings = {
	"articleCache": {
		"url": "http://localhost:{port}/article/",
		"ports": [ "8878", "8879" ]
	}
};

fs.mkdir("./cache", 0775, function(e) {});
fs.mkdir("./cache2", 0775, function(e) {}); 

var cacheTimeout = 900000; // 15 minutes
var cache2File = require('cache2file'),
	cache = new cache2File("/flockworks/flockweb/cache/", cacheTimeout /* Timeout in milliseconds */), // Generate a new cache
	cache2 = new cache2File("/flockworks/flockweb/cache2/", 21600000); // 6 hours

var fw = {
	"uri": "http://127.0.0.1:8183/api/",
	"endpoint": {
		"post": {
			"feedItems": "content/import/{id}",
			"signup": "agent",
			"update": "agent/{uid}/{feather}",
			"auth": "agent/auth/{networkname}/{uid}/{feather}",
			"signin": "agent/signin",
			"socialShare": "{networkname}/status/{uid}/{feather}",
			"publish": "publish/feed/{feedId}/{uid}/{feather}",
			"forgotPassword": "agent/forgot",
			"channel": "channel/{uid}/{feather}",
			"cloneChannel": "channel/{uid}/{feather}"
		},
		"get": {
			"profile": "agent/id/{agentId}",
			"channelList": "/api/channel/{uid}/{feather}",
			"channelPreview": "/api/channel/preview/{number}/{uid}/{feather}",
			"channel": "/api/channel/content/{channelId}/{uid}/{feather}",
			"updatePrivateFeeds": "/api/feed/download/private/{uid}/{feather}"
		}
	}
};

var signUp = function( data, callback ) {
	/* API request - START */
	var endPoint = getEndPoint( "post", "signup", [] );
	approved = checkApproved(data.email); 														// check beta registration
	
	functions.httpRequest('POST',endPoint,JSON.stringify(data),function( APIresponse ) {
		try {
			profile = JSON.parse(APIresponse);
		} catch(e) {
			profile = APIresponse;
		}
		
		callback( profile, approved );
	});
};

var updateAccount = function( uid, feather, data, callback ) {
	/* API request - START */
	var endPoint = getEndPoint( "post", "update", [ uid, feather] );
	
	data.uid = uid;
	data.id = uid;
	data.feather = feather;
	
	//console.log(data);
	
	functions.httpRequest('PUT',endPoint,JSON.stringify(data),function( APIresponse ) {
		try {
			profile = JSON.parse(APIresponse);
		} catch(e) {
			profile = APIresponse;
		}

		callback( profile );
	});
};

var signUpQuick = function( data, callback ) {
	/* API request - START */
	var endPoint = getEndPoint( "post", "signup", [] );
	
	functions.httpRequest('POST',endPoint,JSON.stringify(data),function( APIresponse ) {
		try {
			profile = JSON.parse(APIresponse);
		} catch(e) {
			profile = APIresponse;
		}
		
		callback( profile );
	});
};

var signIn = function( email, password, callback ) {
	var endPoint = getEndPoint( "post", "signin", [] );
	if ( email != '' && password != '' ) {
		var postValue = JSON.stringify({ "email" : email, "password" : password });
		//console.log("signIn: " + endPoint);
		//console.log("postValue: " + postValue);
		httpWrapper.httpRequest( 'POST', endPoint, postValue , function( agentProfile ) {
			try {
				profile = JSON.parse(agentProfile);
			} catch(e) {
				profile = agentProfile;
			}
			callback(profile);
		});	
	}
};

/* Retrieve user details from the API */
var getUserProfile = function( agentId, feather, callback ) {
	var endPoint = getEndPoint( "get", "profile", [ agentId, feather ] );
	
	console.log("getUserProfile: " + endPoint);
	
	httpWrapper.httpRequest( 'GET', endPoint, function( profileObj ) {
		try {
			profile = JSON.parse(profileObj);
		} catch(e) {
			console.log("not ok: " + e);
			profile = null;
		}
		
		callback(profile);
	});	
};

var passwordFunctions = {
	
	request: function(emailAddress, templates, callbackURL, callback){
			
			var postValue = {
				"emailAddress" : emailAddress,
				"confirmTemplate": templates.confirmTemplate,
				"successTemplate": templates.successTemplate,
				"callback": callbackURL
			};
			
			var endPoint = getEndPoint( "post", "forgotPassword", [ ] );
			
			functions.httpRequest('POST', endPoint, JSON.stringify(postValue), function( APIresponse, post ) {
				try {
					response = JSON.parse(APIresponse);
				} catch(e) {
					response = APIresponse;
				}
				callback(response);
			});
	}
	
};

/* Authorise user using social network */
var auth = function ( socialNetworkName, uid, feather, data, callback ) {
	var endPoint = getEndPoint( "post", "auth", [ socialNetworkName, uid, feather ] );

	//console.log('Login:' + endPoint);

	functions.httpRequest('POST',endPoint, JSON.stringify(data), function(APIresponse) {
		//console.log("API response:");
		//console.log(APIresponse);
		
		try {
			response = JSON.parse(APIresponse);
		} catch(e) {
			response = APIresponse;
		}
		callback(response);
	});
};

var getChannelList = function( uid, feather, callback ) {
	var endPoint = getEndPoint( "get", "channelList", [ uid, feather ] );
	
	console.log("getChannelList: " + endPoint);
	
	functions.httpRequest('GET',endPoint, function(APIresponse) {
		try {
			response = JSON.parse(APIresponse);
		} catch(e) {
			response = APIresponse;
		}
		callback(response);
	});
};

var getChannelPreview = function( numberToDisplay, uid, feather, callback, cacheMe ) {
	//console.log("getChannelPreview:");
	var endPoint = getEndPoint( "get", "channelPreview", [ numberToDisplay, uid, feather ] );
	
	cacheMe = (feather!="wintermead"?false:cacheMe); // Don't cache custom channels
	
	//console.log("getChannelPreview: " + endPoint);
	getAPIData(endPoint, cacheMe, cacheMe, function(response) {
		callback(response);
	});
};

/*
 * For getting public channels, hence caching
 */
var getChannel = function( uid, feather, channelId, callback ) {
	var endPoint = getEndPoint( "get", "channel", [ channelId, uid, feather ] );
	
	console.log("getChannel: " + endPoint);
	
	getAPIData(endPoint, true, false /* Keep cache for public channels for 24 hours */, function(response) {
		//console.log("getChannel: " + response);
		if(response.ok && response.ok==true) {
			response = false;
		}
		callback(response);
	});

};


/*
 * Special routine for getting API responses, includes caching options
 * Parameters:
 *			endPoint:     (String) URL to request
 *			cacheIt:      (Boolean) if true then cache item
 *			cacheForever: (Boolean) if true caches data for 1 day (however if the 10 minute timeout is reached, then this cache is updated also)
 */
function getAPIData( endPoint, cacheIt, cacheForever /* or 1 day */, callback) {
	var key = endPoint;
	var key2 = endPoint + ":24"; // key for sliding caching
	if(cacheIt) {
		// Attempt to retrieve from short term cache
		//console.log("Attempting short term cache");
		cache.get(key, function (err, data) {
			if(data==null) err=true;

			// Use cache if it contains no errors
			if(!err && data.length>0 && data.indexOf('"ok":false') < 0 && data.indexOf("502 Bad gateway") < 0 && data.indexOf("504 Gateway Timeout") < 0 && data.indexOf("Internal Server Error") < 0 && data.indexOf('"No node available"') <0) {
				//console.log("Using short term cache");
				try { response = JSON.parse(data); }
				catch(e) { console.log("flockworks.js getAPIData @@1: " + data); }
				
				callback(response);

				if(cacheForever)
					cache2.set( key2, JSON.stringify(response) ); 	// set cache to re-update 24 hours
			} else {
				// Attempt to retrieve from long term cache
				console.log("Attempting long term cache");
				cache2.get(key2, function (err, data) {
					if(!err)
						console.log("Retrieved long term cache");
					// Use cache if it contains no errors
					if(!err && data.length>0 && data.indexOf('"ok":false') < 0 && data.indexOf("<title>502 Bad gateway</title>") < 0 && data.indexOf("<title>504 Gateway Timeout</title>") < 0 && data.indexOf("Internal Server Error") < 0 && data.indexOf('"No node available"') <0) {
						console.log("Using long term cache");
						response = JSON.parse(data);
						callback(response);

						// Reset short term cache timer, so that parellel requests don't bunch up for a single api request
						// This will be reset again, once the API responds
						cache.set( key, JSON.stringify(response) ); 

						// Make API request
						functions.httpRequest('GET',endPoint, function(APIresponse) {
							try { response = JSON.parse(APIresponse); } 
							catch(e) { response = APIresponse; }

							// Update cache
							if(response.ok && response.ok==true) {
								cache.set( key, JSON.stringify(response) ); 		// set short term cache
								if(cacheForever)
									cache2.set( key2, JSON.stringify(response) ); 	// set cache to re-update 24 hours
							} else {
								cache.set( key, JSON.stringify(response) ); 		// set short term cache
								if(cacheForever)
									cache2.set( key2, JSON.stringify(response) ); 	// set cache to re-update 24 hours
							}
						}); // </functions.httpRequest>

					} else {
						// Update cache with call back
						console.log("no cache found");
						functions.httpRequest('GET',endPoint, function(APIresponse) {
							try { response = JSON.parse(APIresponse); } 
							catch(e) { response = APIresponse; }

							if(response.ok && response.ok==true) {
								cache.set( key, JSON.stringify(response) ); 		// set short term cache
								if(cacheForever)
									cache2.set( key2, JSON.stringify(response) ); // set cache to re-update 24 hours
							} else {
								cache.set( key, JSON.stringify(response) ); 		// set short term cache
								if(cacheForever)
									cache2.set( key2, JSON.stringify(response) ); // set cache to re-update 24 hours
							}

							callback(response);
						}); // </functions.httpRequest>
					}
				}); // </cache.get key2>
				
			}
			
		}); // </cache.get key>
	} // </cacheIt> 
	else // No cache requested
	{
		functions.httpRequest('GET',endPoint, function(APIresponse) {
			try {
				response = JSON.parse(APIresponse);
			} catch(e) {
				response = APIresponse;
			}

			callback(response);
		});
	}
}

function updateChannel( uid, feather, data, callback ) {
	var endPoint = getEndPoint( "post", "channel", [ uid, feather ] );
	var postJson = data;

	console.log(endPoint);
	functions.httpRequest('POST',endPoint, JSON.stringify(postJson), function(APIresponse) {	
		try {
			response = JSON.parse(APIresponse);
		} catch(e) {
			response = APIresponse;
		}
		console.log(response);
		callback(response);
	});
}

function cloneChannel( uid, feather, channelId, callback ) {
	var endPoint = getEndPoint( "post", "cloneChannel", [ uid, feather ] );

	//console.log('cloneChannel:' + endPoint);
	
	var postJson = {
		"agentId": uid,
		"cloneFrom": channelId
	};

	functions.httpRequest('POST',endPoint, JSON.stringify(postJson), function(APIresponse) {	
		try {
			response = JSON.parse(APIresponse);
		} catch(e) {
			response = APIresponse;
		}
		callback(response);
	});
}

function updatePrivateFeeds( uid, feather, callback ) {
	var endPoint = getEndPoint( "get", "updatePrivateFeeds", [ uid, feather ] );
	
	functions.httpRequest('GET',endPoint, function(APIresponse) {
		try {
			response = JSON.parse(APIresponse);
		} catch(e) {
			response = APIresponse;
		}
		callback(response);
	});
}

exports.agent = {
	"signUp": signUp,
	"signUpQuick": signUpQuick,
	"update": updateAccount,
	"auth": auth,
	"signIn": signIn,
	"getUserProfile": getUserProfile,
	"password": passwordFunctions,
	"getChannelList": getChannelList,
	"getChannelPreview": getChannelPreview,
	"getChannel": getChannel,
	"updateChannel": updateChannel,
	"cloneChannel": cloneChannel,
	"updatePrivateFeeds": updatePrivateFeeds
}

exports.postTo = function( postNetworkName, uid, feather, post, callback ) {
	var title = post.title;
	var teaser = post.teaser;
	var content = post.content;
	var url = (post.url?post.url:'');
	var feedID = (post.feedId?post.feedId:'null');
	
	var endPoint = getEndPoint( "post", "publish", [ feedId, uid, feather ] );
	
	switch(postNetworkName.toLowerCase()) {
		case "twitter":
			endPoint = getEndPoint( "post", "socialShare", [ postNetworkName, uid, feather ] );
			message = { 'text': teaser + ' ' + url + ' via @enliten_' };
			break;
		case "facebook":
		case "linkedin":
		case "googleplus":
			endPoint = getEndPoint( "post", "socialShare", [ postNetworkName, uid, feather ] );
			message = { 'text': teaser + ' ' + url };
			break;
		case "enliten":
			endPoint = getEndPoint( "post", "publish", [ feedId, uid, feather ] ); /* need channel ID */
		default:
			endPoint = getEndPoint( "post", "socialShare", [ postNetworkName, uid, feather ] );
			message = { 'text': teaser + ' ' + url };
			break;
	}
	
	sendData = JSON.stringify(message);
	httpWrapper.httpRequest( 'POST', endPoint, sendData, callback );

};

/* Post new items to feed 
 * 
 * Requires the following format:
 * {
 * 	"id": String (id of feed to save article items into - GUID),
 * 	"title": String (Title of feed),
 * 	"items": 
 * 			[
 * 				{
 * 					"title": ,
 * 					"author": ,
 * 					"text": ,
 * 					"pubDate": ,
 * 					"thumbUrl": ,
 * 					"videoUrl": ,
 * 					"link": ,
 * 				}
 * 			]
 *	}
 */
function postToFeed( feedUpdateDetails, callback ) {
	// feedItems
	if(!feedUpdateDetails || !feedUpdateDetails.items)
		return;

	var items = feedUpdateDetails.items;
	
	items.forEach( function( article, index )
		{
			if(article.title && (article.title+"").length>0 && article.link)
				{
					if(article.title)
						{
							/* Clean description of any invalid characters */
							article.title = replace(/[^A-Za-z 0-9 \.,\?'""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g,'');
						}
						
					if(article.description)
						{
							/* Remove ads where possible */
							article.description = functions.removeAds(article.description);
							/* Clean description of any invalid characters */
							article.description = article.description.replace(/[^A-Za-z 0-9 \.,\?'""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g,'');
							/* Create plain text property */
							article.plainText = article.description.replace(/<[^>]+>/gi,"");
						}
						
					if(article.pubDate) 
						{
							/* API expects "datePublish" property */
							article.datePublished = article.pubDate;
						}
					
					if(article.link)
						{
							/* Clean link */
							article.link = article.link.replace(/\/feed\/atom\/$/,"/");
							/* API expects "url" property */
							article.url = article.link.replace(/\/feed\/atom\/$/,"/");
						}
						
					if(!article.type)
						{
							article.type = "rss";
						}
				}
			
		}
	);

	postNewArticles(feedUpdateDetails, callback );
	
}

/** 
 * Post new articles data to back office server
 *    this function is only called if the downloaded feed has items not already
 *    processed in previous processing cycles
 * 
 *	@since			0.1
 *	@version		0.1
 *	@author			Chunglong	longbill.cn@gmail.com
 * 	@method
 *  @calledFrom		getFeed()
 * 	@param			{ Object } feed object passed from getFeed function, object contains .uri
 *  @param			{ Array }  array of new posts (JSON representation of RSS. see parseRSS )
 * 	@namespace		.
 * 	@id */
function postNewArticles(feedUpdateDetails, callback)
{
	var json = JSON.stringify(feedUpdateDetails);
	var id = feedUpdateDetails.id;
	console.log("Posting... \"" + feedUpdateDetails.title + "\"");
	var url = getEndPoint( "post", "feedItems", [ id ] );
	var articleCacheSettings = settings.articleCache;
	
	//saveJSON("/tmp/" + feed.title, {"items":posts});
	
	functions.httpRequest('POST',url,json,function(s)
		{
			
			try { apiResponse = JSON.parse(s); } catch(e) { return; }
			var success = [];
			console.log('apiResponse.successes.length: ' + apiResponse.successes.length,1 );
			
			if (apiResponse.successes.length !=0) {
				var successes = apiResponse.successes;
				for (i=0; i<apiResponse.successes.length; i++) 
					{
						articleOBJ = 
							{
								"content_id": successes[i]._id,
								"title": successes[i].title,
								"url": successes[i].url,
								"text": successes[i].text,
								"origin": "downloader",
								"feedId": id,
								"downloaded": false,
								"thumbUrl": successes[i].thumbUrl
							}
							
						success.push( articleOBJ );
						
						/* Post to article content downloader */
						var url = settings.articleCache.url + successes[i]._id;
						
						if(settings.articleCache.ports) 
							{
								var randomPort=Math.floor(Math.random()*(settings.articleCache.ports.length))
								var url = url.replace( "{port}", settings.articleCache.ports[randomPort]+"" );
							} 
						else 
							{
								url = url.replace( "{port}","8878" );
							}
							
						downloadArticle( url, articleOBJ, function( response ) 
							{
									console.log("downloaded");
									console.log(response);
							}
						);
					}
					
				var response = {
					"id": feedUpdateDetails.id,
					"title": feedUpdateDetails.title,
					"items": success
				};
				
				callback(response);
					
			} else if (apiResponse.successes.length ==0 && apiResponse.failureCount !=0) {
				console.log('Error!!! details saved to: posts/' + feed.id + '_response.json');
				//saveJSON('./posts/' + feed.id + '_post.json',{"items":posts});
				//saveJSON('./posts/' + feed.id + '_response.json',JSON.parse(s));
			}
		}
		,0
	);
}

function downloadArticle( url, articleOBJ, callback ) {
	
	if(articleOBJ.thumbUrl && articleOBJ.thumbUrl.length>0)
		{
			// check if thumb image is valid ( i.e. gets 200 status response )
			functions.validateImage( articleOBJ.thumbUrl, function(valid)
				{
					if(!valid) {
						console.log("Dropping image: " + articleOBJ.thumbUrl);
						articleOBJ.thumbUrl = "";
					}
						
						
					console.log('POSTing article: "' + articleOBJ.title + " > " + url );
					var articleJSON = JSON.stringify(articleOBJ);
					functions.httpRequest('POST',url,articleJSON,function(s)
						{
							try {
								var article = JSON.parse(s);
								if(article.title)
									console.log("Processed: \"" + article.title + "\"");
							} catch(e) {
								console.log("Unable to process: " + articleOBJ.title);
							}
							
							if(callback)
								callback(article)
		
						}
					);
				}
			);
		}
	else
		{
			var articleJSON = JSON.stringify(articleOBJ);
			console.log('POSTing article: "' + articleOBJ.title + " > " + url );
			functions.httpRequest('POST',url,articleJSON,function(s)
				{
					try {
						var article = JSON.parse(s);
						if(article.title)
							console.log("Processed: \"" + article.title + "\"");
					} catch(e) {
						console.log("Unable to process: " + articleOBJ.title);
					}
					
					if(callback)
						callback(article)

				}
			);
		}
}

exports.feed = {
	"post":  postToFeed
};

exports.loadUserList = function() {
	var updateApprovedUsersIterator = setInterval(function(){
		loadUserList();
	},600000); // check every 60 minutes
	loadUserList();
};

exports.updateUserList = function() {
	var updateApprovedUsersIterator = setInterval(function(){
		updateUserList();
	},621000); // check every 60 minutes 21 seconds
	updateUserList();
};

function getEndPoint( type, purpose, urlVars ) {
    var endPoint = fw.uri + ( fw.endpoint[type] )[purpose];
    for (var i=0;i<urlVars.length;i++) {
        endPoint = endPoint.replace(/{.+?}/, urlVars[i] );
    }
    
    endPoint = endPoint.replace("/api//api/", "/api/");
    
    //console.log( type + "." + purpose + " > " + endPoint);
    
    return endPoint;
}

/**
* do a http GET or POST request
* for GET requests: httpRequest('GET','http://xxx.com/xxx/yyy',function(response){ ... })
* for POST requests: httpRequest('POST','http://xxx.com/xxx/yyy','POST_CONTENT',function(response){ ... })
*/
function httpJson(method,url,data,callback)
{
	console.log('httpReqeust '+method+' '+url);
	if (method == 'GET') callback = data;
	var origURL = url;
	var url = require('url').parse(url);
	var options = 
	{
		host: url.hostname,
		port: url.port?url.port:80,
		path: url.pathname+(url.query?'?'+url.query:''),
		method: method,
		headers: 
		{
			'Connection': 'keep-alive',
			'User-Agent': 'NodeJS v0.4.7',
			'Content-Type': 'application/json'
		}
	};
	
	var req = http.request(options, function(res)
	{
		//console.log(res);
		if (res.statusCode == 302 || res.statusCode == 301)
		{
			console.log(res.statusCode+' found! redirecting to '+res.headers.location+'...');
			httpJson(method,res.headers.location,data,callback);
			return;
		}
		
		res.setEncoding('utf8');
		var s = '';
		res.on('data',function(chunk)
		{
			s+=chunk.toString('utf8');
		});
		res.on('end',function()
		{
			callback(s,data);
		});
	});
	req.on('error',function(err)
	{
		console.log('request error while requesting '+origURL,10);
	});
	if (method == 'POST') req.write(data);
	req.end();
};