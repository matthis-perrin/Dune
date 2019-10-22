const {createServer} = require('net');

createServer(function(socket) {
  console.log(`Connection from ${socket.remoteAddress}:${socket.remotePort}`);
  socket.write('Hello');

  socket.on('data', function(data) {
    console.log(`Received ${data.toString()}`);
  });

  socket.on('end', function() {
    console.log(`Deconnection from ${socket.remoteAddress}:${socket.remotePort}`);
  });
}).listen(9600);
