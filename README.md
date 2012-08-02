# Flockworks node.js API wrapper

A node.js wrapper that can be used to access the flockworks API

## What is the flockworks API?

Flockworks is a powerful artificial intelligence technology that is able to analyse written language to extract deep relationships and meaning. It is used by the content discovery service Enliten, (which has its own API).

Vast quantities of English language from public sources (such as the entire English Wikipedia) were statistically analysed, producing a detailed database which can be used to assign any word, sentence, or document a position in a many-dimensional “Semantic Space”.

Semantic Space has the extraordinary property that things that are close by each other in that space will also be close in meaning.  Thus it is possible to find documents that are about similar topics by looking at an area within Semantic Space, in much the same way that books kept together in a public library will be related.

The Flockworks API provides RESTful methods for accessing your own Semantic Space; for storing objects within it, querying it, and for creating layers of category and relevance by overlaying tags and ratings. This enables developers to create software that clusters, auto-categorises, auto-rates, auto-tags, performs semantic searches, and generally brings data alive.

If you’re familiar with AJAX and JSON, it’s incredibly easy to use. We’ll have you cruising through Semantic Space in no time!

## Installation
	npm install https://github.com/leejsinclair/Flockworks-node-wrapper.git

## Example
	flockworks = require("flockworks-node-wrapper");
	
	var developerDetails = { "apiKey": "MY API KEY", "secret": "MY API SECRET" };
	flockworks.setAPIAccess( developerDetails );

## Methods
 			agent.
 				signUp				:	Sets the domain, that this module will use to access the flockworks API
 				signIn				:	Sign in using email and password
 				socialMediaSignin	:	Sign in using twitter, facebook, linkedin or google
 				update				:	Update user profile
 				auth				:	Authenticate using: twitter | facebook | linkedin | google
 				getUserProfile		:	Get user details as JSON
 				getFromEmail		:	Request user profile using email address only
 				delete				:	Delete profile
 				token				:	Get application token (which is used by an application to signin on their behalf)
 				search				:	Search content on the users behalf (limits search results to the kloud the user has been allocated)
 				password.
 					reset			:	Request password reset
 				network.
 					connect			:	Connect user to their social media account
 					auth			:	Authenticate user (sign in) using their social media account
 					share			:	Share content on the users social media account
 	
 				channel.
 					list			:	Get list of channels owned by user
 					preview			:	Get privew of articles across all channels owned by agent/user
 					content			:	Get channel content
 					new				:	Save new channel
 					del				:	Delete channel
 					update			:	Update channel details
 					clone			:	Clone an existing channel in to a specific users profile
 					vote			:   Vote on a specific content item
 	
 				updatePrivateFeeds	:	Request update of agent/users private feeds (e.g. twitter/facebook )
 	
 			feed.
 				new.				:	Create new feed
 					rss				:	Create new RSS feed
 					static			:	Create new static feed
 				meta				:	Request feed meta data
 				list				:	Request full feeed content
 				post				:	Post new content to a specific feed
 				insert				:	Insert content item into feed
 				import				:	Import multiple content items into feed
 				updatePrivate		:	Request private feed updates on users behalf (this upadates twitter, facebook feeds)
 	
 			app.
 				signin				:	Sign in using application auth details, in order to act on behalf of a user

loadEmailTemplates
------------------

###function loadEmailTemplates()###

Load Email templates from file

####Returns####

*Object* newPassword HTML template, successPassword HTML template
* * *


getEmailTemplates
-----------------

###function getEmailTemplates()###

Return email templates previously loaded from file

####Returns####

*Object* newPassword HTML template, successPassword HTML template
* * *


setAPIAccess
------------

###exports.setAPIAccess = function( options )###

Set developer key and secret to use the API
####Parameters####

* options	key *Object* pairs: apkKey {String}, secret: {String}
* * *


setAPIDomain
------------

###function setAPIDomain( serverDomain )###

Sets the domain, that this module will use to access the flockworks API

####Parameters####

