/*
 * Author: Lee Sinclair
 * Modified: Thur 8 March 2012
 *
 * exports:
 *	cleanHTML
 *	removeAds
 *	findImage
 *	findVideo
 *	validateImage
 *	suggestImage
 */
var http = require('http');
var fs = require('fs');
var less = require('less');
var httpWrapper = require('./httpWrapper');
var url = require('url');
var rest = require("restler");

var cache = {};
var cacheTimeout = 60000/*0*/;

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

function removeAds( html ) {
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

exports.removeAds = removeAds;

function cleanHTML( html ) {
	test = html.replace(/<\/html>[\s\S]*$/,'</html>');
	text=text.replace(/<style .*?>(.*?)<\/style>/gi,"");
	text=text.replace(/<menu .*?>(.*?)<\/menu>/gi,"");
	text=text.replace(/<small .*?>(.*?)<\/small>/gi,"");
	text=text.replace(/<script .*?>(.*?)<\/script>/gi,"");
	text=text.replace(/<[^>]+>/gi," ");
    
	return text;
}

exports.cleanHTML = cleanHTML;

function findImage ( html, takeAny, url ) {
	html = html + '';
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

exports.findImage = findImage;

function findImage (imgURL, callback) {
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

exports.validateImage = validateImage;

function suggestImage( text, callback ) {
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

exports.suggestImage = suggestImage;

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

function findVideo ( text, url ) {
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

exports.findVideo = findVideo;

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
