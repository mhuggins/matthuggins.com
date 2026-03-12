import { AudioManager } from "@matthuggins/platforming-engine";

const audioManager = new AudioManager();

audioManager.register("land", (ctx) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.18);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.18);
});

audioManager.register("jump", (ctx) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
});

audioManager.register("jetpack", (ctx) => {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc1.type = "sawtooth";
  osc1.frequency.value = 80;
  osc2.type = "sawtooth";
  osc2.frequency.value = 82;

  filter.type = "lowpass";
  filter.frequency.value = 200;
  filter.Q.value = 1;

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();

  return () => {
    const stopTime = ctx.currentTime + 0.15;
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, stopTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  };
});

audioManager.register("crash", (ctx) => {
  const sineOsc = ctx.createOscillator();
  const sineGain = ctx.createGain();
  sineOsc.type = "sine";
  sineOsc.frequency.setValueAtTime(600, ctx.currentTime);
  sineOsc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
  sineGain.gain.setValueAtTime(0.3, ctx.currentTime);
  sineGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
  sineOsc.connect(sineGain);
  sineGain.connect(ctx.destination);
  sineOsc.start(ctx.currentTime);
  sineOsc.stop(ctx.currentTime + 0.2);

  const squareOsc = ctx.createOscillator();
  const squareGain = ctx.createGain();
  squareOsc.type = "square";
  squareOsc.frequency.setValueAtTime(90, ctx.currentTime);
  squareOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
  squareGain.gain.setValueAtTime(0.25, ctx.currentTime);
  squareGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
  squareOsc.connect(squareGain);
  squareGain.connect(ctx.destination);
  squareOsc.start(ctx.currentTime);
  squareOsc.stop(ctx.currentTime + 0.25);
});

audioManager.register("ambient", (ctx) => {
  const bufferSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  // Three cascaded lowpass filters at 80 Hz give a steep rolloff (-36 dB/octave)
  // so only the very deep rumble passes through — no audible static.
  const lp1 = ctx.createBiquadFilter();
  lp1.type = "lowpass";
  lp1.frequency.value = 120;
  const lp2 = ctx.createBiquadFilter();
  lp2.type = "lowpass";
  lp2.frequency.value = 120;
  const lp3 = ctx.createBiquadFilter();
  lp3.type = "lowpass";
  lp3.frequency.value = 120;

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.7;

  // Narrow bandpass at 220 Hz — adds a whisper of airflow texture
  const rushBp = ctx.createBiquadFilter();
  rushBp.type = "bandpass";
  rushBp.frequency.value = 220;
  rushBp.Q.value = 1.2;

  const rushGain = ctx.createGain();
  rushGain.gain.value = 0.18;

  // Minimal delay for a hint of distance
  const delay = ctx.createDelay(0.5);
  delay.delayTime.value = 0.35;
  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.45;
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.5;
  delay.connect(feedbackGain);
  feedbackGain.connect(delay);
  delay.connect(wetGain);

  // Slow swell LFO on the rumble for natural organic variation
  const swellLfo = ctx.createOscillator();
  swellLfo.type = "sine";
  swellLfo.frequency.value = 0.04 + Math.random() * 0.04;
  const swellDepth = ctx.createGain();
  swellDepth.gain.value = 0.5;
  swellLfo.connect(swellDepth);
  swellDepth.connect(rumbleGain.gain);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
  masterGain.connect(ctx.destination);

  noise.connect(lp1);
  lp1.connect(lp2);
  lp2.connect(lp3);
  lp3.connect(rumbleGain);
  rumbleGain.connect(masterGain);
  rumbleGain.connect(delay);

  noise.connect(rushBp);
  rushBp.connect(rushGain);
  rushGain.connect(masterGain);

  wetGain.connect(masterGain);

  noise.start();
  swellLfo.start();

  return () => {
    const stopTime = ctx.currentTime;
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, stopTime);
    noise.stop(stopTime);
    swellLfo.stop(stopTime);
  };
});

audioManager.register("walk", (ctx) => {
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 250;
  bp.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.08);

  noise.connect(bp);
  bp.connect(gain);
  gain.connect(ctx.destination);

  noise.start();

  return () => {
    const stopTime = ctx.currentTime + 0.1;
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, stopTime);
    noise.stop(stopTime);
  };
});

export function playLandSound(): void {
  audioManager.play("land");
}

export function playJumpSound(): void {
  audioManager.play("jump");
}

export function startWalkSound(): void {
  audioManager.startLoop("walk");
}

export function stopWalkSound(): void {
  audioManager.stopLoop("walk");
}

export function startJetpackSound(): void {
  audioManager.startLoop("jetpack");
}

export function stopJetpackSound(): void {
  audioManager.stopLoop("jetpack");
}

export function playCrashSound(): void {
  audioManager.play("crash");
}

export function startAmbientSound(): void {
  audioManager.startLoop("ambient");
}

export function stopAmbientSound(): void {
  audioManager.stopLoop("ambient");
}
