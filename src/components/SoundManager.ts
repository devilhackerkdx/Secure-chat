class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {
      console.warn("Audio Context Click failed to initialize:", e);
    }
  }

  public playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {}
  }

  public playMessageSent() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  public playChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Chime chord
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, index) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq, now + index * 0.04);
        
        g.gain.setValueAtTime(0.05, now + index * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.4);
        
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(now + index * 0.04);
        o.stop(now + index * 0.04 + 0.45);
      });
    } catch (e) {}
  }

  private ringOscs: OscillatorNode[] = [];
  private ringInterval: any = null;

  public startRingtone() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      this.stopRingtone();
      
      const playRing = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const o1 = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        o1.type = "sine";
        o1.frequency.setValueAtTime(440, now);
        o1.frequency.linearRampToValueAtTime(480, now + 1);

        o2.type = "sine";
        o2.frequency.setValueAtTime(480, now);
        o2.frequency.linearRampToValueAtTime(520, now + 1);

        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1);

        o1.connect(g);
        o2.connect(g);
        g.connect(this.ctx.destination);

        o1.start();
        o2.start();
        o1.stop(now + 1.1);
        o2.stop(now + 1.1);
        
        this.ringOscs.push(o1, o2);
      };

      playRing();
      this.ringInterval = setInterval(() => {
        playRing();
      }, 1400);
    } catch (e) {}
  }

  public stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    this.ringOscs.forEach(o => {
      try { o.stop(); } catch(e){}
    });
    this.ringOscs = [];
  }
}

export const sounds = new SoundManager();
