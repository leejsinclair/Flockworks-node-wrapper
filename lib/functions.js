var http = require('http');
var fs = require('fs');
var less = require('less');
var fw = require('./flockworks');
var httpWrapper = require('./httpWrapper');
var url = require('url');
rest = require("../node_modules/restler");

/*var wufoo = require('../../node/article_cache/lib/wufoo');
wufoo.setAuth('B9W0-Y4K9-61PX-3BYE','footastic');
*/
// Email validation requires
var spawn = require('child_process').spawn;
var check = require('validator').check;
var nodemailer = require('nodemailer');
var cache = {};
var cacheTimeout = 60000/*0*/;

// Flockworks API information
var fw = {
	uri: "http://127.0.0.1:8183/api/",
	endpoint: {
		post: {
			signin: "agent/signin",
			socialShare: "{networkname}/status/{uid}/{feather}",
			publish: "publish/feed/{feedId}/{uid}/{feather}"
		},
		get: {
			profile: "agent/id/{agentId}"
		}
	}
};

exports.getCache = function( collection, id ) {
	
	//console.log(cache);
	
	if(cache[collection]) {
		var col = cache[collection];
		if(col[id]) {
			console.log("Has cache");
			return col[id];
		} else {
			console.log("No cache");
			return false;
		}
	} else {
		console.log("No cache");
		return false;
	}
};

exports.setCache = function( collection, id, content ) {
	
	if(content.status && content.status=="error")
		return;
		
	if(content.ok && content.ok==false)
		return;
	
	if(!cache[collection])
		cache[collection] = {};
		
	cache[collection][id] = content;
	cache[collection][id].cacheTimeout = new Date().getTime() + cacheTimeout;
	
	//cacheClearDelayed(collection, id, cacheTimeout); /* Keep cache for 10 minutes */
};

function cacheClearDelayed( collection, id, delay ) {
	setTimeout(function(){
		cache[collection][id] = false;
	}, delay);
}

exports.clearSecureCookie = function( httpRes ) {
	console.log("clearing cookie");
	httpRes.cookie('stat', '', { expires: new Date(), httpOnly: true, path:"/app" });
	httpRes.cookie('stat', '', { expires: new Date(), httpOnly: true, path:"/app/" });
};

exports.setSecureCookie = function( httpRes, uid, feather ) {
	var remember = uid + ':' + feather;
	httpRes.cookie('stat', remember, { expires: new Date(Date.now() + 172800000), httpOnly: true, path:"/app" });
};

exports.getSecureCookie = function( httpReq ) {
	var udetails = httpReq.cookies.stat;
	var ud;
	if(udetails!=ud && udetails!='') {
		return { "uid": udetails.split(':')[0], "feather": udetails.split(':')[1]};
	} else {
		return { "uid": null, "feather": null };
	}
};

exports.mailChimpReset = function() {
	mailchimpFields = [];
};

exports.mailChimpField = function( field, filterOption ) {
	mailchimpFields.push( { "name": field, "filteron": filterOption  } );
};

exports.mailChimpSend = function( listID ) {
	try { 
	    var api = new MailChimpAPI(mailChimpAPIKey, { version : '1.3', secure : false });
	} catch (error) {
	    console.log('Error: ' + error);
	    return false;
	}
	
	//{ id : '78ddcc8c99' }
	
};

exports.sendEmail= function( fromAddress, toAddress, subject, htmlBody, textBody ) {
	console.log('Sending email');
	nodemailer.SMTP = {
	    host: 'secure.emailsrvr.com',
	    port: 465,
	    ssl: true,
	    use_authentication: true,
	    user: 'hello@kudosknowledge.com',
	    pass: 'Kn0wl3dg3'
	}
	
	nodemailer.send_mail(
	    // e-mail options
	    {
	        sender: fromAddress,
	        to:toAddress,
	        subject:subject,
	        html: htmlBody,
	        body:textBody
	    },
	    // callback function
	    function(error, success){
	        console.log('Message ' + success ? 'sent' : 'failed');
	    }
	);
};

var validDomains = [ "gmail.com", "hotmail.com" ];

exports.checkEmail = function( emailAddress, callback ) {
	var validFormat = false;
	var domainValid = false;
	var phonyAddresses = /^test\@|blah\@|^hello\@|^asdf\@|^sadf\@|^dfas\@|^fasd\@|^dfas\@|^qwerty\@/;
	var emailDomain = emailAddress.split("@")[1];
	var message = "";
	
	try {
		check(emailAddress).len(6, 64).isEmail();        //Methods are chainable
		validFormat = true;
	} catch (e) {
		message = e.message; //Please enter a valid integer
	}
	
	if (validFormat) {
		
		validDomains.forEach(function(domain) {
			if(domain==emailDomain) {
				domainValid = true;
			}
		});
		
		if(emailAddress.match(phonyAddresses)) {
			 message = "Looks like a phony email address";
			 callback( { "email": emailAddress, "valid": false, "message": message } );
		} else if (!domainValid) {
			checkDomain(emailDomain, function( res, message ) {
				callback({ "email": emailAddress, "valid": res, "message": message });
			});
		} else {
			callback({ "email": emailAddress, "valid": true, "message": "Valid server" });
		}
		
	} else {
		message = "Invalid format";
		callback({ "email": emailAddress, "valid": false, "message": message });
	}
}

