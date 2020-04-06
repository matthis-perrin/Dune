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
