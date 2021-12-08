type Listener = () => void;

export abstract class BaseStore {
  private readonly listeners: Listener[] = [];

  public addListener(listener: Listener, dontCallOnAdd: boolean = false): void {
    this.listeners.push(listener);
    if (!dontCallOnAdd) {
      listener();
    }
  }

  public removeListener(listener: Listener): void {
    const listenerIndex = this.listeners.indexOf(listener);
    if (listenerIndex === -1) {
      return;
    }
    this.listeners.splice(listenerIndex, 1);
  }

  protected emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
