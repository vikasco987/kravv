/**
 * SoundManager — Multiple distinct sound effects for Kravv app.
 *
 * Sound profiles (each clearly different):
 *  click   – single beep 1000 Hz, 50ms         (generic button)
 *  add     – rising double-beep 800+1400 Hz     (item added to cart)
 *  remove  – soft low beep 500 Hz, 60ms         (qty decreased)
 *  delete  – falling double-beep 900+400 Hz     (item deleted)
 *  hold    – triple beep 650 Hz x3              (order held)
 *  print   – long low beep 300 Hz, 300ms        (bill printed)
 *  success – 3 ascending tones 600+900+1300 Hz  (printer connected)
 */
import { Audio } from "expo-av";

type SoundKey =
  | "click"
  | "add"
  | "remove"
  | "delete"
  | "hold"
  | "print"
  | "success";

/* eslint-disable @typescript-eslint/no-var-requires */
const ASSETS: Record<SoundKey, any> = {
  click: require("../assets/sounds/click.wav"),
  add: require("../assets/sounds/add.wav"),
  remove: require("../assets/sounds/remove.wav"),
  delete: require("../assets/sounds/delete.wav"),
  hold: require("../assets/sounds/hold.wav"),
  print: require("../assets/sounds/print.wav"),
  success: require("../assets/sounds/success.wav"),
};
/* eslint-enable @typescript-eslint/no-var-requires */

class SoundManagerClass {
  private sounds: Partial<Record<SoundKey, Audio.Sound>> = {};
  private ready = false;
  private lastClickMs = 0;
  private suppressFlag = false; // blocks next play() call (set by suppressNextPlay)
  private suppressTimer: ReturnType<typeof setTimeout> | null = null;

  async init(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const loaded: string[] = [];
      const failed: string[] = [];

      await Promise.all(
        (Object.entries(ASSETS) as [SoundKey, any][]).map(
          async ([key, asset]) => {
            try {
              const { sound } = await Audio.Sound.createAsync(asset, {
                shouldPlay: false,
                volume: 1.0,
              });
              this.sounds[key] = sound;
              loaded.push(key);
            } catch (e) {
              failed.push(key);
              console.log(`[SoundManager] FAILED to load "${key}":`, e);
            }
          },
        ),
      );

      this.ready = loaded.length > 0;
      console.log(`[SoundManager] Ready. Loaded: [${loaded.join(", ")}]${failed.length ? ` | Failed: [${failed.join(", ")}]` : ""}`);
    } catch (e) {
      console.log("[SoundManager] init error:", e);
    }
  }

  private fireSound(key: SoundKey): void {
    if (!this.ready) {
      console.log(`[SoundManager] not ready — skipping "${key}"`);
      return;
    }
    const sound = this.sounds[key];
    if (!sound) {
      console.log(`[SoundManager] "${key}" not loaded`);
      return;
    }
    console.log(`[SoundManager] ▶ ${key}`);
    sound.replayAsync().catch((e) =>
      console.log(`[SoundManager] "${key}" play error:`, e),
    );
  }

  /** Generic UI click — debounced 80 ms to avoid double-fire from global touch trigger. */
  play(): void {
    if (!this.ready) return;
    if (this.suppressFlag) {
      this.suppressFlag = false; // consume the suppress
      if (this.suppressTimer) { clearTimeout(this.suppressTimer); this.suppressTimer = null; }
      return; // blocked — a specific-action sound is handling this touch
    }
    const now = Date.now();
    if (now - this.lastClickMs < 80) return;
    this.lastClickMs = now;
    this.fireSound("click");
  }

  /**
   * Call this BEFORE SoundManager.play() fires (i.e., from onPressIn of a
   * button that has its own specific sound). Ensures the generic click is
   * suppressed for that touch so only ONE sound plays.
   */
  suppressNextPlay(): void {
    this.suppressFlag = true;
    if (this.suppressTimer) clearTimeout(this.suppressTimer);
    // Safety: auto-clear after 200 ms in case play() is never called
    this.suppressTimer = setTimeout(() => {
      this.suppressFlag = false;
      this.suppressTimer = null;
    }, 200);
  }

  /** Item added to cart — rising double-beep (800→1400 Hz). */
  playAdd(): void { this.fireSound("add"); }

  /** Item quantity decreased — soft low beep (500 Hz). */
  playRemove(): void { this.fireSound("remove"); }

  /** Item fully removed from cart — falling double-beep (900→400 Hz). */
  playDelete(): void { this.fireSound("delete"); }

  /** Order paused / held — triple beep (650 Hz × 3). */
  playHold(): void { this.fireSound("hold"); }

  /** Bill printed — long low beep (300 Hz, 300 ms). */
  playPrint(): void { this.fireSound("print"); }

  /** Printer connected — three ascending tones (600→900→1300 Hz). */
  playSuccess(): void { this.fireSound("success"); }

  async destroy(): Promise<void> {
    for (const sound of Object.values(this.sounds)) {
      try { await sound?.unloadAsync(); } catch (_) { }
    }
    this.sounds = {};
    this.ready = false;
  }
}

export const SoundManager = new SoundManagerClass();
