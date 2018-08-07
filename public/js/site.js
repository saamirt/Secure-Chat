var socket = io('http://localhost:8082');
var roomID = 0;

socket.emit('new connection', function (data) {
    query = getQueryItems()
    if (query['room']) {
        query['room'] = query['room'].substring(0, 20);
    }
    roomID = query['room'] || data + 1;
    $('.roomID').text(roomID);

    if (query['nickname']) {
        $('#nickInput').val(query['nickname']);
        $('#nickBtn').click();
    }

    if (query['theme']){
        if (query['theme'].toLowerCase() == "dark"){
            $('body').addClass(query['theme'].toLowerCase());
        }
    }
});

$('#toggleTheme').click(function(){
    $('body').toggleClass('dark');
    if ($('body').hasClass('dark')){
        $('#toggleTheme').text("Switch to Normal Theme");
    } else{
        $('#toggleTheme').text("Switch to Dark Theme");
    }
});

//Clicking join button
$('#nickBtn').click(function (event) {
    socket.emit('new user', { nickname: $('#nickInput').val().toLowerCase().trim(), room: roomID }, function (data) {
        if (data) {
            $('#nickDialog').addClass('hidden');
            $('#chatDialog').removeClass('hidden');
            $('#nickInput').attr("placeholder", "Choose a Nickname");
        } else {
            console.log("Cannot use that username!");
            $('#nickInput').attr("placeholder", "Cannot use that username");
        }
        $('#nickInput').val("");
    });
});

//Pressing enter on nickname input
$('#nickInput').keyup(function (event) {
    if (event.keyCode === 13) {
        socket.emit('new user', { nickname: $('#nickInput').val().toLowerCase().trim(), room: roomID }, function (data) {
            if (data) {
                $('#nickDialog').addClass('hidden');
                $('#chatDialog').removeClass('hidden');
                $('#nickInput').attr("placeholder", "Choose a Nickname");
            } else {
                console.log("Cannot use that username!");
                $('#nickInput').attr("placeholder", "Cannot use that username");
            }
            $('#nickInput').val("");
        });
    }
});

//Pressing enter on nickname input
$('#roomInput').keyup(function (event) {
    if (event.keyCode === 13) {
        socket.emit('change room', { room: $('#roomInput').val().toLowerCase().trim() }, function (data) {
            if (data) {
                roomID = $('#roomInput').val().toLowerCase();
                $('.roomID').text(roomID);
                $('#roomInput').attr("placeholder", "Enter Room ID");
            } else {
                console.log("Invalid Room");
                $('#roomInput').attr("placeholder", "Invalid Room");
            }
            $('#roomInput').val('');
        });
    }
});
//Clicking Send button
$('#chatSendBtn').click(function (event) {
    socket.emit('message', $('#chatSendInput').val());
    $('#chatSendInput').val("");
});

//Pressing enter on input
$('#chatSendInput').keyup(function (event) {
    if (event.keyCode === 13) {
        socket.emit('message', $('#chatSendInput').val());
        $('#chatSendInput').val("");
    }
});

socket.on('message', function (data) {
    writeMessageToChat('plainMessage', data);
});

function writeMessageToChat(fn, ...params) {
    function plainMessage(data) {
        console.log(data);

        htmlText = $('<div>');
        title = data.title.value.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        htmlText.append($('<p class = "title" style = "color : hsl(' + data.title.color + ', 100%, 46%);">').text(title));

        lines = data.message.match(/.{1,62}/g);
        lines.forEach(element => {
            htmlText.append($('<p>').text(element));
        });

        $('#chatMessages').append(htmlText);
    }
    if (fn.match(/\W/)) {
        throw "invalid function name";
    }
    var func = eval(fn);
    func(...params);
    $('#chatMessages').scrollTop($('#chatMessages').prop("scrollHeight"));
}

function getQueryItems() {
    query = {};
    regex = new RegExp(/(?<=(&|\?))\w+=\w+/g);
    while ((result = regex.exec(window.location)) !== null) {
        queryArray = result[0].split("=")
        query[queryArray[0]] = queryArray[1];
    }
    return query;
}