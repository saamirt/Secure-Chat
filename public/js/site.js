var socket = io('http://localhost:8082');
var roomID = 0;
var isFirstMessage = true;

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
    socket.emit('new user', { nickname: $('#nickInput').val().trim(), room: roomID }, function (data) {
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
        socket.emit('new user', { nickname: $('#nickInput').val().trim(), room: roomID }, function (data) {
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
                $('#chatMessages').empty();
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
    if ($('#chatSendInput').val().trim()){
        socket.emit('message', $('#chatSendInput').val());
        $('#chatSendInput').val("");
    }
});

//Pressing enter on input
$('#chatSendInput').keyup(function (event) {
    if (event.keyCode === 13 && $('#chatSendInput').val().trim()) {
        socket.emit('message', $('#chatSendInput').val());
        $('#chatSendInput').val("");
    }
});

socket.on('message', function (data) {
    writeMessageToChat(data);
});

function writeMessageToChat(data) {
    function writeTitle(data) {
        // Capitalizes each word of title
        // title = data.title.value.replace(/\w\S*/g, function (txt) {
        //     return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        // });
        return $('<p class = "title" style = "color : hsl(' + data.title.color + ', 100%, 46%);">').text(data.title.value);
    }

    function plainMessage(data) {
        console.log(data.message);
        htmlText = $('<div>');
        htmlText.append(writeTitle(data));
        htmlText.append($('<p class="plain-message">').text(data.message));
        $('#chatMessages').append(htmlText);
    }

    function actionMessage(data) {
        htmlText = $('<div style="text-align : center;">');
        htmlText.append($('<p class="action-message">').text(data.message));
        $('#chatMessages').append(htmlText);
    }

    if (data.messageType.match(/\W/)) {
        throw "invalid function name";
    }
    if (isFirstMessage){
        $('#chatMessages').empty();
        isFirstMessage = false;
    }
    var func = eval(data.messageType);
    func(data);
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