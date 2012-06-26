var should = require('should');
var kloudId = 'baz-zer';
var adminDeveloper = { "apiKey": "4f72af1d09d0dd1e6f423b94", "secret": "4f619b41can42d4b200b154d" };
var developerDetails = {
	"api": { "apiKey": "4f74f8db1cb1c0cd4a105f7d", "secret": "6ad4db7bbc9d465e9f39ab214ef1a135" },
	"name": "Kudos Chat Search Developer",
	"email": "hello@kudosknowledge.com"
}
var flockworks = require("./index.js");
	flockworks.setAPIDomain("http://127.0.0.1:8183");
	// flockworks.setAPIAccess( { "apiKey": "4f74f8db1cb1c0cd4a105f7d", "secret": "6ad4db7bbc9d465e9f39ab214ef1a135" } );
	flockworks.setAPIAccess( developerDetails.api );
	
/* Agent template for creating and updating agent data */
var agent = {
	  "firstName": "test"
	, "lastName": "signup"
	, "email": randomUUID() + "@mailinator.com"
	, "password": "password"
	, "screenName": "Test user"
	, "feather": ""
	, "id": ""
	, "kloudId": kloudId
}

/* Feed template for creating and updating feed data */
var feed = {
	  "uri": randomUUID()
	, "url": randomUUID()
	, "title": "Feed " + randomUUID()
	, "kloudId": kloudId
}

/* Channel template for creating and updating channel data */
var channel = {
	  "name": "New channel"
	, "id": null
	, "agentId": null
	, "feeds": []
	, "keywords": [ "economy" ]
	, "keywordImportance": 0.85
	, "kloudId": kloudId
}

/* Article that will be voted on */
var article = null;
var agentChannelList = [];

var agentProfile;
serviceStatus();

/* Test method
	0. Service status
	1. sign up
	2. sign in
	3. Create channel
	4. Update channel
	5. Get list of channels
	6. Get channel content
	7. Get channel preview
	8. Vote on article
	
   Tear down
   	1. Delete channel

 */

function serviceStatus() {
	console.log("Service status: ");
	flockworks.service.status( function(serviceStatus)
		{
			console.log( "Status complete, service status" );
			should.exist(serviceStatus);
			console.log(serviceStatus);
			serviceStatus.services.should.be.an.instanceof(Array);
			newKloud();
		}
	);
}

function newKloud() {
	console.log("");
	console.log("New kloud: " + kloudId);
	var kloud = {
		"id": kloudId,
		"name": agent.screenName,
		"email": agent.email,
		"database": ""		
	};
	
	flockworks.app.newKloud( adminDeveloper, kloud, function( newKloudResponse )
		{
			console.log( "new Kloud complete, checking response" );
			console.log( newKloudResponse );
			should.exist(newKloudResponse);
			newKloudResponse.dbName.should.be.a('string');
			newKloudResponse.emailAddress.should.be.a('string');
			newKloudResponse.name.should.be.a('string');
			
			// Add kloud to allowed klouds for developer
			//adminAgent, developerDetails, kloudName, callback
			flockworks.app.appendAllowedKloud( adminDeveloper, developerDetails, kloudId, function( apiResponse ) {
				console.log(apiResponse);
			} );
			
			//signup();
		}
	);
}

function signup() {
	console.log("");
	console.log("Sign up: " + agent.email);
	flockworks.agent.signUp( kloudId, agent, function(profile)
		{
			console.log( "Sign up complete, checking profile" );
			checkProfile("sign up", profile);
			signin();
		}
	);
}

function signin() {
	console.log("");
	console.log("Sign in: " + agent.email + " " + agent.password);
	flockworks.agent.signIn( kloudId, agent.email, agent.password, function(profile)
		{
			console.log( "Sign in complete, checking profile" );
			checkProfile("sign in", profile);
			agent.feather = profile.feather;
			agent.id = profile.id;
			channel.agentId = agent.id;
			
			update();
		}
	);
}

function update() {
	agent.lastName = "User";
	console.log();
	console.log("Updating profile: " + agent.id + " " + agent.feather);
	flockworks.agent.update( kloudId, agent.id, agent.feather, agent, function(profile)
		{
			console.log( "Update complete, checking profile" );
			checkPartialProfile("update profile", profile);
			
			console.log( "Checking update: profile.lastName = " + profile.lastName );
			profile.lastName.should.eql("User");
			
			//newFeed();
			newChannel();
			
		}
	);
}

function newFeed() {
	console.log( "" );
	console.log( "Add new feed: " + agent.id + " " + agent.feather );
	flockworks.feed.newStatic( kloudId, agent.id, agent.feather, feed.uri, feed.title, function( feedItem )
		{
			console.log( "Added feed, checking..." );
			feedItem.id.should.be.an.instanceof(String);
			
			newChannel();
		}
	);
}

function newChannel() {
	console.log( "" );
	console.log( "New channel: ");
	flockworks.agent.channel["new"]( kloudId, agent.id, agent.feather, channel, function( channelProfile )
		{
			console.log( "Update complete, checking channel" );
			checkChannel("new channel", channelProfile);
			
			channel.id = channelProfile.id;
			
			updateChannel();
		}
	);
}

function updateChannel() {
	console.log( "" );
	console.log( "Update channel: ");
	channel.name = "Take 2";
	flockworks.agent.channel["update"]( kloudId, agent.id, agent.feather, channel, function( channelProfile )
		{
			console.log( "Update complete, checking channel" );
			checkChannel("update channel", channelProfile);
			
			channel.id = channelProfile.id;
			getChannelList();
		}
	);
}

