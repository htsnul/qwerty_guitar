let audioCtx = null;
let guitarStrings = null;
let noteNumberOffset = 0;

class GuitarString {
  constructor(index, noteNumberBase, keys) {
    this.index = index;
    this.noteNumberBase = noteNumberBase;
    this.keys = keys;
    addEventListener("keydown", (event) => {
      createAudioContextIfNeeded();
      const i = this.keys.indexOf(event.key);
      if (i === -1) return;
      this.start(i);
    });
  }
  start(i) {
    if (this.oscillator) {
      this.stop();
    }
    this.gain = audioCtx.createGain();
    this.gain.gain.setValueAtTime(1 / 8, audioCtx.currentTime);
    this.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 1);
    this.gain.connect(audioCtx.destination);
    this.biquadFilter = audioCtx.createBiquadFilter();
    this.biquadFilter.type = "lowpass";
    this.biquadFilter.frequency.value = 2 * 440;
    this.biquadFilter.Q.value = 0;
    this.biquadFilter.connect(this.gain);
    this.oscillator = audioCtx.createOscillator();
    this.oscillator.type = 'sawtooth';
    const noteNumber = this.noteNumberBase + i + noteNumberOffset;
    this.oscillator.frequency.value = 440 * Math.pow(2, (noteNumber - 69) / 12);
    this.oscillator.connect(this.biquadFilter);
    this.oscillator.start();
  }
  stop() {
    if (!this.oscillator) {
      return;
    }
    this.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 1 / 16);
    this.oscillator.stop(audioCtx.currentTime + 1);
    const stoppingNodes = [];
    stoppingNodes.push(this.gain);
    stoppingNodes.push(this.oscillator);
    this.oscillator.onended = () => stoppingNodes.forEach((n) => n.disconnect());
    this.gain = null;
    this.oscillator = null;
  }
}

function createAudioContext() {
  audioCtx = new AudioContext();
}

function createAudioContextIfNeeded() {
  if (audioCtx) return;
  createAudioContext();
}

function renderNoteNumberOffset()
{
  let elm = document.querySelector("#note-number-offset-div");
  if (!elm) {
    elm = document.createElement("div");
    elm.id = "note-number-offset-div";
    document.body.appendChild(elm);
  }
  elm.innerHTML = `Note Number Offset: ${noteNumberOffset}`;
}

onload = () => {
  guitarStrings = [
    new GuitarString(0, 60 - 2 * 12 + 4 - 1, "bvcxz"),
    new GuitarString(1, 60 - 2 * 12 + 9 - 1, "gfdsa"),
    new GuitarString(2, 60 - 1 * 12 + 2 - 1, "trewq"),
    new GuitarString(3, 60 - 1 * 12 + 7 - 1, "nm,./"),
    new GuitarString(4, 60 - 1 * 12 + 11 - 1, "hjkl;"),
    new GuitarString(5, 60 + 0 * 12 + 4 - 1, "yuiop"),
  ];
  addEventListener("keydown", (event) => {
    if ([..."0123456789"].includes(event.key)) {
      noteNumberOffset = Number(event.key);
      renderNoteNumberOffset();
    }
    if (event.key === "ArrowLeft") {
      noteNumberOffset--;
      renderNoteNumberOffset();
    }
    if (event.key === "ArrowRight") {
      noteNumberOffset++;
      renderNoteNumberOffset();
    }
    if (event.key === " ") {
      guitarStrings.forEach((s) => s.stop());
    }
    renderNoteNumberOffset();
  });
};

