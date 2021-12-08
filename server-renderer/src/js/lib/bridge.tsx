import {BridgeTransport} from '@shared/bridge/bridge_renderer';
import {ServerGetStatus, ServerSimulateAutomate} from '@shared/bridge/commands';
import {ServerStatus} from '@shared/models';

class Bridge {
  private readonly bridgeTransport = new BridgeTransport(() => {});

  public async getServerStatus(): Promise<ServerStatus> {
    return this.bridgeTransport.sendBridgeCommand(ServerGetStatus);
  }
  public async simulateAutomateSpeed(
    speed: number | undefined,
    minutes: number
  ): Promise<ServerStatus> {
    return this.bridgeTransport.sendBridgeCommand(ServerSimulateAutomate, {speed, minutes});
  }
}

export const bridge = new Bridge();