function checkDomain( domain, callback ) {
	validServer = false;
	ping = spawn('ping', ['-c 1', domain]);
	
	ping.stdout.on('data', function (data) {
		data = data + "";
		//console.log('stdout: ' + data);
		if(data.indexOf("1 packets transmitted")>0 && data.indexOf("1 received")>0) {
		  	validServer = true;
		  }
	});
	
	ping.stderr.on('data', function (data) {
		setTimeout(function(){
		  	ping.kill('SIGHUP');
		  	ping.kill('SIGTERM');
		  },100)
		callback(true, "Unable to contact server");
	});
	
	ping.on('exit', function (code) {
		//console.log("Exit");
	  if(validServer)
	  	message = "Valid server";
	  else
	  	message = "Invalid server";
	  	
	  setTimeout(function(){
	  	ping.kill('SIGHUP');
	  	ping.kill('SIGTERM');
	  },100)

	  callback(validServer, message);
	});
}

/**
* do a http GET or POST request
* for GET requests: httpRequest('GET','http://xxx.com/xxx/yyy',function(response){ ... })
* for POST requests: httpRequest('POST','http://xxx.com/xxx/yyy','POST_CONTENT',function(response){ ... })
*/
exports.httpRequest = function(method,url,data,callback)
{
	httpWrapper.httpRequest( method, url, data, callback );
};

/**
* do a http GET or POST request
* for GET requests: httpRequest('GET','http://xxx.com/xxx/yyy',function(response){ ... })
* for POST requests: httpRequest('POST','http://xxx.com/xxx/yyy','POST_CONTENT',function(response){ ... })
*/
exports.httpJson = function(method,url,data,callback)
{
	httpWrapper.httpJson( method, url, data, callback );
};

exports.httpJsonPost = function( url, obj , callback ) {
	json.post(url, obj, function (err, data) {
		console.log(err);
	    callback(data);
	});
}


var saving = false;

exports.watchLessCSS = function ( filePath, fileName ) {
	// lessFilePath = path and filename of less file
	// cssFilePath = path and filename of css file
	var lessFilePath = filePath + fileName + '.less';
	var cssFilePath = filePath + fileName + '.css';
	
	console.log('watching:' + lessFilePath + ' > ' + cssFilePath);
	fs.watchFile(lessFilePath, function (curr, prev) {
		
		setTimeout( function() {
			if (!saving) {
				console.log('Change detected: ' + lessFilePath);
			  	saving = true;
			  
				toCSS(lessFilePath, function (err,less) {
					if (err) {
				  		console.log('Error converting less');
				  		console.log(err);
				  		setTimeout( function() {saving = false;} ,1000);
				  	} else {
				  		fs.writeFile(cssFilePath, less, function (err) {
							if (err) console.log('Error saving ' + cssFilePath + '!');
							else console.log('Saved: ' + cssFilePath);
							
							setTimeout( function() {saving = false;} ,1000);
						});
					}
				});
			  }
		  
		},1000);
	});
};

function toCSS (path, callback)
{
    var tree, css;
    fs.readFile(path, 'utf-8', function (e, str) {
        if (e) { return callback(e) }

        new(less.Parser)({
            paths: [require('path').dirname(path)],
            optimization: 1
        }).parse(str, function (err, tree) {
            if (err) {
                callback(err);
            } else {
                try {
                    css = tree.toCSS({ compress: true });
                    callback(null, css);
                } catch (e) {
                    callback(e);
                }
            }
        });
    });
}

exports.userAgentLayout = function( layoutName, viewName, userAgent ) {
	//console.log(userAgent);
	if(/mobile/i.test(userAgent) && !/iPad/i.test(userAgent))
		return { view: 'm-' + viewName, layout: 'layout.ejs' };
		
	return { layout: layoutName, view: viewName }
}

var releaseFolder = '/lib/release/enliten/1.1';
if ( process.argv.length > 3 ) releaseFolder = (process.argv[3]).replace('./','/');        
var rel = releaseFolder.replace('/lib/','');

exports.environment = function(req, viewName, userAgent) {
	//console.log(userAgent);
	var device = "desktop"; 
	if(/mobile/i.test(userAgent) && !/iPad/i.test(userAgent))
		device = "mobile";
	
	myURL = req.header('host');
	if ( myURL.indexOf("localhost") >= 0 || myURL.indexOf("10.0.1.") >= 0 || myURL.indexOf("10.1.1.") >= 0 || myURL.indexOf("127.0.0.") >= 0 || myURL.indexOf("192.168.") >= 0) {
		return {
					"jsPath": '/lib/', 
					"footerInclude": [],
					"device": device,
					"release": rel
				};
	} else {
		switch (viewName) {
			case "home":
				return {
					"jsPath": releaseFolder, 
					"footerInclude": [
						releaseFolder + '/dojo/flockworks.js'
					],
					"device": device,
					"release": rel
				};
				break;
				
			default:
				return {
					"jsPath": releaseFolder, 
					"footerInclude": [
						releaseFolder + '/dojo/flockworks.js',
						releaseFolder + '/dojo/flockworks.operate.js'
					],
					"device": device,
					"release": rel
				};
		}
		
	}
	return true;
}

