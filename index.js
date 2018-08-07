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
        console.log("'" + socket.nickname + "' to room '" + socket.room + "' : " + message);
        rooms[socket.room].messages.push({ author: socket.nickname, message: message });
        io.to(socket.room).emit('message', { message: message, title: { value: socket.nickname, color: rooms[socket.room].members[socket.nickname].color } });
        console.log(rooms[socket.room]);
    });

    socket.on('new user', function (data, callback) {
        if (data.nickname in users || data.nickname.length < 2 || data.nickname.length > 16 || !data.nickname.match(/^[a-z0-9]+$/im)) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data.nickname;
            socket.room = data.room;
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
            users[socket.nickname] = socket;
            console.log("User chose '" + socket.nickname + "' as their nickname and joined room '" + socket.room + "'");
        }
    });

    socket.on('change room', function (data, callback) {
        if (data.room.length <= 20 && data.room.match(/^[a-z0-9]+$/im)) {
            callback(true);
            if (data.room == socket.room) { return };
            if (!socket.nickname) { return };

            socket.leave(socket.room);

            delete rooms[socket.room].members[socket.nickname];

            //checks if room needs to be deleted
            if (Object.keys(rooms[socket.room].members).length === 0) {
                console.log("Deleting room '" + socket.room + "'");
                delete rooms[socket.room];
            }

            socket.room = data.room;
            if (!socket.room in rooms) {
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
        delete rooms[socket.room].members[socket.nickname];

        //checks if room needs to be deleted
        if (Object.keys(rooms[socket.room].members).length === 0) {
            console.log("Deleting room '" + socket.room + "'");
            delete rooms[socket.room];
        }
    });
});

var server = http.listen(8082, function () {
    var port = server.address().port

    console.log('Secure Chat listening at http://localhost:' + port);
});

function generateHSLColor(colorArray) {
    color = Math.round(Math.random() * 360);
    while (colorArray.includes(color)) {
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
