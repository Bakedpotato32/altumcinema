class AudioEngine {
  constructor() {
    this.ctx = null;
    this.source = null;
    this.gainNode = null;
    this.bassNode = null;
    this.filters = [];
    this.frequencies = [60, 250, 1000, 4000, 12000];
    this.connectedElement = null;
  }

  init(videoElement) {
    if (!videoElement) return;
    if (this.connectedElement === videoElement && this.ctx) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioContextClass();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (this.source) {
        try { this.source.disconnect(); } catch (e) {}
      }

      this.connectedElement = videoElement;
      this.source = this.ctx.createMediaElementSource(videoElement);

      // 200% Volume Boost Pre-Amp Gain Node
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;

      // Bass Booster Lowshelf
      this.bassNode = this.ctx.createBiquadFilter();
      this.bassNode.type = 'lowshelf';
      this.bassNode.frequency.value = 100;
      this.bassNode.gain.value = 0;

      // 5-Band Graphic Equalizer
      this.filters = this.frequencies.map((freq, i) => {
        const filter = this.ctx.createBiquadFilter();
        if (i === 0) {
          filter.type = 'lowshelf';
        } else if (i === this.frequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Chain: Source -> Gain (200% Boost) -> Bass -> 5 Filters -> Destination
      let lastNode = this.source;
      lastNode.connect(this.gainNode);
      lastNode = this.gainNode;

      lastNode.connect(this.bassNode);
      lastNode = this.bassNode;

      for (let filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(this.ctx.destination);
    } catch (err) {
      console.warn('AudioEngine WebAudio initialization error:', err);
    }
  }

  // Volume: 0 to 200 (100 is standard 1.0x, 200 is 2.0x boost)
  setVolumeMultiplier(levelPercent) {
    if (this.gainNode && this.ctx) {
      const mult = Math.max(0, levelPercent / 100);
      this.gainNode.gain.setTargetAtTime(mult, this.ctx.currentTime, 0.03);
    }
  }

  setBassBoost(gainDb) {
    if (this.bassNode && this.ctx) {
      this.bassNode.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05);
    }
  }

  setBandGain(index, gainDb) {
    if (this.filters[index] && this.ctx) {
      this.filters[index].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05);
    }
  }

  applyPreset(presetGains, bassDb = 0) {
    if (!presetGains || presetGains.length !== 5) return;
    this.setBassBoost(bassDb);
    presetGains.forEach((gain, i) => this.setBandGain(i, gain));
  }
}

export const audioEngine = new AudioEngine();