exports.removeAds = function(html) {
	html = html.replace(/<\/html>[\s\S]*$/,'</html>');
	var remove = /\width="1"|height="1"|header|footer|adserver|VIDEO:|sellads|vanimg|\bads\b|2o7|a1\.yimg|ad(brite|click|farm|revolver|server|tech|vert)|at(dmt|wola)|banner|bizrate|blogads|bluestreak|burstnet|casalemedia|coremetrics|(double|fast)click|falkag|(feedster|right)media|googlesyndication|hitbox|httpads|imiclk|intellitxt|js\.overture|kanoodle|kontera|mediaplex|nextag|pointroll|qksrv|speedera|statcounter|tribalfusion|webtrends|onclick/;
    var a = html.match(/<img[^><]*>|<.img[^><]*>/gi);
    if(a) {
    	a.forEach(function(img){
	        if(img.match(remove) && img.match(remove).length>0) {
	            html=html.replace(img," ");
	        } else {  // fix incorrect use of quotes
	        	newImg = img.replace("='", '="');
		        newImg = img.replace("' ", ' "');
		        html = html.replace(img, newImg);
	        }
	        	
	    });
    }
    
    var remove = /header|footer|adserver|VIDEO:|sellads|vanimg|\bads\b|2o7|a1\.yimg|ad(brite|click|farm|revolver|server|tech|vert)|at(dmt|wola)|banner|bizrate|blogads|bluestreak|burstnet|casalemedia|coremetrics|(double|fast)click|falkag|(feedster|right)media|googlesyndication|hitbox|httpads|imiclk|intellitxt|js\.overture|kanoodle|kontera|mediaplex|nextag|pointroll|qksrv|speedera|statcounter|tribalfusion|webtrends|onclick/;
	var re= new RegExp('/<a .*?<\/a>/','g');
    var a = html.match(re);
    if(a) {
    	a.forEach(function(link){
	        if(link.match(remove))
	        	//console.log("Removing: " + link);
	            html=html.replace(link," ");
	    });
    }
    
    return html;
}

exports.cleanHTML = function( text, callback ) {
	test = text.replace(/<\/html>[\s\S]*$/,'</html>');
	text=text.replace(/<style .*?>(.*?)<\/style>/gi,"");
	text=text.replace(/<menu .*?>(.*?)<\/menu>/gi,"");
	text=text.replace(/<small .*?>(.*?)<\/small>/gi,"");
	text=text.replace(/<script .*?>(.*?)<\/script>/gi,"");
	text=text.replace(/<[^>]+>/gi," ");
    
	return text;
}

