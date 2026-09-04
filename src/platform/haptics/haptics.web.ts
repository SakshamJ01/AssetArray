import { IHapticsAdapter } from "./types";

class WebHapticsAdapter implements IHapticsAdapter {
  private vibrate(pattern: number | number[]): void {
    try {
      if (typeof window !== "undefined" && "navigator" in window && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch {
      // browser permissions / unsupported environment
    }
  }

  async selection(): Promise<void> {
    this.vibrate(5);
  }

  async lightImpact(): Promise<void> {
    this.vibrate(10);
  }

  async mediumImpact(): Promise<void> {
    this.vibrate(20);
  }

  async successNotification(): Promise<void> {
    this.vibrate([15, 30, 15]);
  }

  async warningNotification(): Promise<void> {
    this.vibrate([25, 40, 25]);
  }

  async errorNotification(): Promise<void> {
    this.vibrate([40, 50, 40]);
  }
}

export const hapticsAdapter: IHapticsAdapter = new WebHapticsAdapter();
