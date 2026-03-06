let ctx: AudioContext | null = null;
let lastSpawnAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    if (!ctx) {
      ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

export function playSpawnSound(): void {
  const now = Date.now();
  if (now - lastSpawnAt < 80) {
    return; // rate-limit batched spawns to one sound
  }
  lastSpawnAt = now;

  const ac = getCtx();
  if (!ac) {
    return;
  }

  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(330, t + 0.12);

  gain.gain.setValueAtTime(0.04, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(t);
  osc.stop(t + 0.18);
}

export function playPickupSound(delayMs: number): void {
  const ac = getCtx();
  if (!ac) {
    return;
  }

  const t = ac.currentTime + delayMs / 1000;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(370, t);
  osc.frequency.exponentialRampToValueAtTime(740, t + 0.07);

  gain.gain.setValueAtTime(0.045, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(t);
  osc.stop(t + 0.1);
}

export function playDeliverSound(): void {
  const ac = getCtx();
  if (!ac) {
    return;
  }
  const t = ac.currentTime;

  // Two-note ding: C5 then E5
  [523, 659].forEach((freq, i) => {
    const s = t + i * 0.11;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "triangle";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.05, s);
    gain.gain.exponentialRampToValueAtTime(0.0001, s + 0.22);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(s);
    osc.stop(s + 0.22);
  });
}
