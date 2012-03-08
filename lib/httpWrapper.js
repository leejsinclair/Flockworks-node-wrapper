var http = require('http');

exports.httpRequest = function(method,url,data,callback)
{
	makeRequest( method, url, data, callback );
};

function makeRequest( method, url, data, callback ) {
	//console.log('httpRequest: '+method+' '+url);
	
	if (method == 'GET') callback = data;
	var origURL = url;
	var url = require('url').parse(url);
	var options = 
	{
		host: url.hostname,
		port: url.port?url.port:80,
		path: url.pathname+(url.query?'?'+url.query:''),
		method: method,
		socket: null,
		headers: 
		{
			'Connection': 'keep-alive',
			'User-Agent': 'NodeJS v0.4.7'
		}
	};
	
	var req = http.request(options, function(res) {
		//console.log(res);
		if (res.statusCode == 302 || res.statusCode == 301)
		{
			//console.log(res.statusCode+' found! redirecting to '+res.headers.location+'...');
			makeRequest(method,res.headers.location,data,callback);
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
		callback('{ "ok": false, "status": "error" }',data);
		console.log('request error while requesting '+origURL,10);
	});
	
	if (method == 'POST') req.write(data);
	if (method == 'PUT') req.write(data);
	req.end();
}

/**
* do a http GET or POST request
* for GET requests: httpRequest('GET','http://xxx.com/xxx/yyy',function(response){ ... })
* for POST requests: httpRequest('POST','http://xxx.com/xxx/yyy','POST_CONTENT',function(response){ ... })
*/
exports.httpJson = function(method,url,data,callback)
{
	//console.log('httpReqeust '+method+' '+url);
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
			exports.httpRequest(method,res.headers.location,data,callback);
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