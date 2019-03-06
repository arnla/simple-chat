var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

users = [];
messages = [];
ctr = 1;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('user join', function() {
    socket.username = 'user' + ctr;
    ctr++;
    users.push(socket.username);
    console.log(socket.username + ' has joined the chat');
  });

  socket.on('disconnect', function(data) {
    users.splice(users.indexOf(socket.username), 1);
    console.log(socket.username + ' has left the chat');
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
