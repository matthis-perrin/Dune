import log from 'electron-log';
import {Socket} from 'net';

import {aggregator} from '@root/automate/aggregator';
//AP
import {sendCommand, AutomateCommand} from '@root/automate/command';
import {addError} from '@root/state';

const WAIT_ON_ERROR = 2000;
const WAIT_ON_SUCCESS = 500;
const DURATION_BEFORE_RESTART = 10000;

// AP
export class AutomateWatcher {
  private socket = new Socket();
  private isStopping = false;
  private isStarting = false;
  private lastReceived = 0;
  private checkBlockedTimeout: NodeJS.Timeout | undefined;
  // AP
  public constructor(
    private readonly automateIP: string,
    private readonly automatePort: number,
    private readonly connectionID: string,
    private readonly finsCommande: string,
    private readonly emulate: boolean = false
  ) {
    if (emulate) {
      // AP
      console.log(`----- EMULATING AUTOMATE ID${this.connectionID} -----`);
    }
  }

  public start(): void {
    this.restart();
  }

  public stop(): void {
    this.isStopping = true;
    this.socket.destroy();
  }

  private setupSocketEventHandlers(): void {
    this.socket.on('data', buffer => {
      try {
        // tslint:disable-next-line:no-magic-numbers
        const value = buffer.readUInt32BE(buffer.length - 4);
        this.handleSpeed(value);
      } catch (err) {
        log.error('Failure top parse automate response.', err, buffer);
      }
    });
    this.socket.on('error', (err: Error) => this.handleError(err.message));
    this.socket.on('timeout', () => this.handleError('timeout'));
  }
  // AP
  private getConnectCommande(): AutomateCommand {
    return new AutomateCommand(
      'CONNECT',
      `46494E530000000C0000000000000000000000${this.connectionID}`
    );
  }

  private async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.socket.destroy();
        this.socket = new Socket({allowHalfOpen: true});
        this.setupSocketEventHandlers();
        // AP
        this.socket.connect(this.automatePort, this.automateIP, () => {
          sendCommand(this.socket, this.getConnectCommande())
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
    if (this.isStarting || this.isStopping) {
      log.info(
        'Not restarting because socket is already starting or stopping',
        this.isStarting,
        this.isStopping
      );
      return;
    }

    if (this.emulate) {
      this.fetchOnce();
      return;
    }

    log.info('Restarting socket');
    this.isStarting = true;
    this.connect()
      .then(() => {
        log.info('Restart success');
        this.isStarting = false;
        this.fetchOnce();
      })
      .catch(err => {
        this.isStarting = false;
        addError("Erreur lors de la connexion à l'automate", String(err));
        setTimeout(() => {
          this.restart();
        }, WAIT_ON_ERROR);
      });
  }

  private handleError(error: string): void {
    this.isStarting = false;
    addError('Erreur automate', error);
    setTimeout(() => this.restart(), WAIT_ON_ERROR);
  }

  private handleSpeed(value: number): void {
    if (this.checkBlockedTimeout) {
      clearTimeout(this.checkBlockedTimeout);
    }
    if (value !== 1) {
      this.lastReceived = Date.now();
      aggregator.addSpeed(value);
    }
    setTimeout(() => {
      this.fetchOnce();
    }, WAIT_ON_SUCCESS);
  }

  private checkBlocked(): void {
    if (Date.now() - this.lastReceived > DURATION_BEFORE_RESTART) {
      addError('Socket automate bloquée ? Redémarrage.', '');
      this.restart();
    }
  }
  // AP
  private getSpeedCommande(): AutomateCommand {
    return new AutomateCommand(
      'GET_SPEED',
      `46494E530000001A000000020000000080000300010000${this.connectionID}0007${this.finsCommande}`
    );
  }

  public fetchOnce(): void {
    if (this.emulate) {
      // tslint:disable-next-line:no-magic-numbers
      this.handleSpeed(183 - Math.round(Math.random() * 10));
      return;
    }
    // tslint:disable-next-line:no-magic-numbers
    this.checkBlockedTimeout = setTimeout(() => this.checkBlocked(), DURATION_BEFORE_RESTART + 500);
    // AP
    sendCommand(this.socket, this.getSpeedCommande()).catch(err => {
      addError("Erreur lors de la récupération de la vitesse de l'automate", String(err));
    });
  }
}

// export const automateWatcher = new AutomateWatcher(true);
