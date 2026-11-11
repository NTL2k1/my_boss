/* Sweet Romantic Love Theme, arranged as an acoustic music box with gentle plucked accompaniment.
   All sound is synthesized locally via Web Audio API; no external audio files or network requests. */
(() => {
  'use strict';
  const beat = 60 / 80; // Gentle, romantic waltz tempo
  const cycleBeats = 32;

  // Romantic melody: "Can't Help Falling in Love" inspired sweet acoustic motif
  const melody = [
    // Phrase 1: Wise men say...
    [67, 1.5], [71, 1.5], [74, 3],
    [76, 1.5], [74, 1.5], [72, 1.5], [71, 1.5],
    [69, 3], [71, 1.5], [72, 1.5],
    [71, 2], [69, 1], [67, 3],

    // Phrase 2: Only fools rush in...
    [67, 1.5], [71, 1.5], [74, 3],
    [76, 1.5], [74, 1.5], [72, 1.5], [71, 1.5],
    [69, 3], [71, 1.5], [72, 1.5],
    [71, 2], [69, 1], [67, 3],

    // Phrase 3: Like a river flows gently to the sea...
    [71, 1.5], [74, 1.5], [76, 2], [77, 1], [76, 3],
    [71, 1.5], [74, 1.5], [76, 2], [77, 1], [76, 3],
    [71, 1.5], [74, 1.5], [76, 2], [74, 1], [72, 2], [71, 1], [69, 3],

    // Phrase 4: So take my hand, take my whole life too...
    [67, 1.5], [71, 1.5], [74, 3],
    [76, 1.5], [74, 1.5], [72, 1.5], [71, 1.5],
    [69, 3], [71, 1.5], [72, 1.5],
    [71, 2], [69, 1], [67, 4]
  ];

  // Warm chord progressions (Root + Third + Fifth arpeggio)
  const harmony = [
    [0, [48, 55, 60]],  // C
    [3, [47, 55, 59]],  // G/B
    [6, [45, 52, 57]],  // Am
    [9, [41, 48, 53]],  // F
    [12, [48, 55, 60]], // C
    [15, [43, 50, 55]], // G
    [18, [45, 52, 57]], // Am
    [21, [41, 48, 53]], // F
    [24, [48, 55, 60]], // C
    [27, [43, 50, 55]], // G
    [30, [48, 55, 64]]  // C (ending warm bell)
  ];

  const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);

  function renderScore(context, destination, start = 0, voices = new Set()) {
    function track(node, connections) {
      voices.add(node);
      node.onended = () => {
        voices.delete(node);
        node.disconnect();
        connections.forEach(n => n.disconnect());
      };
    }

    function tone(note, at, length, level, type = 'sine', harmonic = 1) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency(note) * harmonic;
      const time = start + at * beat;

      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(level, time + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + length);

      oscillator.connect(envelope);
      envelope.connect(destination);
      track(oscillator, [envelope]);
      oscillator.start(time);
      oscillator.stop(time + length + 0.03);
    }

    let cursor = 0;
    melody.forEach(([note, duration]) => {
      const length = Math.min(2.2, duration * beat + 0.45);
      tone(note, cursor, length, 0.095);
      tone(note, cursor, length * 0.6, 0.022, 'sine', 2);
      tone(note, cursor, length * 0.35, 0.008, 'triangle', 3);
      cursor += duration;
    });

    harmony.forEach(([at, chord]) => {
      tone(chord[0] - 12, at, 1.2, 0.06, 'sine');
      [0, 1, 2].forEach((offset, i) => {
        tone(chord[i], at + offset * 0.45, 0.85, 0.025, 'triangle');
      });
    });

    [60, 64, 67, 72, 76, 84].forEach((note, i) => {
      tone(note, 30 + i * 0.15, 1.4, 0.022, 'sine');
    });

    return start + (cursor + 2) * beat;
  }

  function silentWavUrl() {
    const rate = 8000, n = rate / 2, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const w = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    let bin = ''; new Uint8Array(buf).forEach(b => bin += String.fromCharCode(b));
    return 'data:audio/wav;base64,' + btoa(bin);
  }

  function createPlayer() {
    let context, master, timer, pauseTimer, playing = false, starting = null, nextCycle = 0, keepAlive = null;
    let isDucked = false;
    const voices = new Set();

    function schedule() {
      if (playing && nextCycle < context.currentTime + 0.6) {
        nextCycle = renderScore(context, master, nextCycle, voices);
      }
    }

    function initContext() {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return null;
        context = new Audio();
        master = context.createGain();
        master.connect(context.destination);
      }
      return context;
    }

    return {
      get playing() { return playing; },
      play() {
        if (playing) return Promise.resolve();
        if (starting) return starting;
        clearTimeout(pauseTimer);
        const ctx = initContext();
        if (!ctx) return Promise.reject(new Error('Audio is unavailable'));

        try {
          if (!keepAlive) {
            keepAlive = new window.Audio(silentWavUrl());
            keepAlive.loop = true;
            keepAlive.setAttribute('playsinline', '');
          }
          keepAlive.play().catch(() => {});
        } catch {}

        try {
          const tick = ctx.createBufferSource();
          tick.buffer = ctx.createBuffer(1, 1, 22050);
          tick.connect(ctx.destination);
          tick.start(0);
        } catch {}

        const resumed = ctx.resume();
        starting = (async () => {
          try {
            await Promise.race([resumed, new Promise(r => setTimeout(r, 700))]);
            if (ctx.state !== 'running') throw new Error('Audio blocked until user interaction');
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setValueAtTime(0, ctx.currentTime);
            master.gain.linearRampToValueAtTime(isDucked ? 0.08 : 0.7, ctx.currentTime + 0.05);
            playing = true;
            nextCycle = ctx.currentTime + 0.05;
            schedule();
            timer = setInterval(schedule, 200);
          } finally {
            starting = null;
          }
        })();
        return starting;
      },
      stop() {
        playing = false;
        clearInterval(timer);
        clearTimeout(pauseTimer);
        try { keepAlive?.pause(); } catch {}
        if (!context) return;
        const now = context.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0, now, 0.01);
        for (const voice of voices) {
          try { voice.stop(now + 0.04); } catch {}
        }
        pauseTimer = setTimeout(() => {
          if (!playing && context.state === 'running') {
            context.suspend().catch(() => {});
          }
        }, 60);
      },
      duck() {
        if (!context || !master || !playing) return;
        isDucked = true;
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0.08, context.currentTime, 0.15);
      },
      unduck() {
        if (!context || !master || !playing) return;
        isDucked = false;
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0.7, context.currentTime, 0.25);
      },
      flipSound() {
        try {
          const ctx = initContext();
          if (!ctx) return;
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          const len = Math.floor(ctx.sampleRate * 0.12);
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400, ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
          filter.Q.value = 1.0;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.2, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          src.connect(filter);
          filter.connect(g);
          g.connect(ctx.destination);
          src.start();
        } catch {}
      }
    };
  }

  window.BossMusic = Object.freeze({ createPlayer });
})();