exports.findImage = function( text , takeAny, url ) {
	var html = text + '';
	var pageDomain = getDomain(url);
	var scopeCreep = text.indexOf("<body")>=0;
	var captionPos = text.indexOf('id="caption');
	if(!captionPos) captionPos = text.indexOf('class="caption');
	var titlePos = text.indexOf('<h1');
	if(!titlePos) titlePos = text.indexOf('class="title');
	var abstractPos = text.indexOf('class="abstract');
	
	text=text.replace(/<style .*?>(.*?)<\/style>/gi,"");
	text=text.replace(/<menu .*?>(.*?)<\/menu>/gi,"");
	text=text.replace(/<header .*?>(.*?)<\/header>/gi,"");
	text=text.replace(/<footer .*?>(.*?)<\/footer>/gi,"");
	text=text.replace(/<div id="side"[^>]*?>[\s\S]*?<\/div>/gi, '');
	

	text=text.replace(/src="\//gi,'src="' + pageDomain + "/");
	html=html.replace(/src="\//gi,'src="' + pageDomain + "/");

	imgArray = html.match(/<img[^><]*>|<.img[^><]*>/gi);
	var likely = /jpg|jpeg|png|dll|large|201?|cdn.|[0-9][0-9]\-[0-9][0-9]|\/[0-9][0-9][0-9][0-9]\/[0-9][0-9]\/|display_image/ig;
	var unlikely = /^\/|^\.|=|\?|;|\.gif|tags\.|embedded_img|small|tagline|slideshow|javascript:|yimg\.com|_th\.|flattr[0-9]\.png|_icon|twitter.png|facebook.png|email.png|rss.png|facebook_16|twitter_16|facebook_32|twitter_32|\/member\/|\/columnist\/|\/contributors\/|_logo_|_logo.png|\/logo\/|\/logos\/|\/buttons\/|\/common\/|\/social\/|\/thumbnail\/|\/thumbnails\/|\/avatar\/|\/promo\/|\/promos\/|\/weather\/|\/flags\/|profile_images|transparent|lowres|rss_|x75|120x160|250x250|240x400|336x280|180x150|300x100|720x300|468x60|234x60|88x33|120x240|120x240|125x125|125x100|728x90|160x600|120x600|300x600|icon|advertisment|comment|x75|banner|header|footer|top_|top-advertisment|thumb|_xrail_|face\bookshare|twittershare|position:a\bsolute|addtocart|signature|title|read\-more|ABPub/;
	var veryLikey = /large|\/media\/|reutersmedia.net|\.metronews\./g
	var veryNot = /\/http:|tags\.|_icon|embedded_img|sellads|vanimg|\bads\b|2o7|a1\.yimg|ad(brite|click|farm|revolver|server|tech|vert)|at(dmt|wola)|banner|bizrate|blogads|bluestreak|burstnet|casalemedia|coremetrics|(double|fast)click|falkag|(feedster|right)media|googlesyndication|hitbox|httpads|imiclk|intellitxt|js\.overture|kanoodle|kontera|mediaplex|nextag|pointroll|qksrv|speedera|statcounter|tribalfusion|webtrends|onclick|\.php|lowres|\.yimg\.|badges|\/common\/|\/std\/|\/logo\/|button|logo-wall|logo-Wall|promo_|promos|\.gif|doubleclick|dive-into-media|reuters_logo|prweb_|google_ads\[/g;
	var likelyStyles = /0px|margin/g;
	var unlikelyStyles = /1px|#ccc|#666|solid/ig;
	var likelyClasses = /main/ig;
	var unlikelyClasses = /promo|logo|_ad|attachment/ig;
	var unlikelyAlt = /video\:/ig;
	var likelyAlt = /photo\:/ig;

	//console.log(imgArray);
	var maxRating = 2;
	var tempImg = "";
	if(imgArray) {
	    maxWidth = 0;
	    selectedImg = '';
		for(ic=0;ic<imgArray.length;ic++) {
			var score = 1;
			
			if(captionPos) {
				tagPos = text.indexOf((imgArray[ic]+''));
				var posDiff = Math.abs(captionPos-tagPos);
				if(posDiff <= 200) {
					//console.log(tagPos + ":" + captionPos + " : " + (imgArray[ic]+''));
					score+=(200/posDiff) * 5;
				}
			}
			
			if(titlePos) {
				tagPos = text.indexOf((imgArray[ic]+''));
				var posDiff = Math.abs(titlePos-tagPos);
				//console.log("posDiff: " + posDiff);
				if(posDiff <= 300) {
					//console.log(tagPos + ":" + titlePos + " : " + (imgArray[ic]+''));
					score+=(300/posDiff) * 2;
				}
			}
			
			if(abstractPos) {
				tagPos = text.indexOf((imgArray[ic]+''));
				var posDiff = Math.abs(abstractPos-tagPos);
				//console.log("posDiff: " + posDiff);
				if(posDiff <= 200) {
					//console.log(tagPos + ":" + titlePos + " : " + (imgArray[ic]+''));
					score+=(200/posDiff) * 4;
				}
			}
						
            theTag = (imgArray[ic]+'').replace("'",'"');
            //console.log("@@a:" + theTag);
			var width = theTag.match(/width="(.+?)"/i);
			var height = theTag.match(/height="(.+?)"/i);
			try {
				var source = theTag.match(/src="(.+?)"/i)[1]+"";
			} catch(e) {
				var source = theTag.match(/src="(.+?)"/i) + "";
			}
			try {
				var alt = theTag.match(/alt="(.+?)"/i)[1]+"";
			} catch(e) {
				var alt = theTag.match(/alt="(.+?)"/i) + "";
			}
			
			try {
				var style = theTag.match(/style="(.+?)"/i)[1]+"";
			} catch(e) {
				var style = theTag.match(/style="(.+?)"/i) + "";
			}
			
			try {
				var classes = theTag.match(/class="(.+?)"/i)[1]+"";
			} catch(e) {
				var classes = theTag.match(/class="(.+?)"/i) + "";
			}
			
			try {
				var ids = theTag.match(/id="(.+?)"/i)[1]+"";
			} catch(e) {
				var ids = theTag.match(/id="(.+?)"/i) + "";
			}
			
			
			if(source && source.indexOf("/")==0) {
				source = pageDomain + source;
			} else {
				score++;
			}
			
			if(source && source != null) {
				source+="";
	    		//console.log("@@1: " + score);
				if(height) {
	    			myHeight = parseInt(height[1]);
	    			if(myHeight && myHeight<=105) {
	    				score-=(scopeCreep?8:4);
	    			} else if (myHeight && myHeight<=150) {
	    				score-=(scopeCreep?4:2);;
	    			} else if (myHeight && myHeight>300) {
	    				score+=(scopeCreep?4:8);;
	    			} else if (myHeight) {
	    				score+=(scopeCreep?1:myHeight/75);
	    			}
	    		} else {
	    			score-=2;
	    		}
	    		//console.log("@@2: " + score);
	    		if(width) {
	    			myWidth = parseInt(width[1]);
	    			if(myWidth && myWidth<=100) {
	    				score-=(scopeCreep?8:4);
	    			} else if (myWidth && myWidth<=150) {
	    				score-=(scopeCreep?4:2);
	    			} else if (myWidth && myWidth>400) {
	    				score+=(scopeCreep?4:8);
	    			} else if (myWidth) {
	    				score+=(scopeCreep?1:myWidth/75);
	    			}
	    		} else {
	    			score-=2;
	    		}
	    		//console.log("@@3: " + score);
	    		if(height && width && width<=100 && height<=100) {
	    			score-=(scopeCreep?-2:-1);
	    		}
	    		//console.log("@@4: " + score);
	    		if(alt) {
	    			if(alt.length>30) score++;
	    			if(alt.match(unlikelyAlt))
	    				score -= alt.match(unlikelyAlt).length * (scopeCreep?5:3);
	    			if(alt.match(likelyAlt))
	    				score -= alt.match(likelyAlt).length * (scopeCreep?1:2);
	    		} else {
	    			score--;
	    		}
	    		
	    		if(ids) {
	    			score++; // if an id is present it's more likely to be a content item
	    		}
	    		//console.log("@@5: " + score);
	    		if(classes) {
	    			score-=0.5; // If it has a class at all, it's probably not a included in the regular content area
	    		}
	    		//console.log("@@6: " + score);
	    		if(source.match(likely))
	    			score += source.match(likely).length * (scopeCreep?0.5:4);;
	    		//console.log("@@7: " + score);
	    		if(source.match(veryLikey))
	    			score += source.match(veryLikey).length *(scopeCreep?0.5:1);
	    		//console.log("@@8: " + score);
	    		if(source.match(unlikely))
	    			score -= source.match(unlikely).length * (scopeCreep?2:1);
	    		//console.log("@@9: " + score);
	    		if(source.match(veryNot))
	    			score -= source.match(veryNot).length * 20;
	    			
	    		if(style.match(likelyStyles))
	    			score += style.match(likelyStyles).length;
	    		//console.log("@@10: " + score);
	    		if(style.match(unlikelyStyles)) {
	    			score -= style.match(unlikelyStyles).length;
	    		}
	    		//console.log("@@11: " + score);
	    		if(classes.match(likelyClasses))
	    			score += classes.match(likelyClasses).length;
	    		
	    		//console.log("@@12: " + score);
	    		if(classes.match(unlikelyClasses))
	    			classes -= classes.match(unlikelyClasses).length;
	    			
			} else {
				score = -2000;
			}
		
		if(theTag.indexOf("embedded_img")>0) score = -1000;
	
    		if(score > maxRating) {
    			tempImg = source;
    			maxRating = score;
    		}
    		
		}

	   if(tempImg!='' && tempImg != null) {
    		console.log('selectedImg: ' + tempImg + " : " + maxRating);
	        return tempImg;
	    } else {
	    	//console.log(text);
	    	console.log('selectedImg: not found');
	    	return "";
	    }
	}
}

exports.validateImage = function(imgURL, callback) {
	if(!imgURL || imgURL.indexOf("http")<0 || imgURL.indexOf("/")<0)
		{
			callback(false);
			return;
		}

	var imgHostName = url.parse(imgURL).hostname;
	var filename = url.parse(imgURL).pathname.split("/").pop();
	var sent = false;

	var http_client = http.createClient(80, imgHostName);
	var imgRequest = http_client.request('GET', imgURL, {"host": imgHostName});
	imgRequest.addListener('response', function(proxy_response)
		{
		    var statusCode = proxy_response.statusCode;
	    	var response_content_length = parseInt(proxy_response.headers["content-length"]);
			if(!sent) {
				if(statusCode==200) 
					{
						callback(true);
					}
				else
					{
						callback(false);
					}
			}
		}
	);

	imgRequest.end();
}

exports.suggestImage = function( text, callback ) {
	if(!text || text.length < 20)
		{
			callback("error");return;
		}
	var postJson = {
        "method": 'zemanta.suggest',
        "format": 'json',
        "api_key": "tel5dvqqbtvxb5jna3eh2vfh",
        "text": text
	};

   var endPoint = "http://api.zemanta.com/services/rest/0.0/";
   rest.post(endPoint, { data: postJson, }).on('complete', function(data, response) 
   	{
		  if (response.statusCode == 201 || response.statusCode == 200 ) 
			  	{
			  	var suggestObj = JSON.parse(data);
				if(suggestObj && suggestObj.images && suggestObj.images.length>0)
					{
						var imageArray = JSON.parse(data).images;
					  	var confidence = 0;
					  	
					  	imageArray.sort(function (item1,item2) 
						  	{
								  rate1 = item1.confidence;
								  rate2 = item2.confidence;
								  if (rate1 > rate2) 
									  {
									  	return -1;
									  } 
								  else if (rate1 < rate2) 
									  {
									    return 1;
									  } 
								  else 
									  {
									    return 0;
									  }
							}
						);
				
						var recommended = imageArray[0];
						var selectedImg = "";

						if(recommended.url_l!="")
							selectedImg = recommended.url_l;
						else if(recommended.url_m!="")
							selectedImg = recommended.url_m;
						if(recommended.url_s!="")
							selectedImg = recommended.url_m;
				
						if(selectedImg!="")
						  	callback({ "image": selectedImg, "doc": recommended });
						else
							callback({ "image": "" });
					}
				else
					{
						callback({ "image": "" });
					}
				
			  } 
		  else 
		  {
		  	callback({ "image": "" });
		  }
		}
	);
}

/**
 * Retrieves the current window URL, strips folders and filenames
 * 
 *	@since			0.2
 *	@version		0.1
 *	@author			Lee Sinclair	lee@kudosknowledge.com
 * 	@method
 * 	@alias			getDomain
 * 	@id  */
function getDomain( url ) {
	//console.log("url: " + url);
	re = new RegExp("^http://(.*)[/](\\1)");
	currentDomain = url.replace(re, "$1");
	portPos = currentDomain.indexOf("/", 8);
	if (portPos > 0) 
		currentDomain = currentDomain.substr(0, portPos);
	
	return currentDomain;
} 

exports.findVideo = function( text, url ) {
	text += "";
	url += "";
	var youTubeVideo = text.match(/<iframe .*youtube.com.*?iframe>/i);
	if (youTubeVideo+''== "null" || youTubeVideo+''== "undefined")
		youTubeVideo = text.match(/<object.*youtube.com.*?object>/i);
		
	var vimeoVideo = text.match(/<iframe .*player.vimeo.com.*?iframe>/i);
	
	if (youTubeVideo+''!= "null" && youTubeVideo+''!= "undefined") {
		/* You tube videos */
		youTubeVideoURL = ((youTubeVideo+'').match(/http:\/\/.*?"/i)+'').replace('"','');
		return youTubeVideoURL;
		
	} else if (vimeoVideo+''!= "null" && vimeoVideo+''!= "undefined") {
		/* Vimeo tube videos */
		return ((vimeoVideo+'').match(/http:\/\/.*?"/i)+'').replace('"','');
		
	} else if (url.indexOf('youtube.com') >0 && url.indexOf('watch') > 0) {
		videoID = (url).split('v=')[1].split('&')[0];
		return  'http://www.youtube.com/embed/' + videoID;
	} else if (url.indexOf('gdata.youtube.com/feeds/api/videos') >0) {
		videoID = (url).split('videos/')[1].split('&')[0];
		return 'http://www.youtube.com/embed/' + videoID;
	} else {
		return "";
	}
}

exports.videoHTML = function(url, width) {
			
	boxWidth = width;
	boxHeight = parseInt(boxWidth * 0.623214286, 10);
	
	console.log('video url: ' + url);
	
	if (url.indexOf('youtube.com')>0) { // youtube
		if (url.indexOf('/embed/')>0)
			videoID = url.split('/embed/')[1].split('&')[0];
		else if (url.indexOf('/v/')>0)
			videoID = url.split('/v/')[1].split('&')[0];
		else 
			videoID = url.split('?v=')[1].split('&')[0];
		return '<div class="videoContainer"><iframe class="centerframe" width="' + boxWidth + '" height="' + boxHeight + '" src="http://www.youtube.com/embed/' + videoID + '" frameborder="0" allowfullscreen></iframe></div>';
	} else if (url.indexOf('player.vimeo.com')>0) { // vimeo
		return '<div class="videoContainer"><iframe class="centerframe" width="' + boxWidth + '" height="' + boxHeight + '" src="' + url + '" frameborder="0" allowfullscreen></iframe></div>';
	} else if (url.indexOf('gdata.youtube.com/feeds/api/videos')>0) { // google youtube url
		videoID = (URL).split('videos/')[1].split('&')[0];
		return '<div class="videoContainer"><iframe class="centerframe" width="' + boxWidth + '" height="' + boxHeight + '" src="http://www.youtube.com/embed/' + videoID + '" frameborder="0" allowfullscreen></iframe></div>';
	} else if (url.indexOf('fbcdn.net') > 0 ) {
		/* Facebook video */
		
		/* Check support */
		mp4Support = false;
		/*var v = dojo.create('video',{},dojo.body());
		if(v.canPlayType && v.canPlayType('video/mp4').replace(/no/, '')) {
	       mp4Support = true;
		}
		dojo.query(v).orphan();*/
		
		if(url.indexOf('.mp4') ){
			if (mp4Support) {
				videoUrl = url;
				return '<div class="videoContainer"><video controls="controls" width="' + boxWidth + '" height="' + boxHeight + '"><source src="' + videoUrl + '" type="video/mp4"></video></div>';
			} else {
				videoUrl = url.replace('video/video.php?v=','v/').replace(/\&.*/,'');
				return '<div class="videoContainer"><object type="application/x-shockwave-flash" width="' + boxWidth + '" height="' + boxHeight + '" data="' + videoUrl + '"><param name="allowfullscreen" value="true"><param name="allowscriptaccess" value="always"><param name="movie" value="' + videoUrl + '"><embed src="' + videoUrl + '" type="application/x-shockwave-flash" allowscriptaccess="always" alolowfullscreen="true" width="' + boxWidth + '" height="' + boxHeight + '"></embed></object></div>';
			}
		} else {
			videoUrl = url.replace('video/video.php?v=','v/').replace(/\&.*/,'');
			return '<div class="videoContainer"><object type="application/x-shockwave-flash" width="' + boxWidth + '" height="' + boxHeight + '" data="' + videoUrl + '"><param name="allowfullscreen" value="true"><param name="allowscriptaccess" value="always"><param name="movie" value="' + videoUrl + '"><embed src="' + videoUrl + '" type="application/x-shockwave-flash" allowscriptaccess="always" alolowfullscreen="true" width="' + boxWidth + '" height="' + boxHeight + '"></embed></object></div>';
		}
	}
	
	return "";
}

exports.secondsAgo = function( publishedDate ) {
	var pubDate =  new Date(publishedDate).getTime();
	var t = new Date().getTime() - pubDate;
	
	var re = '';
	var s = Math.round(t/1000);	
	var m = Math.floor(s/60);
	if (m > 0) s = s % 60;
	var h = Math.floor(m/60);
	if (h > 0) m = m % 60;
	var d = Math.floor(h/24);
	if (d > 0) h = h % 24;
	var displayTime =  (( d > 0 )?d + 'd ' : '') + (( h > 0 )?h + 'h ' : '') +m+'m &amp; '+s+' seconds ago';
	
	return displayTime;
}

exports.uuid = function() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

exports.readConf = function(filename) {
	try {
		return JSON.parse(fs.readFileSync(filename,'utf8'));
	}catch(e) {
		console.log(filename + ': JSON syntax error!',10);
	}
	
}

exports.saveJSON = function(filename,obj)
{
	//log('update JSON file: '+filename);
	fs.writeFile(filename,JSON.stringify(obj,null,'\t'));
}

exports.makeSchema = function(JSONObj, callback) {
	var JSONstring = JSON.stringify(JSONObj);
    var schemaObj = JSON.parse(JSONstring, function(key, value) {
        if(key = "type") {
            switch(value) {
                case "string":  return String;
                case "number":  return Number;
                case "date":    return Date;
                case "boolean": return Boolean;
                default:        return value;
            }
        }
        else
            return value;
    });
    callback(null, schemaObj);
};

exports.trim = function (string) {
    return string.replace(/^\s*|\s*$/g, '')
}

exports.arrayFilter = function (arr, fun /*, thisp*/) {
    var len = arr.length;

    var res = new Array();
    var thisp = arr[1];
    for (var i = 0; i < len; i++) {
        var val = arr[i]; // in case fun mutates this
        if (fun.call(arr[i], val, i, arr))
          res.push(val);
    }

    return res;
}

function cleanDeep (A, B, depth) {
	A = JSON.parse(JSON.stringify(A));
	B = JSON.parse(JSON.stringify(B));
	
	try { delete A._id } catch(e) {}
	
	try { delete B._id } catch(e) {}
	
	var forever = depth == null;
	for (var p in B) {
		if(p!="_id") 
			{
				if (B[p] != null && B[p].constructor==Object && (forever || depth > 0)) 
					{
						A[p] = cleanDeep(
							A.hasOwnProperty(p) ? A[p] : {},
							B[p],
							forever ? null : depth-1
						);
					}
				else
					{
						A[p] = B[p];
					}
			}
		
	}
	return A;
}

exports.cleanMerge = cleanDeep;

function mergeDeep (A, B, depth) {
	var forever = depth == null;
	for (var p in B) {
		if (B[p] != null && B[p].constructor==Object && (forever || depth > 0)) {
			A[p] = mergeDeep(
				A.hasOwnProperty(p) ? A[p] : {},
				B[p],
				forever ? null : depth-1
			);
		} else {
			A[p] = B[p];
		}
	}
	return A;
}

exports.mergeDeep = mergeDeep;

exports.merge = function(A, B) {
	return mergeDeep(A, B, 0);
}

exports.mergeCopy = function(A, B, depth) {
	var A_copy = util.mergeDeep({}, A);
	return mergeDeep(A_copy, B, depth);
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Block TEA (xxtea) Tiny Encryption Algorithm implementation in JavaScript                      */
/*     (c) Chris Veness 2002-2010: www.movable-type.co.uk/tea-block.html                          */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Algorithm: David Wheeler & Roger Needham, Cambridge University Computer Lab                   */
/*             http://www.cl.cam.ac.uk/ftp/papers/djw-rmn/djw-rmn-tea.html (1994)                 */
/*             http://www.cl.cam.ac.uk/ftp/users/djw3/xtea.ps (1997)                              */
/*             http://www.cl.cam.ac.uk/ftp/users/djw3/xxtea.ps (1998)                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Tea = {};  // Tea namespace

/*
 * encrypt text using Corrected Block TEA (xxtea) algorithm
 *
 * @param {string} plaintext String to be encrypted (multi-byte safe)
 * @param {string} password  Password to be used for encryption (1st 16 chars)
 * @returns {string} encrypted text
 */
exports.encrypt = function(plaintext, password) {
    if (plaintext.length == 0) return('');  // nothing to encrypt
    
    // convert string to array of longs after converting any multi-byte chars to UTF-8
    var v = Tea.strToLongs(Utf8.encode(plaintext));
    if (v.length <= 1) v[1] = 0;  // algorithm doesn't work for n<2 so fudge by adding a null
    // simply convert first 16 chars of password as key
    var k = Tea.strToLongs(Utf8.encode(password).slice(0,16));  
    var n = v.length;
    
    // ---- <TEA coding> ---- 
    
    var z = v[n-1], y = v[0], delta = 0x9E3779B9;
    var mx, e, q = Math.floor(6 + 52/n), sum = 0;
    
    while (q-- > 0) {  // 6 + 52/n operations gives between 6 & 32 mixes on each word
        sum += delta;
        e = sum>>>2 & 3;
        for (var p = 0; p < n; p++) {
            y = v[(p+1)%n];
            mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
            z = v[p] += mx;
        }
    }
    
    // ---- </TEA> ----
    
    var ciphertext = Tea.longsToStr(v);
    
    return Base64.encode(ciphertext);
}

/*
 * decrypt text using Corrected Block TEA (xxtea) algorithm
 *
 * @param {string} ciphertext String to be decrypted
 * @param {string} password   Password to be used for decryption (1st 16 chars)
 * @returns {string} decrypted text
 */
exports.decrypt = function(ciphertext, password) {
    if (ciphertext.length == 0) return('');
    var v = Tea.strToLongs(Base64.decode(ciphertext));
    var k = Tea.strToLongs(Utf8.encode(password).slice(0,16)); 
    var n = v.length;
    
    // ---- <TEA decoding> ---- 
    
    var z = v[n-1], y = v[0], delta = 0x9E3779B9;
    var mx, e, q = Math.floor(6 + 52/n), sum = q*delta;

    while (sum != 0) {
        e = sum>>>2 & 3;
        for (var p = n-1; p >= 0; p--) {
            z = v[p>0 ? p-1 : n-1];
            mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
            y = v[p] -= mx;
        }
        sum -= delta;
    }
    
    // ---- </TEA> ---- 
    
    var plaintext = Tea.longsToStr(v);

    // strip trailing null chars resulting from filling 4-char blocks:
    plaintext = plaintext.replace(/\0+$/,'');

    return Utf8.decode(plaintext);
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// supporting functions

Tea.strToLongs = function(s) {  // convert string to array of longs, each containing 4 chars
    // note chars must be within ISO-8859-1 (with Unicode code-point < 256) to fit 4/long
    var l = new Array(Math.ceil(s.length/4));
    for (var i=0; i<l.length; i++) {
        // note little-endian encoding - endianness is irrelevant as long as 
        // it is the same in longsToStr() 
        l[i] = s.charCodeAt(i*4) + (s.charCodeAt(i*4+1)<<8) + 
               (s.charCodeAt(i*4+2)<<16) + (s.charCodeAt(i*4+3)<<24);
    }
    return l;  // note running off the end of the string generates nulls since 
}              // bitwise operators treat NaN as 0

Tea.longsToStr = function(l) {  // convert array of longs back to string
    var a = new Array(l.length);
    for (var i=0; i<l.length; i++) {
        a[i] = String.fromCharCode(l[i] & 0xFF, l[i]>>>8 & 0xFF, 
                                   l[i]>>>16 & 0xFF, l[i]>>>24 & 0xFF);
    }
    return a.join('');  // use Array.join() rather than repeated string appends for efficiency in IE
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Base64 class: Base 64 encoding / decoding (c) Chris Veness 2002-2010                          */
/*    note: depends on Utf8 class                                                                 */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Base64 = {};  // Base64 namespace

Base64.code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/**
 * Encode string into Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
 * (instance method extending String object). As per RFC 4648, no newlines are added.
 *
 * @param {String} str The string to be encoded as base-64
 * @param {Boolean} [utf8encode=false] Flag to indicate whether str is Unicode string to be encoded 
 *   to UTF8 before conversion to base64; otherwise string is assumed to be 8-bit characters
 * @returns {String} Base64-encoded string
 */ 
Base64.encode = function(str, utf8encode) {  // http://tools.ietf.org/html/rfc4648
  utf8encode =  (typeof utf8encode == 'undefined') ? false : utf8encode;
  var o1, o2, o3, bits, h1, h2, h3, h4, e=[], pad = '', c, plain, coded;
  var b64 = Base64.code;
   
  plain = utf8encode ? Utf8.encode(str) : str;
  
  c = plain.length % 3;  // pad string to length of multiple of 3
  if (c > 0) { while (c++ < 3) { pad += '='; plain += '\0'; } }
  // note: doing padding here saves us doing special-case packing for trailing 1 or 2 chars
   
  for (c=0; c<plain.length; c+=3) {  // pack three octets into four hexets
    o1 = plain.charCodeAt(c);
    o2 = plain.charCodeAt(c+1);
    o3 = plain.charCodeAt(c+2);
      
    bits = o1<<16 | o2<<8 | o3;
      
    h1 = bits>>18 & 0x3f;
    h2 = bits>>12 & 0x3f;
    h3 = bits>>6 & 0x3f;
    h4 = bits & 0x3f;

    // use hextets to index into code string
    e[c/3] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
  }
  coded = e.join('');  // join() is far faster than repeated string concatenation in IE
  
  // replace 'A's from padded nulls with '='s
  coded = coded.slice(0, coded.length-pad.length) + pad;
   
  return coded;
}

/**
 * Decode string from Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
 * (instance method extending String object). As per RFC 4648, newlines are not catered for.
 *
 * @param {String} str The string to be decoded from base-64
 * @param {Boolean} [utf8decode=false] Flag to indicate whether str is Unicode string to be decoded 
 *   from UTF8 after conversion from base64
 * @returns {String} decoded string
 */ 
Base64.decode = function(str, utf8decode) {
  utf8decode =  (typeof utf8decode == 'undefined') ? false : utf8decode;
  var o1, o2, o3, h1, h2, h3, h4, bits, d=[], plain, coded;
  var b64 = Base64.code;

  coded = utf8decode ? Utf8.decode(str) : str;
  
  
  for (var c=0; c<coded.length; c+=4) {  // unpack four hexets into three octets
    h1 = b64.indexOf(coded.charAt(c));
    h2 = b64.indexOf(coded.charAt(c+1));
    h3 = b64.indexOf(coded.charAt(c+2));
    h4 = b64.indexOf(coded.charAt(c+3));
      
    bits = h1<<18 | h2<<12 | h3<<6 | h4;
      
    o1 = bits>>>16 & 0xff;
    o2 = bits>>>8 & 0xff;
    o3 = bits & 0xff;
    
    d[c/4] = String.fromCharCode(o1, o2, o3);
    // check for padding
    if (h4 == 0x40) d[c/4] = String.fromCharCode(o1, o2);
    if (h3 == 0x40) d[c/4] = String.fromCharCode(o1);
  }
  plain = d.join('');  // join() is far faster than repeated string concatenation in IE
   
  return utf8decode ? Utf8.decode(plain) : plain; 
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Utf8 class: encode / decode between multi-byte Unicode characters and UTF-8 multiple          */
/*              single-byte character encoding (c) Chris Veness 2002-2010                         */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Utf8 = {};  // Utf8 namespace

/**
 * Encode multi-byte Unicode string into utf-8 multiple single-byte characters 
 * (BMP / basic multilingual plane only)
 *
 * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
 *
 * @param {String} strUni Unicode string to be encoded as UTF-8
 * @returns {String} encoded string
 */
Utf8.encode = function(strUni) {
  // use regular expressions & String.replace callback function for better efficiency 
  // than procedural approaches
  var strUtf = strUni.replace(
      /[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
      function(c) { 
        var cc = c.charCodeAt(0);
        return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f); }
    );
  strUtf = strUtf.replace(
      /[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
      function(c) { 
        var cc = c.charCodeAt(0); 
        return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f); }
    );
  return strUtf;
}

/**
 * Decode utf-8 encoded string back into multi-byte Unicode characters
 *
 * @param {String} strUtf UTF-8 string to be decoded back to Unicode
 * @returns {String} decoded string
 */
Utf8.decode = function(strUtf) {
  // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
  var strUni = strUtf.replace(
      /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
      function(c) {  // (note parentheses for precence)
        var cc = ((c.charCodeAt(0)&0x0f)<<12) | ((c.charCodeAt(1)&0x3f)<<6) | ( c.charCodeAt(2)&0x3f); 
        return String.fromCharCode(cc); }
    );
  strUni = strUni.replace(
      /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
      function(c) {  // (note parentheses for precence)
        var cc = (c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f;
        return String.fromCharCode(cc); }
    );
  return strUni;
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
