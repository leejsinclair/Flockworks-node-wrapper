/*
 * Methods:
 * 		agent.
 * 			signUp				: 	Sets the domain, that this module will use to access the flockworks API
 * 			signIn				: 	Sign in using email and password
 * 			update				: 	Update user profile
 * 			auth				: 	Authenticate using: twitter | facebook | linkedin | google 
 * 			getUserProfile		: 	Get user details as JSON
 * 			password.
 * 				reset			: 	Request password reset
 * 
 * 			channel.
 * 				list			: 	Get list of channels owned by user
 * 				preview			: 	Get privew of articles across all channels owned by agent/user
 * 				content			: 	Get channel content
 * 				update 			: 	Update channel details
 * 				clone 			: 	Clone an existing channel in to a specific users profile
 * 
 * 			updatePrivateFeeds	: 	Request update of agent/users private feeds (e.g. twitter/facebook )
 * 
 * 		feed.
 * 			post				: 	Post new content to a specific feed
 *
 */
var   fs 			= require('fs')
	, httpWrapper 	= require('./lib/httpWrapper')
	, functions 	= require('./lib/functions')
	, settings 		= {
						"articleCache": 
							{
								"url": "http://localhost:{port}/article/",
								"ports": [ "8878", "8879" ]
							}
					  }
	, fw 			= {
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

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		setAPIDomain
 * 					Sets the domain, that this module will use to access the flockworks API
 * 
 * Parameters:	serverDomain : String ( URL: e.g. http://flockworks.com/ )
 * 
 * Returns:		updated flockworks access details
 */
function setAPIDomain( serverDomain ) {
	if(serverDomain && (serverDomain+"").length >0) 
		{
			serverDomain = serverDomain.replace("http://").replace("https://").replace("/api/");
			fw.uri = "http://" + serverDomain + "/api/";
		}

	return fw;
};

exports.setAPIDomain = setAPIDomain;

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.signUp
 * 					Creates an agent/user profile within the flockworks API domain
 * 
 * Parameters:	data : Object
 * 					e.g. 
 * 						{
 * 							 "firstName": "John"
 * 							,"lastName": "Smith"
 * 							,"screenName": "John Smith"
 * 							,"email": "john.smith@gmail.com"
 * 							,"password": "mypassword"
 * 							,"callbackURL": "http://mywebsite.com/signupComplete"
 * 						}
 * 				callback: 	function( new agent profile )
 * 
 */
var signUp = function( data, callback ) {
	/* API request - START */
	var endPoint = getEndPoint( "post", "signup", [] );
	approved = true;  														// check beta registration
	
	functions.httpRequest('POST',endPoint,JSON.stringify(data),function( APIresponse ) {
		try {
			profile = JSON.parse(APIresponse);
		} catch(e) {
			profile = APIresponse;
		}
		
		callback( profile, approved );
	});
};

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.update
 * 					Updates a specific agent/user profile within the flockworks API domain
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				data : Object
 * 					e.g. 
 * 						{
 * 							 "firstName": "John"
 * 							,"lastName": "Smith"
 * 							,"screenName": "John Smith"
 * 							,"email": "john.smith@gmail.com"
 * 							,"password": "mypassword"
 * 							,"callbackURL": "http://mywebsite.com/signupComplete"
 * 						}
 * 				callback : 	function( updated user profile )
 * 
 * Notes:		"password", is optional if left blank the password will not be updated
 * 
 */
var updateAccount = function( uid, feather, data, callback ) {
	/* API request - START */
	var endPoint = getEndPoint( "post", "update", [ uid, feather] );
	
	data.uid = uid;
	data.id = uid;
	data.feather = feather;
	
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

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		signIn
 * 					Validates the user/agent using email address and password
 * 					Returns user profile and feather (used for further requests)
 * 
 * Parameters:	email 		: String
 * 				password	: String
 * 				callback	: function ( JSON: agentProfile )
 */
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

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		getUserProfile
 * 					Returns agent/user profile
 * 
 * Parameters:	agentId		: String ( API identifier for agent )
 * 				feather		: String ( Session access string )
 * 				callback	: function ( JSON: agentProfile or NULL )
 */
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

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		password
 * 					Various password methods
 */
var passwordFunctions = {
	
	/**
	 * Author:		Lee Sinclair
	 * Updated:		8 Mar 2012
	 * 
	 * Method:		password.request
	 * 					Request a new password
	 * 
	 * Parameters:	emailAddress: String ( email address that the agent/user registered with )
	 * 				templates	: JSON object containing HTML for confirmTemplate and successTemplate
	 * 							  these templates are emailed to the user
	 * 				callbackURL	: String ( URL of the page that will be displayed after a request to reset password )
	 * 				callback:	: function ( JSON: request to reset password API response )
	 */
	
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

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.auth
 * 					Authorise user using social network
 * 
 * Parameters:	
 * 				socialNetorkName
 * 						: 	String ( twitter | facebook | linkedin | google )
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				data : Object
 * 					e.g. 
 * 						{
 * 							 "firstName": "John"
 * 							,"lastName": "Smith"
 * 							,"screenName": "John Smith"
 * 							,"email": "john.smith@gmail.com"
 * 							,"password": "mypassword"
 * 							,"callbackURL": "http://mywebsite.com/signupComplete"
 * 						}
 * 				callback : 	function ( user profile )
 * 
 * Notes:		"password", is optional if left blank the password will not be updated
 */
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

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.channel.list
 * 					Returns a list of channels owned by the user
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				callback : 	function ( channel list )
 */
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

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.channel.preview
 * 					Returns a 5 content items from each channels owned by the user
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				callback : 	function ( channel list )
 * 				cacheme	:  	Boolean ( true = cache results )
 */
var getChannelPreview = function( numberToDisplay, uid, feather, callback ) {
	var endPoint = getEndPoint( "get", "channelPreview", [ numberToDisplay, uid, feather ] );

	getAPIData(endPoint, function(response) {
		callback(response);
	});
};

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.channel.content
 * 					Retrieves channel content
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				channelId : String ( flockworks API id of channel )
 * 				callback : 	function ( channel list )
 * 				cacheme	:  	Boolean ( true = cache results )
 */
var getChannel = function( uid, feather, channelId, callback ) {
	var endPoint = getEndPoint( "get", "channel", [ channelId, uid, feather ] );
	
	getAPIData(endPoint, function(response) {
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
 * 			callback:	  (Function) callback function
 */
function getAPIData( endPoint, callback) {
	functions.httpRequest('GET',endPoint, function(APIresponse) {
		try {
			response = JSON.parse(APIresponse);
		} catch(e) {
			response = APIresponse;
		}

		callback(response);
	});
}

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.channel.update
 * 					Updates channel details
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				data	: 	Object ( updated channel details )
 * 				callback : 	function ( channel list )
 */
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

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.channel.clone
 * 					Clone a channel into a specific agent/user profile
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				channelId: 	String ( flockworks API channel ID of channel to clone )
 * 				callback : 	function ( channel list )
 */
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

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.updatePrivateFeeds
 * 					Request an update of all agent/users private feeds
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				callback : 	function ( API response )
 */
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
	"channel": 
		{
			"list": getChannelList,
			"preview": getChannelPreview,
			"content": getChannel,
			"update": updateChannel,
			"clone": cloneChannel
		},
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

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		feed.postToFeed
 * 					Post new items to feed 
 * 
 * Parameters:
 * 				feedUpdateDetails	: 	Object ( see notes below )
 * 				callback : 	function ( upadted feeedDetails )
 * 
 * Notes:
 * 
 * feedUpdateDetails description:
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
							article.title = article.title.replace(/[^A-Za-z 0-9 \.,\?'""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g,'');
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