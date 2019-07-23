import {Socket} from 'net';

export class AutomateCommand {
  public readonly description: string;
  public readonly hex: string;
  public readonly binary: Buffer;

  constructor(description: string, hex: string) {
    this.description = description;
    this.hex = hex;
    this.binary = Buffer.from(hex, 'hex');
  }
}

const ID = '01';
export const CONNECT_COMMAND = new AutomateCommand(
  'CONNECT',
  `46494E530000000C0000000000000000000000${ID}`
);
export const GET_SPEED_COMMAND = new AutomateCommand(
  'GET_SPEED',
  `46494E530000001A000000020000000080000300010000${ID}00070101B10014000001`
);

export async function sendCommand(socket: Socket, command: AutomateCommand): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // tslint:disable-next-line:no-any
    socket.write(command.binary, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
