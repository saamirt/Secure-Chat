var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

var users = {};
var rooms = {};

//Set up default mongoose connection
mongoose.connect("mongodb://localhost:27017/securechat");
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('SOCKET.IO :: New User Joined');

    socket.on('new connection', function (callback) {
        var randNum = Math.round(Math.random() * (2 ** 50)) + 1000000000;
        while (randNum in rooms) {
            randNum = Math.round(Math.random() * (2 ** 50)) + 1000000000;
        }
        callback(randNum.toString().slice(0, 10));
    })

    socket.on('message', function (message) {
        if (!message) { return };
        console.log("'" + socket.nickname + "' to room '" + socket.room + "' : " + message);
        data = { messageType: 'plainMessage', message: message, title: { value: socket.nickname, color: rooms[socket.room].members[socket.nickname].color } }
        rooms[socket.room].messages.push(data);
        io.to(socket.room).emit('message', data);
    });

    socket.on('new user', function (data, callback) {
        if (data.nickname in users || data.nickname.length < 2 || data.nickname.length > 16 || !data.nickname.match(/^[a-z0-9]+$/im)) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data.nickname;
            users[socket.nickname] = socket;
            socket = addUserToRoom(socket, data.room);
            console.log("User chose '" + socket.nickname + "' as their nickname and joined room '" + socket.room + "'");
        }
    });

    socket.on('change room', function (data, callback) {
        if (data.room.length <= 20 && data.room.match(/^[a-z0-9]+$/im)) {
            if (data.room == socket.room) {
                callback("You are already in this room");
                return;
            };
            if (!socket.nickname) { return };

            socket = leaveRoom(socket, () => {
                callback(true);
                socket = addUserToRoom(socket, data.room);
            });
        } else {
            callback("Invalid room");
        }
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');

        //quits if user didn't get past choosing a nickname
        if (!socket.nickname) { return };

        socket = leaveRoom(socket);
        deleteUser(socket);
    });
});

var server = http.listen(8082, function () {
    var port = server.address().port

    console.log('Secure Chat listening at http://localhost:' + port);
});

function leaveRoom(socket, callback) {
    delete rooms[socket.room].members[socket.nickname];
    leaveMessage = { messageType: 'actionMessage', message: socket.nickname + " has left the room" };
    rooms[socket.room].messages.push(leaveMessage);
    io.to(socket.room).emit('message', leaveMessage);

    //checks if room needs to be deleted
    if (Object.keys(rooms[socket.room].members).length === 0) {
        //console.log("Deleting room '" + socket.room + "'");
        //delete rooms[socket.room];
        console.log("Room is now empty");
    }
    socket.room = ""
    if (callback) {
        callback();
    }
    return socket;
}

function deleteUser(socket) {
    //removes user from room and user objects
    console.log("Deleting user '" + socket.nickname + "'");
    delete users[socket.nickname];
}

function addUserToRoom(socket, newRoom) {

    socket.room = newRoom;
    if (!(socket.room in rooms)) {
        console.log("Creating room '" + socket.room + "'");
        rooms[socket.room] = { members: {}, messages: [] };
    }
    colorArray = Object.values(rooms[socket.room].members).reduce(function (obj, member) {
        obj.push(member.color);
        return obj;
    }, []);
    color = generateHSLColor(colorArray);
    rooms[socket.room].members[socket.nickname] = { color: color };

    socket.join(socket.room);
    rooms[socket.room].messages.forEach(data => {
        console.log(data);
        socket.emit('message', data);
    });
    var joinMessage = { messageType: 'actionMessage', message: socket.nickname + " has joined room '" + socket.room + "'" };
    rooms[socket.room].messages.push(joinMessage);
    io.to(socket.room).emit('message', joinMessage);

    return socket;
}

function generateHSLColor(colorArray) {
    color = Math.round(Math.random() * 360);
    checkIfUnique = function (color, colorArray) {
        colorArray.forEach((storedColor) => {
            if (color < (storedColor + 10) && color > (storedColor + 10)) {
                return true;
            }
        });
        return false;
    }
    while (checkIfUnique(color, colorArray)) {
        color = Math.round(Math.random() * 360);
    }
    return color;
}

function generateRGBColor(colorArray) {
    while (true) {
        color = [];
        for (var i = 0; i < 3; i++) {
            color.push(Math.round(Math.random() * 207) + 49);
        }
        if (function (colorArray) {
            for (i in colorArray) {
                if (function () {
                    for (var j; j < colorArray.length; j++) {
                        if (color[j] !== i[j]) {
                            return false;
                        }
                    }
                    return true;
                }) {
                    return false;
                }
            }
            return true;
        }) {
            return color;
        }
    }
}
