import {BridgeTransport} from '@shared/bridge/bridge_renderer';
import {ServerGetStatus, BridgeCommand} from '@shared/bridge/commands';
import {ServerStatus} from '@shared/models';

class Bridge {
  private readonly bridgeTransport = new BridgeTransport(() => {});

  public async getServerStatus(): Promise<ServerStatus> {
    return this.bridgeTransport.sendBridgeCommand(ServerGetStatus);
  }
  // AP
  public async simulateAutomateSpeed(
    speed: number | undefined,
    minutes: number,
    serverSimulateAutomate: BridgeCommand
  ): Promise<ServerStatus> {
    return this.bridgeTransport.sendBridgeCommand(serverSimulateAutomate, {speed, minutes});
  }
}

export const bridge = new Bridge();