* serverDomain *String* : String ( URL: e.g. http://flockworks.com/ )


####Returns####

*Object* udated flockworks access details
* * *


setDebug
--------

###function setDebug( debugMode )###

Set debug mode on or off

####Parameters####

* debugMode *Boolean* true to turn debug mode on


####Returns####

*Boolean* Debug mode (true/false)
* * *


signUp
------

###var signUp = function (kloud, data, callback)###

Sign use up to a specific kloud
					e.g.
						{
							"firstName": "John"
							,"lastName": "Smith"
							,"screenName": "John Smith"
							,"email": "john.smith@gmail.com"
							,"password": "mypassword"
							,"callbackURL": "http://mywebsite.com/signupComplete"
						}

####Parameters####

* kloudId, *String* kloud scope that the user belongs
* data *Object* User details
* callback *Function* function to callback with API response
* * *


updateAccount
-------------

###var updateAccount = function (kloud, uid, feather, data, callback)###

Update an existing user profile
						e.g.
						{
							"firstName": "John"
							,"lastName": "Smith"
							,"screenName": "John Smith"
							,"email": "john.smith@gmail.com"
							,"password": "mypassword"
							,"callbackURL": "http://mywebsite.com/signupComplete"
						}

####Parameters####

* kloud scope that the user belongs
* - API identifier for agent
* - String ( Session access string )
* kloud scope that the user belongs
* User details
* function to callback with API response
* * *


signUpQuick
-----------

###var signUpQuick = function (kloud, data, callback)###

Deprecated do no use

####Parameters####

* kloud *String* Kloud, scope that the user belongs to
* data *Object* User details
* callback *Function* Function to callback with API response
* * *


signIn
------

###var signIn = function (kloud, email, password, callback)###

Sign in to get session feather

####Parameters####

* kloud *String* Kloud, scope within which the user profile exists
* email *String* Email address of user
* password *String* Password provided by user to sign in
* callback *Function* Function to callback with APi response
* * *


appSignIn
---------

###var appSignIn = function (kloud, uid, token, callback)###

Sign in on the user behalf using a pre-approved application token

####Parameters####

* kloud *String* KloudId,
* uid *String* User ID of the user to sign in on behalf of
* token *String* Token previously attained and approaved by the user
* callback *Function* Function to callback with API response
* * *


getKloud
--------

###var getKloud = function( kloudId, callback, developer )###

Request Kloud details, required developer user id and feather

####Parameters####

* kloudId *String* Kloud Id, kloud record to request
* callback *Function* Function to callback with APi response
* developer *Object* Developer uid and feather
* * *


getPopularFeeds
---------------

###var getPopularFeeds = function( kloudId, callback, administrator )###

Request a list of popular feeds

####Parameters####

* kloudId *String* KloudId, scope within which to request popular feeds
* callback *Function* Function to cllback with PI response
* administrator *Object* Adminstrator api key and secret
* * *


getExpiredFeeds
---------------

###var getExpiredFeeds = function( kloudId, seconds, callback, administrator )###

Request list of expired feeds (expiring in n minutes)

####Parameters####

* kloudId *String* KloudId, scope within which to request expired feeds
* seconds *Integer* Seconds from now that the feeds(s) will expire
* callback *Function* Function to callback with API response
* administrator *Object* Adminstrator api key and secret
* * *


newKloud
--------

###var newKloud = function( adminAgent, kloudDetails, callback )###

Create new kloud

####Parameters####

* adminAgent *Object* [description]
* kloudDetails *Object* [description]
* callback *Function* [description]

* * *


updateKloud
-----------

###var updateKloud = function( kloudId, data, callback, developer )###

Update a kloud record

####Parameters####

* kloudId *String* [description]
* data *Object* [description]
* callback *Function* [description]
* developer *Object* [description]

* * *


appendAllowedKloud
------------------

###var appendAllowedKloud = function( adminAgent, developerDetails, kloudName, callback )###

Append allow kloud to developer record

####Parameters####

* adminAgent *Object* [description]
* developerDetails *Object* [description]
* kloudName *String* [description]
* callback *Function* [description]

* * *


getUserProfile
--------------

###var getUserProfile = function (kloud, uid, feather, callback)###

Author:		Lee Sinclair
Updated:		8 Mar 2012

Method:		getUserProfile
					Returns agent/user profile

####Parameters####

* kloudId, kloud scope that the user belongs
* uid - API identifier for agent
* feather - String ( Session access string )
* callback - function ( JSON: agentProfile or NULL )

* * *


###getFromEmail = function( emailAddress, callback, developer )###

Request user profile using email address

####Parameters####

* emailAddress *String* [description]
* callback *Function* [description]
* developer *Object* [description]

* * *


deleteProfile
-------------

###var deleteProfile = function (kloud, uid, feather, callback)###

Delete user profile

####Parameters####

* kloud *String* [description]
* uid *String* [description]
* feather *String* [description]
* callback *Function* [description]

* * *


disconnectNetwork
-----------------

###function disconnectNetwork( kloudId, networkName, uid, feather, callback )###

Disconnect social media account from users profile

####Parameters####

* kloudId	 *String* Name of the kloud that the agent belongs to
* networkName *String* Name of the network ( twitter | linkedin | facebook | google )
* uid		 *String* User ID
* feather	 *String* Session based key to perform tasks on the users behalf
* callback	Respond *Function* with API data

* * *


socialShare
-----------

###function socialShare( kloudId, networkName, uid, feather, data, callback )###

Share status messages on different social media accounts

####Parameters####

* kloudId	 *String* Name of the kloud that the agent belongs to
* networkName *String* Name of the network ( twitter | linkedin | facebook | google )
* uid		 *String* User ID
* feather	 *String* Session based key to perform tasks on the users behalf
* data		Status *Object* message
* callback	Respond *Function* with API data

* * *


socialMediaAuth
---------------

###function socialMediaAuth( kloudId, networkName, uid, feather, data, callback )###

[socialMediaAuth description]

####Parameters####

* kloudId *String* [description]
* networkName *String* [description]
* uid *String* [description]
* feather *String* [description]
* data *Object* [description]
* callback *Function* [description]

* * *


###"request": function (kloud, emailAddress, domain, signinURL, showUserRequestSentUrl, callback, developer)###

Author:		Lee Sinclair
Updated:		8 Mar 2012

Method:		password.request
					Request a new password

Parameters:	emailAddress: String ( email address that the agent/user registered with )
				signinURL	: URL to direct end user to once their password has been successfully changed
				callbackURL	: String ( URL of the page that will be displayed after a request to reset password )
				callback:	: function ( JSON: request to reset password API response )
* * *


deleteChannel
-------------

###function deleteChannel(kloud, uid, feather, channelId, callback)###

Delete a users channel

####Parameters####

* kloud *String* KloudId to execute search against
* uid *String* User ID to search on behalf of
* feather *String* Session identifier for agent to search on behalf of
* channelId *String* Database ID of the channel
* callback *Function* Callback function sent API response once the request is completed
* * *


listFeedPage
------------

###function listFeedPage ( kloud, uid, feather, details, callback )###

Request feed content by page (each page is determined by a page number and page size)

####Parameters####

* kloud *String* Kloud from which feed content will be retrieved
* uid *String* User ID through which content will be requested on behalf on
* feather *String* Session ID that will be used to request content
* details *Object* feedId, pageNumber and pageSize of the feed content
* callback *Function* function to call back once content is retrieved

* * *


feedMeta
--------

###function feedMeta( kloudId, uid, feather, details, callback )###

Request feed metadata, and content item details if required

####Parameters####

* kloudId *String* Kloud within whic hthe feed exists
* uid *String* User ID that the request will be made on behalf of
* feather *String* Session id for the user for which this request will be made
* details *Object* feedId and contentId
* callback *Function* Call thes when finished

* * *


getToken
--------

###function getToken ( kloudId, uid, feather, data, callback, developer )###

Tokens allow application to login as the user without a UID and feather

####Parameters####

* kloudId *String* Kloud for which access is being requested
* uid *String* User ID that the token will be request on behalf of
* feather *String* Session id for the user for which this request will be made
* data *Object* Contains the application name
* callback *Function* [description]
* developer *Object* Developer key and secret of the application used to verify the application
* * *


postNewArticles
---------------

###function postNewArticles(kloud, feedUpdateDetails, callback)###

Post new articles data to back office server
	this function is only called if the downloaded feed has items not already
	processed in previous processing cycles

####Parameters####

* feed object passed from getFeed function, object contains .uri
* array of new posts (JSON representation of RSS. see parseRSS ).
* * *


rateItem
--------

###function rateItem( kloud, uid, feather, contentItemDetails, callback )###

Rate a content item

####Parameters####

* kloud *String* Kloud, sccope within which the vote will be cast
* uid *String* User ID which the vote will be coast on behalf
* feather *String* Session ID of the user that the vote will be cst on behalf
* contentItemDetails *Object* Vote details
* callback *Function* Function to callback with API response
* * *


relatedContentItems
-------------------

###function relatedContentItems( kloud, textJson, callback )###

Get related content items for provided text

####Parameters####

* kloud *String* Kloud, scope within which content will be searched
* textJson *Object* JSON containing text e.g. { "text": "my text" }
* callback *Function* Function to callback with APi response
* * *


getEndPoint
-----------

###function getEndPoint( type, purpose, urlVars )###

Utilitiy function for looking up API endpoints for specific functions

####Parameters####

* type *String* GET|POST|PUT|DELETE
* purpose *String* Lookup string, this is used to lookup the url template see fw.endPoint...
* urlVars *Array* List of string that will be used to replace placeholders in the endPoint URL template


####Returns####

*String* API endPoint with replacements made
* * *


