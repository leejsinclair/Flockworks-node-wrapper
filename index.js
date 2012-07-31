/*
 * Methods:
 *		agent.
 *			signUp				: 	Sets the domain, that this module will use to access the flockworks API
 *			signIn				: 	Sign in using email and password
 *			update				: 	Update user profile
 *			auth				: 	Authenticate using: twitter | facebook | linkedin | google 
 *			getUserProfile		: 	Get user details as JSON
 *			password.
 *				reset			: 	Request password reset
 *
 *			channel.
 *				list			: 	Get list of channels owned by user
 *				preview			: 	Get privew of articles across all channels owned by agent/user
 *				content			: 	Get channel content
 *				new				: 	Save new channel
 *	   			delete 			: 	Delete channel
 *				update 			: 	Update channel details
 *				clone 			: 	Clone an existing channel in to a specific users profile
 *				vote			:   Vote on a specific content item
 *
 *			updatePrivateFeeds	: 	Request update of agent/users private feeds (e.g. twitter/facebook )
 *
 *		feed.
 *			post				: 	Post new content to a specific feed
 *
 *		app.
 *			signin 				: 	Sign in using application auth details, in order to act on behalf of a user
 *
 * Data structure:
 *		agent					: {
 *										 "firstName": "John"
 *										,"lastName": "Smith"
 *										,"screenName": "John Smith"
 *										,"email": "john.smith@gmail.com"
 *										,"password": "mypassword"
 *								  }
 *
 */
var   fs			= require('fs')
	, rest			= require('restler')
	, httpWrapper	= require('./lib/httpWrapper')
	, functions		= require('./lib/functions')
	, crypto		= require('crypto')
	, url			= require('url')
	, fw			= {
							"debug": false,
							"uri": "http://127.0.0.1:8183/api/",
							"apiKey": "YOUR API KEY",
							"secret": "YOUR API SECRET",
							"endpoint": {
								"put":
										{
											"updateKloud": "kloud"
										},

								"post": {
									"feedItems": "content/import/{id}",
									"insertIntoFeed": "content/post/{uid}/{feather}",
									"importFeedItems": "content/import/{uid}/{feather}",
									"signup": "agent",
									"update": "agent/{uid}/{feather}",
									"auth": "agent/auth/{networkname}/{uid}/{feather}",
									"socialMediaSignin": "agent/auth/{networkname}",
									"socialShare": "{networkName}/status/{uid}/{feather}",
									"getToken": "agent/token/{uid}/{feather}",
									"signin": "agent/signin",
									"appsignin": "agent/app/signin",
									"socialAuth": "agent/auth/{networkName}/{uid}/{feather}",
									"socialShare": "{networkname}/status/{uid}/{feather}",
									"publish": "publish/feed/{feedId}/{uid}/{feather}",
									"forgotPassword": "agent/forgot",
									"channel": "channel/{uid}/{feather}",
									"cloneChannel": "channel/{uid}/{feather}",
									"contentSearch": "content/search/1000/sort/datePublished/desc/{uid}/{feather}",
									"channelVote": "content/rate/{uid}/{feather}",
									"newFeed": "feed/{uid}/{feather}",
									"newKloud": "kloud",
									"appendAllowedKloud": "developer",
									"getProfileFromEmail": "agent/email",
									"rateItem": "content/rate/{uid}/{feather}",
									"contentLikeContent":"content/like/content"
								},

								"get": {
									"profile": "agent/{agentId}/{feather}",
									"listFeed": "feed/{feedId}/{uid}/{feather}",
									"channelList": "/api/channel/{uid}/{feather}",
									"channelPreview": "/api/channel/preview/{number}/{uid}/{feather}",
									"channel": "/api/channel/content/{channelId}/{uid}/{feather}",
									"updatePrivateFeeds": "/api/feed/download/private/{uid}/{feather}",
									"serviceStatus": "/api/service/status",
									"getPaypalRecord": "http://paypal.{domain}.com{folder}",
									"getProfileFromEmail": "agent/email/{emailAddress}",
									"getKloud": "kloud/id/{kloudId}",
									"popular": "feed/popular",
									"expired": "feed/expired/{seconds}",
									"termStats": "term/stats",
									"connect": "agent/connect/{networkName}/{uid}/{feather}",
									"disconnect": "agent/disconnect/{networkName}/{uid}/{feather}"
								},
								
								"delete": {
									"channelDelete": "channel/{channelId}/{uid}/{feather}",
									"profile": "/api/agent/{uid}/{feather}"
								}
							}
						}
	, templates		=	{
								"error":
									{
										"error": true,
										"status": "error",
										"message": ""
									},
								"email":
									{
										"password":
											{
												"send":
													{
														"filename": "newPassword.html",
														"content": ""
													},
												"completed":
													{
														"filename": "successPassword.html",
														"content": ""
													}
											}
									}
						};


exports.settings = fw;

/*
 * Set up defaul templates
 * function getEmailTemplates() {
	
	newPassword = fs.readFileSync("./lib/emails/newPassword.html",'utf8');
	successPassword = fs.readFileSync("./lib/emails/successPassword.html",'utf8');
	
	emailTemplates = {
		"newPassword": newPassword,
		"successPassword": successPassword
	};
	
	return emailTemplates;
}
 */

