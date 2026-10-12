/**
 * Audio Synthesizer for Revision Sprint (ADHD & Deep Focus Mode)
 * Built with Web Audio API. 100% offline, zero external audio asset dependencies.
 */

export class AudioSynthesizer {
  static ctx = null;
  static currentSource = null;
  static currentType = "off";

  static initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  static stop() {
    if (this.currentSource) {
      try {
        if (this.currentSource.stop) this.currentSource.stop();
        if (this.currentSource.disconnect) this.currentSource.disconnect();
      } catch (e) {
        // ignore
      }
      this.currentSource = null;
    }
    this.currentType = "off";
  }

  static playSound(type) {
    this.stop();
    if (type === "off") return;

    this.initContext();
    this.currentType = type;

    if (type === "binaural") {
      this.playBinauralAlpha();
    } else if (type === "brown") {
      this.playBrownNoise();
    } else if (type === "rain") {
      this.playRainSound();
    }
  }

  /**
   * 10Hz Binaural Alpha Wave Drone (Calm Focus)
   */
  static playBinauralAlpha() {
    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();
    const merger = this.ctx.createChannelMerger(2);
    const masterGain = this.ctx.createGain();

    oscL.type = "sine";
    oscL.frequency.setValueAtTime(216, this.ctx.currentTime); // 216 Hz left

    oscR.type = "sine";
    oscR.frequency.setValueAtTime(226, this.ctx.currentTime); // 226 Hz right (10Hz delta)

    masterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    oscL.start();
    oscR.start();

    this.currentSource = {
      stop: () => {
        oscL.stop();
        oscR.stop();
      },
      disconnect: () => {
        masterGain.disconnect();
      }
    };
  }

  /**
   * Deep Brown Noise (Low rumble for blocking background lab chatter)
   */
  static playBrownNoise() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();

    this.currentSource = {
      stop: () => whiteNoise.stop(),
      disconnect: () => gain.disconnect()
    };
  }

  /**
   * Synthetic Rain Simulation
   */
  static playRainSound() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();

    this.currentSource = {
      stop: () => noise.stop(),
      disconnect: () => gain.disconnect()
    };
  }

  /**
   * Gentle Zen Chime for Milestone / Sprint Completion
   */
  static playBellChime() {
    this.initContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.8);
  }
}
