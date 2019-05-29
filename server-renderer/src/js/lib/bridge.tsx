import {BridgeTransport} from '@shared/bridge/bridge_renderer';
import {ServerGetStatus} from '@shared/bridge/commands';
import {ServerStatus} from '@shared/models';

class Bridge {
  private readonly bridgeTransport = new BridgeTransport();

  public async getServerStatus(): Promise<ServerStatus> {
    return this.bridgeTransport.sendBridgeCommand(ServerGetStatus);
  }
}

export const bridge = new Bridge();