function loadEmailTemplates()
	{
		requestNewPassword = fs.readFileSync(__dirname + "/templates/newPassword.html",'utf8');
		resetSuccessPassword = fs.readFileSync(__dirname + "/templates/resetSucessPassword.html",'utf8');
		
		templates.email.password.send.content		= requestNewPassword;
		templates.email.password.completed.content	= resetSuccessPassword;
		
		return templates.email;
	}

loadEmailTemplates();

/**
 * Load email templates
 * @author Lee Sinclair
 */
function getEmailTemplates()	{
		console.log("getEmailTemplates");
		return templates.email;
	}

/**
 * Set developer key and secret to use the API
 * @author Lee Sinclair
 *
 * @param {Object} options	key pairs: apkKey {String}, secret: {String}
 */
exports.setAPIAccess = function( options )
	{
		if(options && options.apiKey)
			{
				fw.apiKey = options.apiKey;
			}

		if(options && options.secret)
			{
				fw.secret = options.secret;
			}
	}

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 *
 * Method:		setAPIDomain
 *					Sets the domain, that this module will use to access the flockworks API
 *
 * Parameters:	serverDomain : String ( URL: e.g. http://flockworks.com/ )
 *
 * Returns:		updated flockworks access details
 */
function setAPIDomain( serverDomain )
	{
		if(serverDomain && (serverDomain+"").length >0)
			{
				serverDomain = serverDomain.replace("http://","").replace("https://","").replace("/api/","").replace(/\/$/,"");
				fw.uri = "http://" + serverDomain + "/api/";
			}
			
		return fw;
	}

exports.setAPIDomain = setAPIDomain;

function setDebug( debugMode )
	{
		if(debugMode == true || debugMode == false )
			{
				fw.debug = debugMode;
			}
			
		return fw;
	};

exports.setDebug = setDebug;

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 *
 * Method:		agent.signUp
 *					Creates an agent/user profile within the flockworks API domain
 *
 * Parameters:	data : Object
 *					e.g.
 *						{
 *							"firstName": "John"
 *							,"lastName": "Smith"
 *							,"screenName": "John Smith"
 *							,"email": "john.smith@gmail.com"
 *							,"password": "mypassword"
 *							,"callbackURL": "http://mywebsite.com/signupComplete"
 *						}
 *				callback:	function( new agent profile )
 *
 */
var signUp = function (kloud, data, callback)
	{
		var endPoint = getEndPoint("post", "signup", []); // check beta registration
		
		debug("signUp: " + kloud + " " + endPoint);

		console.log(data);
		
		if (data && data.email && data.firstName && data.lastName)
			{
				postRequest(kloud, endPoint, data, callback);
			}
		else
		{
				callback(
					{
					"error": true,
					"message": "Invalid signup data"
					}
				);
			}

	};

/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 *
 * Method:		agent.update
 *					Updates a specific agent/user profile within the flockworks API domain
 *
 * Parameters:
 *				agentId	:	String ( flockworks agent ID )
 *				feather	:	String ( session feather used to verifiy user request )
 *				data : Object
 *					e.g.
 *						{
 *							 "firstName": "John"
 *							,"lastName": "Smith"
 *							,"screenName": "John Smith"
 *							,"email": "john.smith@gmail.com"
 *							,"password": "mypassword"
 *						}
 *				callback:	function( updated user profile )
 *
 * Notes:		"password", is optional if NULL the password will not be updated
 *
 */
var updateAccount = function (kloud, uid, feather, data, callback)
	{
		/* API request - START */
		var endPoint = getEndPoint( "post", "update", [ uid, feather ] );
		
		debug("updateAccount: " + kloud + " " + endPoint);
		
		data.uid = uid;
		data.id = uid;
		data.feather = feather;
		
			if (data && data.email && data.firstName && data.lastName)
				{
					putRequest(kloud, endPoint, data, callback);
				}
	};

var signUpQuick = function (kloud, data, callback)
	{
		debug("signUpQuick: " + kloud);
		
		/* API request - START */
		var   endPoint  = getEndPoint( "post", "signup", [] )
			, postValue = JSON.stringify(data);
			
			postRequest(kloud, endPoint, data, callback);
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
var signIn = function (kloud, email, password, callback) 
	{
		var endPoint = getEndPoint( "post", "signin", [] );
		
		debug("signIn: " + kloud + " " + endPoint);
		
		if (email != '' && password != '') 
			{ 
				var data = {
					"email": email,
					"password": password
				};
				
				postRequest(kloud, endPoint, data, callback); 
			}
	};


/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		signIn
 * 					Validates the user/agent using email address and password
 * 					Returns user profile and feather (used for further requests)
 * 
 * 
 * Parameters:	email 		: String
 * 				password	: String
 * 				callback	: function ( JSON: agentProfile )
 */
var appSignIn = function (kloud, uid, token, callback) 
	{
		var endPoint = getEndPoint( "post", "appsignin", [ agentId ] );
		
		debug("appSignIn: " + kloud + " " + endPoint);
		
		if (email != '' && password != '') 
			{
				var data = {
					"email": email,
					"password": password
				}; 
				
				postRequest(kloud, endPoint, data, callback); 
			}
	};

var getKloud = function( kloudId, callback, developer )
	{
		var endPoint = getEndPoint( "get", "getKloud", [ kloudId ] );
		
		debug("getKloud: " + kloudId + " " + endPoint);

		if(kloudId && kloudId.length>0)
			{
				getRequest(kloudId, endPoint, callback, developer); 
			}
		else
			{
				callback( { "error": true, "message": "Invalid kloudId" } );
			}
	}
	
var getPopularFeeds = function( kloudId, callback, administrator )
	{
		var endPoint = getEndPoint( "get", "popular", [ kloudId ] );
		
		debug("getPopularFeeds: " + kloudId + " " + endPoint);

		if(kloudId && kloudId.length>0)
			{
				getRequest(kloudId, endPoint, callback, administrator ); 
			}
		else
			{
				callback( { "error": true, "message": "Invalid kloudId" } );
			}
	}
	
var getExpiredFeeds = function( kloudId, seconds, callback, administrator )
	{
		var endPoint = getEndPoint( "get", "expired", [ seconds ] );
		
		debug("getExpiredFeeds: " + kloudId + " " + endPoint);

		if(kloudId && kloudId.length>0)
			{
				getRequest(kloudId, endPoint, callback, administrator ); 
			}
		else
			{
				callback( { "error": true, "message": "Invalid kloudId" } );
			}
	}
	
// Create new kloud record
var newKloud = function( adminAgent, kloudDetails, callback ) 
	{
		var endPoint = getEndPoint( "post", "newKloud", [] );
		
		debug("newKloud: " + kloudDetails.id + " " + endPoint);
		
		if(kloudDetails.id && kloudDetails.name)
			{
				var data = {
					  "id": kloudDetails.id
					, "name": kloudDetails.name
					, "emailAddress": kloudDetails.email
					, "dbName": (kloudDetails.database?kloudDetails.database:"")
					, "customJSON": (kloudDetails.customJSON?kloudDetails.customJSON:{})
				}
				
				// Call web service using an admin agent
				postRequest(kloudDetails.id, endPoint, data, callback, adminAgent); 
			}
		else
			{
				callback( { "error": true, "message": "Please provide a Kloud ID and name"} );
			}
	}

// Updates a specific kloud record
var updateKloud = function( kloudId, data, callback, developer )
	{
		var endPoint = getEndPoint( "put", "updateKloud", [ kloudId ] );
		
		debug("updateKloud: " + kloudId + " " + endPoint + " > ");
		console.log(data);

		if(kloudId && kloudId.length>0)
			{
				putRequest(kloudId, endPoint, data, callback, developer); 
			}
		else
			{
				callback( { "error": true, "message": "Invalid kloudID" } );
			}
	}

var appendAllowedKloud = function( adminAgent, developerDetails, kloudName, callback ) {
	var endPoint = getEndPoint( "post", "appendAllowedKloud", [] );
	
	debug("appendAllowedKloud: " + kloudName + " " + endPoint );
	
	if(kloudName && kloudName.length>0)
		{
			var data = {
				  "id": fw.apiKey
				, "name": developerDetails.name
				, "allowedKlouds": [kloudName]
				, "emailAddress": developerDetails.email
				, "secret": fw.secret
			}
			
			// Call web service using an admin agent
			postRequest(kloudName, endPoint, data, callback, adminAgent); 
		}
	else
		{
			callback( { "error": true, "message": "Please provide a Kloud ID and name"} );
		}
}
/**
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		getUserProfile
 * 					Returns agent/user profile
 * 
 * @param		{ String } kloudId, kloud scope that the user belongs
 * @param		{ String } uid - API identifier for agent
 * @param		{ String } feather - String ( Session access string )
 * @param		{ Function } callback - function ( JSON: agentProfile or NULL )
 */
var getUserProfile = function (kloud, uid, feather, callback) 
	{
		if (uid && uid != null) 
			{
				console.log("getUserProfile >> " , kloud, uid, feather );
				var endPoint = getEndPoint( "get", "profile", [ uid, feather ] );
				
				debug("getUserProfile: " + kloud + " " + endPoint );
				
				getRequest(kloud, endPoint, callback); 
			}

	};
	
getFromEmail = function( emailAddress, callback, developer ) 
	{
		if(emailAddress && emailAddress.length>0)
			{
				var endPoint = getEndPoint( "get", "getProfileFromEmail", [ emailAddress ] );
				
				debug("getFromEmail: " + emailAddress + " " + endPoint );
				
				var data = { "emailAddress": emailAddress };
				getRequest("l33t8l", endPoint, callback, developer);
			}
		else
			{
				callback( { "error": true, "message": "Invalid email address" });
			}
	}

var deleteProfile = function (kloud, uid, feather, callback) 
	{
		if (uid && uid != null) 
			{
				var endPoint = getEndPoint( "delete", "profile", [ uid, feather ] );
				
				debug("deleteProfile: " + kloud + " " + endPoint );
				
				deleteRequest(kloud, endPoint, callback);
			}
	};

/**
 * Disconnect social media account from users profile
 * 
 * @param  {String}   kloudId	 Name of the kloud that the agent belongs to
 * @param  {String}   networkName Name of the network ( twitter | linkedin | facebook | google )
 * @param  {String}   uid		 User ID
 * @param  {String}   feather	 Session based key to perform tasks on the users behalf
 * @param  {Function} callback	Respond with API data
 * 
 */
function disconnectNetwork( kloudId, networkName, uid, feather, callback )
	{
		var endPoint = getEndPoint( "get", "disconnect", [ networkName, uid, feather ] );
		getRequest( kloudId, endPoint, callback );
	}

/**
 * Share status messages on different social media accounts
 * 
 * @param  {String}   kloudId	 Name of the kloud that the agent belongs to
 * @param  {String}   networkName Name of the network ( twitter | linkedin | facebook | google )
 * @param  {String}   uid		 User ID
 * @param  {String}   feather	 Session based key to perform tasks on the users behalf
 * @param  {Object}   data		Status message
 * @param  {Function} callback	Respond with API data
 * 
 */
function socialShare( kloudId, networkName, uid, feather, data, callback )
	{
		var endPoint = getEndPoint( "post", "socialShare", [ networkName, uid, feather ] );
		postRequest( kloudId, endPoint, data, callback ); 
	}

function socialMediaAuth( kloudId, networkName, uid, feather, data, callback )
	{
		var endPoint = getEndPoint( "post", "socialAuth", [ networkName, uid, feather ] );
		postRequest( kloudId, endPoint, data, callback ); 
	}

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
	 * 				signinURL	: URL to direct end user to once their password has been successfully changed
	 * 				callbackURL	: String ( URL of the page that will be displayed after a request to reset password )
	 * 				callback:	: function ( JSON: request to reset password API response )
	 */

	"request": function (kloud, emailAddress, domain, signinURL, showUserRequestSentUrl, callback, developer) 
		{
			var emailTemplates = getEmailTemplates().password;
			
			var requestPasswordReset  = (emailTemplates.send.content + "").replace(/\{api_uri\}/g, "http://" + domain + "/api");
				requestPasswordReset  = requestPasswordReset.replace(/\{signinurl\}/g, signinURL);
			
			var passwordResetComplete = (emailTemplates.completed.content + "").replace(/\{api_uri\}/g, "http://" + domain + "/api");
				passwordResetComplete = passwordResetComplete.replace(/\{signinurl\}/g, signinURL);
			
			var data = {
				"emailAddress" : emailAddress,
				"confirmTemplate": requestPasswordReset,
				"successTemplate": passwordResetComplete,
				"callback": showUserRequestSentUrl,
				"domain": domain
			};

			var   postValue = JSON.stringify(data)
				, endPoint = getEndPoint( "post", "forgotPassword", [ ] );
				
			debug("password.request: " + kloud + " " + endPoint );
			
			console.log(endPoint);
			console.log(postValue);

			postRequest(kloud, endPoint, data, callback, developer);
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
var auth = function (kloud, socialNetworkName, uid, feather, data, callback) 
	{
		var endPoint = getEndPoint("post", "auth", [socialNetworkName, uid, feather]);
		
		debug("agent.auth: " + kloud + " " + endPoint );

		postRequest(kloud, endPoint, data, callback);
	};

var socialMediaSignin = function (kloud, socialNetworkName, data, callback) 
	{
		var endPoint = getEndPoint("post", "socialMediaSignin", [ socialNetworkName ]);
		
		debug("agent.auth: " + kloud + " " + endPoint );

		postRequest(kloud, endPoint, data, callback);
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
var getChannelList = function (kloud, uid, feather, callback) 
	{
		var endPoint = getEndPoint( "get", "channelList", [ uid, feather ] );
		
		debug("getChannelList: " + kloud + " " + endPoint );
		
		getRequest(kloud, endPoint, callback);
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
var getChannelPreview = function (kloud, numberToDisplay, uid, feather, callback)
	{
		var endPoint = getEndPoint( "get", "channelPreview", [ numberToDisplay, uid, feather ] );
		
		debug("getChannelPreview: " + kloud + " " + endPoint );
		
		getRequest(kloud, endPoint, callback);
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
var getChannel = function (kloud, uid, feather, channelId, callback, cacheme) 
	{
		var endPoint = getEndPoint( "get", "channel", [ channelId, uid, feather ] );
		
		debug("getChannel: " + kloud + " " + endPoint );
		
		getRequest(kloud, endPoint, callback);
	};

/*
 * Author:		Lee Sinclair
 * Updated:		12 Mar 2012
 * 
 * Method:		agent.channel.new
 * 					Updates channel details
 * 
 * Parameters:	
 * 				agentId	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				data	: 	Object ( updated channel details )
 * 				callback : 	function ( channel list )
 */
function newChannel(kloud, uid, feather, data, callback) 
	{
		var endPoint = getEndPoint( "post", "channel", [ uid, feather ] );
		
		debug("newChannel: " + kloud + " " + endPoint );
		
		var postJson = data;
		
		if (!data.name || (data.name + "").length <= 0 || !data.agentId || (data.agentId + "").length <= 0) 
			{
				response = templates["error"];
				response.message = "Invalid data for channel: newChannel";
				callback(response);
			}
		else 
			{
				postJson.id = null;		// Make channel ID null, to save as new channel
				postRequest(kloud, endPoint, postJson, callback);
			}
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
function updateChannel(kloud, uid, feather, data, callback) {
	var endPoint = getEndPoint( "post", "channel", [ uid, feather ] );
	
	debug("updateChannel: " + kloud + " " + endPoint );
	console.log("updateChannel date > ", data);
	
	var postJson = data;
	
	if (!data.name || (data.name + "").length <= 0 || !data.id || (data.id + "").length <= 0 || !data.agentId || (data.agentId + "").length <= 0) 
		{
			response = templates["error"];
			response.message = "Invalid data for channel: updateChannel";
			callback(response);
		}
	else
		{
			postRequest(kloud, endPoint, postJson, callback);
		}
}

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		agent.channel.clone
 * 					Clone a channel into a specific agent/user profile
 * 
 * Parameters:	
 * 				uid 	: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				channelId: 	String ( flockworks API channel ID of channel to clone )
 * 				callback : 	function ( channel list )
 */
function cloneChannel(kloud, uid, feather, channelId, callback) 
	{
		var endPoint = getEndPoint( "post", "cloneChannel", [ uid, feather ] );
		
		debug("cloneChannel: " + kloud + " " + endPoint );
		
		var postJson = {
			"agentId": uid,
			"cloneFrom": channelId
		};
		
		postRequest(kloud, endPoint, postJson, callback);
	}

/*
 * Author:		Lee Sinclair
 * Updated:		19 Mar 2012
 * 
 * Method:		agent.channel.vote
 * 					Vote on a specific content item within a channel
 * 
 * Parameters:	
 * 				uid		: 	String ( flockworks agent ID )
 * 				feather	: 	String ( session feather used to verifiy user request )
 * 				articleId : String ( flockworks content item ID )
 * 				channelId: 	String ( flockworks API channel ID of channel to clone )
 * 				callback : 	function ( channel list )
 * 
 * Vote JSON structure:
 * 				{
					id: articleId,
					url: article.url,
					title: article.title,
					text: article.text,
					feeds: [feedID],
					tags: article.tags,
					opinions: [{ "agent": uid, "channelId": channelID, "feedId": null, "rating": rating }]
				}
 */
function channelVote(kloud, uid, feather, articleObj, channelId, rating, callback) 
	{
		var endPoint = getEndPoint( "post", "channelVote", [ uid, feather ] );
		
		debug("channelVote: " + kloud + " " + endPoint );
		
		var vote = {
			"contentId": articleObj.id,
			"agent": uid,
			"channelId": channelId,
			"feedId": null,
			"rating": rating
		};
		
		postRequest(kloud, endPoint, vote, callback);
	}

/*
 * var xhrArgs = {
							url: deleteUrl,
							handleAs: "json",
							load: dojo.hitch( cm, function( data ) { this.removeChannelAction(data)} ),
							error: dojo.hitch( cm, function( data ) { this.removeChannelFail(data)} )
						}
						//Call the asynchronous xhrDelete
						var deferred = dojo.xhrDelete(xhrArgs);
 */
function deleteChannel(kloud, uid, feather, channelId, callback) 
	{
		console.log("flockworks.deleteChannel: " + kloud);
		var endPoint = getEndPoint( "delete", "channelDelete", [ channelId, uid, feather ] );
		
		console.log( endPoint );

		debug("deleteChannel: " + kloud + " " + endPoint );
		
		deleteRequest(kloud, endPoint, callback);
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
function updatePrivateFeeds(kloud, uid, feather, callback) 
	{
		var endPoint = getEndPoint( "get", "updatePrivateFeeds", [ uid, feather ] );
		
		debug("updatePrivateFeeds: " + kloud + " " + endPoint );
		
		getRequest(kloud, endPoint, callback);
	}

function contentSearch(kloud, uid, feather, query, callback) 
	{
		var endPoint = getEndPoint( "post", "contentSearch", [ uid, feather ] );
		
		debug("contentSearch: " + kloud + " " + endPoint );
		
		postRequest(kloud, endPoint, query, callback);
	}

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		service.status
 * 					Request service status
 */
function serviceStatus( callback )
	{
		var endPoint = getEndPoint( "get", "serviceStatus", [ ] );
		
		debug("serviceStatus: " + endPoint );
		
		getPlainRequest(endPoint, callback);
	}

/*
 * Author:	  Barry Earsman
 * Updated:	  29 Mar 2012
 * 
 * Method:	  feed.static.new
 *				Create a new Static feed
 * 
 * Parameters:   
 *			 uid	:	String ( flockworks agent ID )
 *			 feather   :	String ( session feather used to verifiy user request )
 *			 uri	 :	String ( unique identifier; does not have to be Uniform Resource Identifier )
 *			title   :   Title of feed
 *			 callback :	function ( feed )
 */
var newStaticFeed = function (kloud, uid, feather, uri, title, callback) 
	{
		var endPoint = getEndPoint("post", "newFeed", [uid, feather]);
		
		debug("newStaticFeed: " + kloud + " " + endPoint );

		var postJson = {
			"type": "static",
			"uri": uri,
			"agentId": uid,
			"kloudId": kloud,
			"owner": uid,
			"title": title
		};

		postRequest(kloud, endPoint, postJson, callback);
   };

/*
 * Author:	  Barry Earsman
 * Updated:	  29 Mar 2012
 * 
 * Method:	  feed.rss.new
 *				Create a new RSS feed
 * 
 *			 	uid	:	String ( flockworks agent ID )
 *			 	feather   :	String ( session feather used to verifiy user request )
 *			 	url	 :	String ( Uniform Resource Locator of RSS feed )
 *				title   :   Title of feed
 *			 	callback :	function ( feed )
 */
var newRssFeed = function (kloud, uid, feather, url, title, callback) 
	{
		var endPoint = getEndPoint("post", "newFeed", [uid, feather]);
		
		debug("newRssFeed: " + kloud + " " + endPoint );

		var postJson = {
			"type": "rss",
			"uri": url,
			"agentId": uid,
			"kloudId": kloud,
			"owner": uid,
			"title": title
		};

		postRequest(kloud, endPoint, postJson, callback);
	}

var listFeed = function( kloud, uid, feather, feedId, callback )
	{
		var endPoint = getEndPoint("get", "listFeed", [ feedId, uid, feather]);
		
		debug("listFeed: " + kloud + " " + endPoint );

		getRequest( kloud, endPoint, callback );
	}

function getToken ( kloudId, uid, feather, data, callback, developer )
	{
		var endPoint = getEndPoint( "post", "getToken", [ uid, feather ] );
		
		debug("getToken: " + kloud + " " + endPoint );
		
		postRequest( kloudId, endPoint, data, callback, developer);
	}
	
function getPaypalRecord ( skypeId, callback )
	{
		var endPoint = "http://paypal.kudosknowledge.com/kcs/check/skypeId/" + skypeId;
		
		debug("getPaypalRecord: " + skypeId + " " + endPoint );
		
		getPlainRequest( endPoint, callback );
	}
	
function getTermStats ( kloud, data, callback, developer )
	{
		console.log("getTermsStats");
		var endPoint = getEndPoint( "get", "termStats", [] );

		console.log("endPoint", endPoint);

		// kloud, endPoint, data, callback
		postRequest( kloud, endPoint, data, callback, developer );
	}

exports.agent = {
	"signUp"		: signUp,
	"signUpQuick"	: signUpQuick,
	"update"		: updateAccount,
	"auth"			: auth,
	"signIn"		: signIn,
	"socialMediaSignin": socialMediaSignin,
	"getUserProfile": getUserProfile,
	"getFromEmail"	: getFromEmail,
	"delete" 		: deleteProfile,
	"password"		: passwordFunctions,
	"token"			: getToken,
	"paypal":
		{
			"record": getPaypalRecord
		},
	"channel": 
		{
			"list"			: getChannelList,
			"preview"		: getChannelPreview,
			"content"		: getChannel,
			"new"			: newChannel,
			"del" 			: deleteChannel,
			"update"		: updateChannel,
			"clone"			: cloneChannel,
			"delete"		: deleteChannel,
			"vote"			: channelVote
		},
	"getChannelList"	: getChannelList,
	"getChannelPreview"	: getChannelPreview,
	"getChannel"		: getChannel,
	"updateChannel"		: updateChannel,
	"cloneChannel"		: cloneChannel,
	"updatePrivateFeeds": updatePrivateFeeds,
	"search"			: contentSearch,
	"network"  			: 
		{ 
			"disconnect": disconnectNetwork,
			"auth": socialMediaAuth,
			"share": socialShare
		}
}

exports.service = {
	"status": serviceStatus
}

exports.app = {
	"signin": appSignIn,
	"getKloud": getKloud,
	"newKloud": newKloud,
	"updateKloud": updateKloud,
	"appendAllowedKloud": appendAllowedKloud,
	"feeds": 
		{
			"getPopular": getPopularFeeds,
			"getExpired": getExpiredFeeds
		}
}

exports.term = {
	"stats": getTermStats
}

exports.postTo = function (kloud, postNetworkName, uid, feather, post, callback) 
	{
		var title = post.title;
		var teaser = post.teaser;
		var content = post.content;
		var url = (post.url?post.url:'');
		var feedID = (post.feedId?post.feedId:'null');
		
		var endPoint = getEndPoint( "post", "publish", [ feedId, uid, feather ] );
		
		debug("postTo: " + kloud + " " + endPoint );
		
		switch( postNetworkName.toLowerCase() ) 
			{
				case "twitter":
					endPoint	= getEndPoint( "post", "socialShare", [ postNetworkName, uid, feather ] );
					message		= {
									'text': teaser + ' ' + url + ' via @enliten_'
								  };
					break;
				case "facebook":
				case "linkedin":
				case "googleplus":
					endPoint	= getEndPoint( "post", "socialShare", [ postNetworkName, uid, feather ] );
					message		= {
									'text': teaser + ' ' + url
								  };
					break;
				case "enliten":
					endPoint	= getEndPoint( "post", "publish", [ feedId, uid, feather ] ); /* need channel ID */
				default:
					endPoint	= getEndPoint( "post", "socialShare", [ postNetworkName, uid, feather ] );
					message		= {
									'text': teaser + ' ' + url
								  };
					break;
			}
	
		postRequest(kloud, endPoint, message, callback);
	};

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		feed.postToFeed
 * 					Post new items to feed 
 * 
 * Parameters:
 *			 feedUpdateDetails   :	Object ( see notes below )
 *			 callback :	function ( upadted feeedDetails )
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

function postToFeed(kloud, feedUpdateDetails, callback) 
	{
		// feedItems
		debug("kloud: " + kloud );
		
		if (!feedUpdateDetails || !feedUpdateDetails.items)
			{
				callback({ "error": true, "message": "Invalid feed items" });
				return;
			}
	
		var items = feedUpdateDetails.items;
		
		items.forEach(function (article, index) {
			if (article.title && (article.title + "").length > 0 && article.link) 
				{
					if (article.title) 
						{
							/* Clean description of any invalid characters */
							article.title = article.title.replace(/[^A-Za-z 0-9 \.,\?'""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g,'');
						}
								
					if (article.description) 
						{
							/* Remove ads where possible */
							article.description = functions.removeAds(article.description);
							/* Clean description of any invalid characters */
							article.description = article.description.replace(/[^A-Za-z 0-9 \.,\?'""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g,'');
							/* Create plain text property */
							article.plainText = article.description.replace(/<[^>]+>/gi,"");
						}
								
					if (article.pubDate) 
						{
							/* API expects "datePublish" property */
							article.datePublished = article.pubDate;
						}
							
					if (article.link) 
						{
							/* Clean link */
							article.link = article.link.replace(/\/feed\/atom\/$/,"/");
							/* API expects "url" property */
							article.url = article.link.replace(/\/feed\/atom\/$/,"/");
						}
								
					if (!article.type) 
						{
							article.type = "rss";
						}
				}
				
		});
	
		postNewArticles(kloud, feedUpdateDetails, callback);
	}

/*
 * Author:		Lee Sinclair
 * Updated:		8 Mar 2012
 * 
 * Method:		feed.postToFeed
 * 					Post new items to feed 
 * 
 * Parameters:
 *			 feedUpdateDetails   :	Object ( see notes below )
 *			 callback :	function ( upadted feeedDetails )
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

 //insertIntoFeed
function insertIntoFeed(kloud, uid, feather, feedUpdateDetails, callback, developer, additionalHeaders ) 
	{
		
		var endPoint = getEndPoint( "post", "insertIntoFeed", [ uid, feather ] );
		
		debug("insertIntoFeed: " + kloud + " " + endPoint );
		
		// feedItems
		if (!feedUpdateDetails)
			{
				callback({ "error": true, "message": "Invalid feed items" });
				return;
			}

		var postValue = JSON.stringify(feedUpdateDetails);

		postRequest(kloud, endPoint, feedUpdateDetails, callback, null, additionalHeaders);
	}

function importToFeed(kloud, uid, feather, feedUpdateDetails, callback, developer, additionalHeaders) 
	{
		var endPoint = getEndPoint( "post", "importFeedItems", [ uid, feather ] );
		
		debug("insertIntoFeed: " + kloud + " " + endPoint );
		
		// feedItems
		if (!feedUpdateDetails || !feedUpdateDetails.items)
			{
				callback({ "error": true, "message": "Invalid feed items" });
				return;
			}

		var postValue = JSON.stringify(feedUpdateDetails);

		postRequest(kloud, endPoint, feedUpdateDetails, callback, null, additionalHeaders);
	}


/** 
 * Post new articles data to back office server
 *	this function is only called if the downloaded feed has items not already
 *	processed in previous processing cycles
 * 
 *	@since			0.1
 *	@version		0.3
 *	@author			Lee Sinclair
 * 	@method
 *  @calledFrom		getFeed()
 * 	@param			{ Object } feed object passed from getFeed function, object contains .uri
 *  @param			{ Array }  array of new posts (JSON representation of RSS. see parseRSS )
 * 	@namespace		.
 * 	@id */
function postNewArticles(kloud, feedUpdateDetails, callback) 
	{
		
		debug("postNewArticles: " + kloud );
		
		var postValue = JSON.stringify(feedUpdateDetails);
		var id = feedUpdateDetails.id;
		console.log("Posting... \"" + feedUpdateDetails.title + "\"");
		var endPoint = getEndPoint( "post", "feedItems", [ id ] );
		
		postRequest(kloud, endPoint, feedUpdateDetails, callback);
	}


exports.feed = {
	"new": 
		{ 
			"rss" : newRssFeed,
			"static": newStaticFeed
		},
	"list": listFeed,
	"post":  postToFeed,
	"insert": insertIntoFeed,
	"import": importToFeed,
	"updatePrivate": updatePrivateFeeds
};

function rateItem( kloud, uid, feather, contentItemDetails, callback )
	{
		var endPoint = getEndPoint( "post", "rateItem", [ uid, feather ] );
		postRequest( kloud, endPoint, contentItemDetails, callback );
	}

exports.item = {
	"rate": rateItem
}

/*
* { "text": "my text" }
 */
function relatedContentItems( kloud, textJson, callback )
	{
		//"contentLikeContent":"content/like/content"
		var endPoint = getEndPoint( "post", "contentLikeContent", [ ] );
		postRequest( kloud, endPoint, textJson, callback );
	}

// flockworks.content.likeContent( "images", { "text": "hello" }. function( response ) {  } )
exports.content = {
	"likeContent": relatedContentItems
}

function getEndPoint( type, purpose, urlVars ) 
	{
		var endPoint = fw.uri + ( fw.endpoint[type] )[purpose];
		for (var i=0;i<urlVars.length;i++) {
			endPoint = endPoint.replace(/{.+?}/, urlVars[i] );
		}
		
		endPoint = endPoint.replace("/api//api/", "/api/");
		
		return endPoint;
	}

function getHeaders(kloud, method, endPoint, body, developer, additionalHeaders) 
	{
		var apiKey = fw.apiKey;
		var secret = fw.secret;
		
		if(developer && developer.apiKey)
			{
				apiKey = developer.apiKey;
				secret = developer.secret;
			}

		var shahmac = crypto.createHmac('sha1', secret),
			timeStamp = Math.floor(new Date().getTime() / 1000) + 60;
		var plainSignature = method.toUpperCase() + endPoint + kloud + /* body + */ timeStamp;
		
		var signature = shahmac.update(plainSignature);
		var digest = shahmac.digest(encoding="hex");
		
		var headers = {
							"type": method.toUpperCase(),
							"apiKey": apiKey, 
							"signature": digest,
							"timeStamp": timeStamp,
							"authVersion": 1.1
						}
		
		if(kloud && kloud!="")
			{
				headers = {
							"type": method.toUpperCase(),
							"apiKey": apiKey, 
							"signature": digest,
							"kloudId": kloud,
							"timeStamp": timeStamp,
							"authVersion": 1.1
						}
			}
			
		if(additionalHeaders && additionalHeaders.length>0)
			{
				for(i=0;i<additionalHeaders.length;i++)
					{
						if(additionalHeaders[i].name)
							{
								var name = additionalHeaders[i].name;
								var value = additionalHeaders[i].value;
								headers[name] = value; 
							}
						
					}
			}
			
	   // console.log("headers -> ", method, endPoint);
		//console.log(headers);
		  
		return headers;
	}

function getRequest(kloud, endPoint, callback, developer)
	{
		var headers = getHeaders(kloud, "GET", endPoint, "", developer);

		//console.log("headers");
		//console.log(headers);

		rest.get(endPoint, {
				'headers': headers
		}).on('complete', function (apiResponse, status) {

			if (status && status.statusCode && status.statusCode >= 200 && status.statusCode <= 202) 
				{
					try 
						{
							response = JSON.parse(apiResponse);
						}
					catch(e) 
						{
							response = apiResponse;
						}

					callback(response);
				}
			else 
				{
					response = templates["error"];
					response.message = "Invalid data for get user profile";
					callback(response);
				}
		});
	}

function getPlainRequest (endPoint, callback)
	{
		rest.get(endPoint).on('complete', function (apiResponse, status) {
			if (status && status.statusCode && status.statusCode >= 200 && status.statusCode <= 202) 
				{
					try 
						{
							response = JSON.parse(apiResponse);
						}
					catch(e) 
						{
							response = apiResponse;
						}
						
					callback(response);
				}
			else 
				{
					response = templates["error"];
					response.message = "Invalid data for get user profile";
					callback(response);
				}
		});
	}

function postRequest(kloud, endPoint, data, callback, developer, additionalHeaders) 
	{
		var postValue = JSON.stringify(data);
		//console.log("post value");
		//console.log(postValue);
		var headers = getHeaders(kloud, "POST", endPoint, postValue, developer, additionalHeaders);
	
		//console.log("headers: -> " + endPoint);
		//console.log(headers);
	
		rest.post(endPoint, {
				'encoding': 'utf8',
				'headers': headers,
				'data': postValue
		}).on('complete', function (apiResponse, status) {
			if (status && status.statusCode && status.statusCode >= 200 && status.statusCode <= 202) 
				{
					try 
						{
							response = JSON.parse(apiResponse);
						} 
					catch(e) 
						{
							response = apiResponse;
						}
						callback(response);
				}
			else 
				{
					response = templates["error"];
					response.message = "Invalid data: " + JSON.stringify(apiResponse);
					callback(response);
				}
			}
		
		);
	}

function plainPostRequest(kloud, endPoint, data, callback, developer, additionalHeaders) 
	{
		console.log(endPoint);
		var postValue = JSON.stringify(data);
	
		rest.post(endPoint, {
				'data': postValue
		}).on('complete', function (apiResponse, status) {
			if (status && status.statusCode && status.statusCode >= 200 && status.statusCode <= 202) 
				{
					try 
						{
							response = JSON.parse(apiResponse);
						} 
					catch(e) 
						{
							response = apiResponse;
						}
						callback(response);
				}
			else 
				{
					response = templates["error"];
					response.message = "Invalid data: " + JSON.stringify(apiResponse);
					callback(response);
				}
			}
		
		);
	}

function putRequest(kloud, endPoint, data, callback, developer) 
	{
		var postValue = JSON.stringify(data);
		var headers = getHeaders(kloud, "PUT", endPoint, postValue, developer);
		
		rest.put(endPoint, {
				'headers': headers,
				'data': postValue
		}).on('complete', function (apiResponse, status) {
			if (status && status.statusCode && status.statusCode >= 200 && status.statusCode <= 202) 
				{
					try 
						{
							response = JSON.parse(apiResponse);
						} 
					catch(e) 
						{
							response = apiResponse;
						}
						
						callback(response);
		   		}
		   	else 
		   		{
					console.log(apiResponse)
					response = templates["error"];
					response.message = "Invalid data: " + JSON.stringify(apiResponse);
					callback(response);
				}
			}
		
		);
	}

function deleteRequest(kloud, endPoint, callback) 
	{
		var headers = getHeaders(kloud, "DELETE", endPoint, "");
		
		rest.del(endPoint, {
				'headers': headers
		}).on('complete', function (apiResponse, status) {
			if (status && status.statusCode && status.statusCode >= 200 && status.statusCode <= 202) 
				{
					try 
						{
							response = JSON.parse(apiResponse);
						}
					catch(e) 
						{
							response = apiResponse;
						}
						
					callback(response);
				}
			else
				{
					response = templates["error"];
					response.message = "Invalid data for get user profile";
					callback(response);
				}
		});
	}


function debug( message ) {
	if(fw.debug)
		console.log( "Debug: " + message );
}
