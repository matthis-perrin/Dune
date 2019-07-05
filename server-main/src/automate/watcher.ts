import {Socket} from 'net';
import {addError} from '@root/state';
import {sendCommand, CONNECT_COMMAND, GET_SPEED_COMMAND} from '@root/automate/command';
import {aggregator} from '@root/automate/aggregator';

const AUTOMATE_IP = '192.168.0.50';
const AUTOMATE_PORT = 9600;
const WAIT_ON_ERROR = 2000;
const WAIT_ON_SUCCESS = 500;
const DURATION_BEFORE_RESTART = 10000;

class AutomateWatcher {
  private socket = new Socket();
  private isStopping = false;
  private isStarting = false;
  private lastReceived = 0;
  private checkBlockedTimeout: NodeJS.Timeout | undefined;

  public constructor() {
    this.socket.on('data', buffer => {
      const value = buffer.readUInt32BE(buffer.length - 4);
      this.handleSpeed(value);
    });
    this.socket.on('close', () => this.restart());
    this.socket.on('end', () => this.restart());
    this.socket.on('error', (err: Error) => this.handleError(err.message));
    this.socket.on('timeout', () => this.handleError('timeout'));
  }

  public start(): void {
    this.restart();
  }

  public stop(): void {
    this.isStopping = true;
    this.socket.destroy();
  }

  private connect(): Promise<void> {
    console.log('connect');
    return new Promise<void>((resolve, reject) => {
      try {
        this.socket.destroy();
        this.socket.connect(AUTOMATE_PORT, AUTOMATE_IP, () => {
          sendCommand(this.socket, CONNECT_COMMAND)
            .then(() => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private restart(): void {
    console.log('restart');
    if (this.isStarting || this.isStopping) {
      return;
    }

    this.isStarting = true;
    this.connect()
      .then(() => {
        this.isStarting = false;
        this.fetchOnce();
      })
      .catch(err => {
        addError(`Erreur lors de la connexion à l'automate`, err);
        this.isStarting = false;
        setTimeout(() => {
          this.restart();
        }, WAIT_ON_ERROR);
      });
  }

  private handleError(error: string): void {
    console.log('handleError');
    addError(`Erreur automate`, error);
    setTimeout(() => this.fetchOnce(), WAIT_ON_ERROR);
  }

  private handleSpeed(value: number): void {
    if (this.checkBlockedTimeout) {
      clearTimeout(this.checkBlockedTimeout);
    }
    this.lastReceived = Date.now();
    aggregator.addSpeed(value);
    setTimeout(() => this.fetchOnce(), WAIT_ON_SUCCESS);
  }

  private checkBlocked(): void {
    console.log('checkBlocked');
    if (Date.now() - this.lastReceived > DURATION_BEFORE_RESTART) {
      addError('Socket automate bloquée ? Redémarrage.', '');
      this.restart();
    }
  }

  public async fetchOnce(): Promise<void> {
    this.checkBlockedTimeout = setTimeout(() => this.checkBlocked(), DURATION_BEFORE_RESTART + 500);
    await sendCommand(this.socket, GET_SPEED_COMMAND);
  }
}

export const automateWatcher = new AutomateWatcher();
