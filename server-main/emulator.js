const {createServer} = require('net');

createServer(function(socket) {
  console.log(`Connection from ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', function(data) {
    console.log(`Received ${data.toString()}`);
    if (data.compare(CONNECT_COMMAND) === 0) {
      console.log('CONNECT_COMMAND');
    }
    if (data.compare(GET_SPEED_COMMAND) === 0) {
      console.log('GET_SPEED_COMMAND');
      const speed = new Buffer(8);
      speed.writeUInt32BE(0, 0);
      speed.writeUInt32BE(180, 4);
      socket.write(speed);
    }
  });

  socket.on('end', function() {
    console.log(`Deconnection from ${socket.remoteAddress}:${socket.remotePort}`);
  });

  socket.on('error', function(err) {
    console.log(`Error`, err);
  });
}).listen(9600);

const CONNECT_COMMAND = Buffer.from(`46494E530000000C000000000000000000000003`, 'hex');
const GET_SPEED_COMMAND = Buffer.from(
  `46494E530000001A0000000200000000800003000100000300070101B10014000001`,
  'hex'
);