function getChannelList() {
	console.log( "" );
	console.log( "Retrieve channel list: " + agent.id + " " + agent.feather );
	flockworks.agent.channel["list"]( kloudId, agent.id, agent.feather, function( channelList )
		{
			console.log( "Got channel list, checking..." );
			
			channelList.items.should.be.an.instanceof(Array);
			
			var channelProfile = channelList.items[0];
			checkChannel("Channel details", channelProfile);
			
			agentChannelList = channelList.items;
			
			getChannelContent();

		}
	);
}

function getChannelContent() {
	console.log( " " );
	console.log( "Retrieve channel content: " + agent.id + " " + agent.feather );
	flockworks.agent.channel["content"]( kloudId, agent.id, agent.feather, channel.id, function( channelContent )
		{
			console.log( "Update complete, checking content" );
			channelContent.items.should.be.an.instanceof(Array);
			console.log("channelContent.items");
			console.log(channelContent.items);
			
			article = channelContent.items[0];
			
			getChannelPreview();
		}
	);
}

function getChannelPreview() {
	console.log( " " );
	console.log( "Retrieve channel preview: " + agent.id + " " + agent.feather );
	flockworks.agent.channel["preview"]( kloudId, 5, agent.id, agent.feather, function( channelPreview )
		{
			console.log( "Preview complete, checking response" );
			channelPreview.items.should.be.an.instanceof(Array);
			//channelVote();
			updatePrivateFeeds();
		}
	);
}


function channelVote() {
	console.log( " " );
	console.log( "Channel vote: " );
	//console.log( article );
	flockworks.agent.channel["vote"]( kloudId, agent.id, agent.feather, article, channel.id, 1, function( channelVote )
		{
			console.log( "Vote complete, checking response" );
			console.log( channelVote );
			
			updatePrivateFeeds();
		}
	);
}

function updatePrivateFeeds() {
	console.log( " " );
	console.log( "Update private feeds: " );
	flockworks.agent.updatePrivateFeeds( kloudId, agent.id, agent.feather, function( updateResponse )
		{
			console.log( "Update private feeds complete, checking response" );
			
			updateResponse.ownedFeeds.should.be.an.instanceof(Array);
			checkPartialProfile("Update private feeds", updateResponse);

			removeChannels()
		}
	);
}

function removeChannels() {
	console.log( " " );
	console.log( "Remove channels: " + agentChannelList.length );
	if(agentChannelList && agentChannelList.length>0) 
		{
			for(i=0;i<agentChannelList.length;i++)
				{
					flockworks.agent.channel["delete"]( kloudId, agent.id, agent.feather, agentChannelList[i].id, function( deleteResponse )
						{
							console.log( "Remove channel complete, checking response" );
							checkChannel("Remove channel", deleteResponse);
							
							if(i==(agentChannelList.length-1))
								{
									removeAgent();
								}
						}
					);
				}
		}
	// channelList
}

function removeAgent() {
	console.log( " " );
	console.log( "Remove agent profile: " );
	flockworks.agent["delete"]( kloudId, agent.id, agent.feather, function( deleteResponse )
		{
			console.log( "Remove agent complete, checking response" );
			checkChannel("Remove profile", deleteResponse);
		}
	);
}

function checkProfile( where, profile ) {
	// Exists
	should.exist(profile);
	profile.should.have.property('id').with.lengthOf(('4f62c896e4b07158ac367a14').length);
	profile.should.have.property('feather').with.lengthOf(('4dd4a4283d997c7ac1494a3e').length);
	
	// Types
	profile.id.should.be.a('string');
	profile.feather.should.be.a('string');
	profile.firstName.should.be.a('string');
	profile.lastName.should.be.a('string');
	profile.kloudId.should.be.a('string');

}


function checkPartialProfile( where, profile ) {
	// Exists
	should.exist(profile);
	profile.should.have.property('id').with.lengthOf(('4f62c896e4b07158ac367a14').length);
	
	// Types
	profile.id.should.be.a('string');
	profile.firstName.should.be.a('string');
	profile.lastName.should.be.a('string');

}
function checkChannel( where, chnl ) {
	// Exists
	should.exist(chnl);
	chnl.should.have.property('id').with.lengthOf(('4f62c896e4b07158ac367a14').length);
	chnl.should.have.property('agentId').with.lengthOf(('4f62c896e4b07158ac367a14').length);
	
	// Types
	chnl.id.should.be.a('string');
	chnl.name.should.be.a('string');

}


/* randomUUID.js - Version 1.0
*
* Copyright 2008, Robert Kieffer
*
* This software is made available under the terms of the Open Software License
* v3.0 (available here: http://www.opensource.org/licenses/osl-3.0.php )
*
* The latest version of this file can be found at:
* http://www.broofa.com/Tools/randomUUID.js
*
* For more information, or to comment on this, please go to:
* http://www.broofa.com/blog/?p=151
*/
 
/**
* Create and return a "version 4" RFC-4122 UUID string.
*/
function randomUUID() {
  var s = [], itoh = '0123456789ABCDEF';
 
  // Make array of random hex digits. The UUID only has 32 digits in it, but we
  // allocate an extra items to make room for the '-'s we'll be inserting.
  for (var i = 0; i <36; i++) s[i] = Math.floor(Math.random()*0x10);
 
  // Conform to RFC-4122, section 4.4
  s[14] = 4;  // Set 4 high bits of time_high field to version
  s[19] = (s[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence
 
  // Convert to hex chars
  for (var i = 0; i <36; i++) s[i] = itoh[s[i]];
 
  // Insert '-'s
  s[8] = s[13] = s[18] = s[23] = '-';
 
  return s.join('');
}