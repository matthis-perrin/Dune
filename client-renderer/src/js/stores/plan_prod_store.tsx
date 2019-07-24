export class PlanProdStore {
  private listener: () => void | undefined;
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private refreshTimeout: number | undefined;

  //   private prodInfo: PlanProd = {
  //     prods: [],
  //     speeds: [],
  //     stops: [],
  //   };

  public constructor(private readonly startRange: number, private readonly endRange: number) {}

  public start(listener: () => void): void {
    this.listener = listener;
    this.refresh();
  }

  public stop(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  private refresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.performRefresh()
      .then(() => this.scheduleRefresh())
      .catch(() => this.scheduleRefresh());
  }

  private scheduleRefresh(): void {
    this.refreshTimeout = setTimeout(() => this.refresh(), this.WAIT_BETWEEN_REFRESHES);
  }

  private async performRefresh(): Promise<void> {
    // this.prodInfo = await bridge.getPlanProd(this.day);
    // this.emit();
  }
}
