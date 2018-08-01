var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = {};
var rooms = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/files/:fileName', function (req, res) {
    res.sendFile(__dirname + "\\" + req.params.fileName);
});

io.on('connection', function (socket) {
    console.log('SOCKET.IO :: New User Joined');

    socket.on('new connection', function (callback) {
        var randNum = Math.round(Math.random()*(2**50));``
        while (randNum in rooms){
            randNum = Math.round(Math.random()*(2**50));``
        }
        callback(randNum);
    })

    socket.on('message', function (message) {
        console.log("'" + socket.nickname + "' to room '" + socket.room + "' : " + message);
        rooms[socket.room].messages.push({author:socket.nickname,message:message});
        socket.broadcast.to(socket.room).emit('message', message);
        console.log(rooms[socket.room]);
    });

    socket.on('new user', function (data, callback) {
        if (data.nickname in users || data.nickname.length < 2 || data.nickname.length > 16 || !data.nickname.match(/^[a-z0-9]+$/im)) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data.nickname;
            socket.room = data.room;
            if (socket.room in rooms) {
                rooms[socket.room].members.push(socket.nickname);
            } else {
                console.log("Creating room '" + socket.room + "'");
                rooms[socket.room] = { members: [socket.nickname], messages: [] };
            }
            socket.join(socket.room);
            users[socket.nickname] = socket;
            console.log("User chose '" + socket.nickname + "' as their nickname and joined room '" + socket.room + "'");
        }
    });

    socket.on('change room', function (data, callback) {
        if (data.room.length <= 20 && data.room.match(/^[a-z0-9]+$/im)) {
            callback(true);
            if (data.room == socket.room){return};
            if (!socket.nickname) { return };
            socket.leave(socket.room);
            var index = rooms[socket.room].members.indexOf(socket.nickname);
            if (index !== -1) rooms[socket.room].members.splice(index, 1);

            //checks if room needs to be deleted
            if (rooms[socket.room].members.length < 1) {
                console.log("Deleting room '" + socket.room + "'");
                delete rooms[socket.room];
            }

            socket.room = data.room;
            if (socket.room in rooms) {
                rooms[socket.room].members.push(socket.nickname);
            } else {
                console.log("Creating room '" + socket.room + "'");
                rooms[socket.room] = { members: [socket.nickname], messages: [] };
            }
            socket.join(socket.room);
        } else {
            callback(false);
        }
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');

        //quits if user didn't get past choosing a nickname
        if (!socket.nickname) { return };

        //removes user from room and user objects
        console.log("Deleting user '" + socket.nickname + "'");
        delete users[socket.nickname];
        var index = rooms[socket.room].members.indexOf(socket.nickname);
        if (index !== -1) rooms[socket.room].members.splice(index, 1);

        //checks if room needs to be deleted
        if (rooms[socket.room].members.length < 1) {
            console.log("Deleting room '" + socket.room + "'");
            delete rooms[socket.room];
        }
    });
});

var server = http.listen(8082, function () {
    var port = server.address().port

    console.log('Secure Chat listening at http://localhost:' + port);
});
