var express = require('express');
var app = express();

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/index.html');
   console.log(req.query.room);
});

 app.get('/files/:fileName', function (req, res) {
    res.sendFile(__dirname + "\\" + req.params.fileName);
 });

var server = app.listen(8081, function () {
   var port = server.address().port
   
   console.log("Secure Chat listening at http://localhost:" + port)
})