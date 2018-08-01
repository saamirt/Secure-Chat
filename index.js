var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var count = 0;
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/files/:fileName', function (req, res) {
    res.sendFile(__dirname + "\\" + req.params.fileName);
});

io.on('connection', function (socket) {
    console.log('SOCKET.IO :: New User Joined');
    count++;
    socket.on('send message', function (message) {
        console.log(message);
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
        count--;
    });
});

var server = http.listen(8082, function () {
    var port = server.address().port
    
    console.log('Secure Chat listening at http://localhost:' + port);
});
