import { AudioManager } from "@matthuggins/platforming-engine";

const audioManager = new AudioManager();

export const { play: playLandSound } = audioManager.register("land", (ctx) => {
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

export const { play: playJumpSound } = audioManager.register("jump", (ctx) => {
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

export const { startLoop: startJetpackSound, stopLoop: stopJetpackSound } = audioManager.register(
  "jetpack",
  (ctx) => {
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
  },
);

export const { play: playCrashSound } = audioManager.register("crash", (ctx) => {
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

export const { play: playAsteroidCrashSound } = audioManager.register(
  "asteroidCrash",
  (ctx, { mass = 400 }: { mass?: number } = {}) => {
    // Intensity scales with asteroid mass (range ~25 for tiny fragments to ~2025 for large asteroids).
    // Normalize to 0..1 where 0 is the smallest fragment and 1 is the largest asteroid.
    const t = Math.min(1, Math.max(0, (mass - 25) / 2000));
    const now = ctx.currentTime;

    const volume = 0.08 + t * 0.35;
    const duration = 0.15 + t * 0.35;

    // Noise burst — the core of the explosion sound.
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Bandpass shapes the noise — lower center freq for bigger asteroids gives a
    // deeper, more thunderous blast; higher freq for small fragments gives a sharp pop.
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(800 - t * 500, now);
    bp.frequency.exponentialRampToValueAtTime(100, now + duration);
    bp.Q.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    // Low-freq concussive thump — scales up with size.
    if (t > 0.15) {
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = "sine";
      thump.frequency.setValueAtTime(60 + t * 40, now);
      thump.frequency.exponentialRampToValueAtTime(20, now + duration * 0.8);
      thumpGain.gain.setValueAtTime(volume * 0.7, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thump.start(now);
      thump.stop(now + duration * 0.8);
    }
  },
);

export const { startLoop: startAmbientSound, stopLoop: stopAmbientSound } = audioManager.register(
  "ambient",
  (ctx) => {
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
  },
);

export const { startLoop: startWalkSound, stopLoop: stopWalkSound } = audioManager.register(
  "walk",
  (ctx) => {
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
  },
);
