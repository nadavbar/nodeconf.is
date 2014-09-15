var http = require('http');
var fs = require('fs');
var path = require('path');
var WebSocketServer = require('ws').Server;

var sensors = require('windows.devices.sensors');

var ballHtmlFilePath = path.join(__dirname, 'ball.html');

var server = http.createServer(function (req, res) {
  console.info('got request');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  var fstream = fs.createReadStream(ballHtmlFilePath);
  fstream.on('finish', function() {res.end();});
  fstream.pipe(res);
});

server.listen(1337);

var wss = new WebSocketServer({ port: 9090 });
wss.on('error', function (err) {
  console.error(err);
});
var clients = [];

var colors = ['blue','red','yellow', 'orange'];

wss.on('connection', function() {
  console.info('connected');
  
  var newClient = {};
  newClient.id = clients.length;
  newClient.accFactor =  Math.max(50, Math.floor(Math.random() * 300));
  newClient.color = colors[clients.length % colors.length];
  
  clients.push(newClient);
});

function onReading(data) {
  for (var i in wss.clients) {
    try {
      wss.clients[i].send(data);
	} catch (e) {
	  console.info(e);
	}
  }
}

var acc = sensors.Accelerometer.getDefault();
acc.on('readingchanged', function (s, e) {

  var message = [];

  for (var i=0; i < clients.length; i++)
  {
    var client = clients[i];
    message.push(
	  { 
		id : client.id,
		color : client.color,
		x: e.reading.accelerationX * client.accFactor,
		y: e.reading.accelerationY * client.accFactor,
		z: e.reading.accelerationZ * client.accFactor,
      }
	);
  }
  
  onReading(JSON.stringify(message));
});

console.log('Server running at http://127.0.0.1:1337/');