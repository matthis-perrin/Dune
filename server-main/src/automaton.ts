import {Socket} from 'net';

const AUTOMATON_IP = '192.168.0.50';
const AUTOMATON_PORT = 9600;

class AutomatonCommand {
  public readonly description: string;
  public readonly hex: string;
  public readonly binary: Buffer;

  constructor(description: string, hex: string) {
    this.description = description;
    this.hex = hex;
    this.binary = Buffer.from(hex, 'hex');
  }
}

const ID = '03';
const CONNECT_COMMAND = new AutomatonCommand(
  'CONNECT',
  `46494E530000000C0000000000000000000000${ID}`
);
const GET_SPEED_COMMAND = new AutomatonCommand(
  'GET_SPEED',
  `46494E530000001A000000020000000080000300010000${ID}00070101B10014000001`
);

// 46 49 4e 53 00 00 00 10 00 00 00 01 00 00 00 00 00 00 00 ef 00 00 00 01
// 46 49 4e 53 00 00 00 10 00 00 00 01 00 00 00 00 00 00 00 02 00 00 00 01

function sendCommand(socket: Socket, command: AutomatonCommand): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    socket.write(command.binary, (err: any) => {
      console.log(`==> ${command.description} (${err ? 'error' : 'success'})`);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function waitFor(timeMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeMs);
  });
}

export async function test(): Promise<void> {
  const socket = new Socket();

  socket.on('data', function(buffer) {
    const value = buffer.readUInt32BE(buffer.length - 4);
    console.log(`<= reading ${value}`);
  });

  socket.on('close', (had_error: boolean) => console.log('[close] had_error = ', had_error));
  socket.on('connect', () => console.log('[connect]'));
  //   socket.on('data', (data: Buffer) => console.log('<==', data));
  socket.on('drain', () => console.log('[drain]'));
  socket.on('end', () => console.log('[end]'));
  socket.on('error', (err: Error) => console.log('[error]', err));
  socket.on('lookup', (err: Error, address: string, family: string | number, host: string) =>
    console.log('[lookup]', err, address, family, host)
  );
  socket.on('timeout', () => console.log('[timeout]'));

  socket.connect(AUTOMATON_PORT, AUTOMATON_IP, async () => {
    await sendCommand(socket, CONNECT_COMMAND);
    await waitFor(1000);
    for (let i = 0; i < 300; i++) {
      await sendCommand(socket, GET_SPEED_COMMAND);
      await waitFor(10);
    }
    socket.destroy();
  });
}
