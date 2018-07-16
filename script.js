//Clicking Send button
$('#chatSendBtn').click(function (event) {
    //$('#chatFloatingText').val($('#chatSendInput').val());
    // $('#chatFloatingText').addClass('animate');
    $('#chatSendInput').val("");
    /*setTimeout(() => {
        $('#chatFloatingText').removeClass('animate');
    }, 600);*/
});

//Pressing enter on input
$('#chatSendInput').keyup(function () {
    if (event.keyCode === 13) {
        //$('#chatFloatingText').val($('#chatSendInput').val());
        //$('#chatFloatingText').addClass('animate');
        $('#chatSendInput').val("");
        /*setTimeout(() => {
            $('#chatFloatingText').removeClass('animate');
        }, 600);*/
    }
});