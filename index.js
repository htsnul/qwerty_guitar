let audioCtx = null;
let guitarStrings = null;
let noteNumberOffset = 0;

class GuitarString {
  constructor(parentTable, index, noteNumberBase, keys) {
    this.parentTable;
    this.index = index;
    this.noteNumberBase = noteNumberBase;
    this.keys = keys;
    addEventListener("keydown", (event) => {
      createAudioContextIfNeeded();
      const i = this.keys.indexOf(event.key);
      if (i === -1) return;
      this.start(i);
    });
    this.trElm = document.createElement("tr");
    parentTable.appendChild(this.trElm);
    this.render();
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
    const td = this.trElm.querySelector(`td:nth-of-type(${i + noteNumberOffset + 1})`);
    td.style.transition = "background 0s";
    td.style.background = "#c0f0f0";
    setTimeout(() => {
      td.style.transition = "background 3s";
      const sn = [noteNumber % 12];
      const sc = ["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B", ""][sn];
      td.style.background = sc !== "" ? "#ffffff" : "#f0f0f0";
    }, 0);
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
  render() {
    const tr = this.trElm;
    tr.innerHTML = "";
    for (let i = 0; i < 25; ++i) {
      const noteNumber = this.noteNumberBase + i;
      const sn = [noteNumber % 12];
      const on = Math.floor(noteNumber / 12) - 1;
      const sc = ["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B", ""][sn];
      const key = (this.keys[i - noteNumberOffset] ?? "").toUpperCase();
      const td = document.createElement("td");
      td.style.width = "20px";
      td.style.background = sc !== "" ? "#ffffff" : "#f0f0f0";
      const divS = document.createElement("div");
      divS.style.display = "grid";
      divS.style.justifyContent = "center";
      divS.style.alignItems = "center";
      divS.style.height = "16px";
      divS.style.color = "#c0c0c0";
      divS.innerHTML = `<div>${sc}${sc !== "" ? on : ""}</div>`;
      const divK = document.createElement("div");
      divK.style.display = "grid";
      divK.style.justifyContent = "center";
      divK.style.alignItems = "center";
      divK.style.height = "16px";
      td.appendChild(divS);
      td.appendChild(divK);
      tr.appendChild(td);
    }
    this.renderKeyChars();
  }
  renderKeyChars() {
    const tr = this.trElm;
    for (let i = 0; i < 25; ++i) {
      const key = (this.keys[i - noteNumberOffset] ?? "").toUpperCase();
      const divK = tr.querySelector(`td:nth-of-type(${i + 1}) > div:nth-of-type(2)`);
      divK.innerHTML = `<div>${key ? key : ""}</div>`;
    }
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
  guitarStrings.forEach((gs) => gs.renderKeyChars());
}

onload = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    table {
      border-collapse: collapse;
      font-size: 12px;
      margin: 8px 0;
    }
    table th {
      font-weight: normal;
      color: #808080;
      height: 20px;
    }
    table th, td {
      border: 1px solid #e0e0e0;
    }
  `;
  document.head.appendChild(style);
  const tables = [];
  for (let i = 0; i < 2; ++i) {
    const table = document.createElement("table");
    if (i === 1) {
      table.style.direction = "rtl";
    }
    table.innerHTML = `
      <tr>
        <th></th>
        <th colspan="10">[</th>
        <th colspan="10">]</th>
        <th colspan="4"></th>
      </tr>
      <tr>
        <th></th>
        <th>0</th>
        <th>1</th>
        <th>2</th>
        <th>3</th>
        <th>4</th>
        <th>5</th>
        <th>6</th>
        <th>7</th>
        <th>8</th>
        <th>9</th>
        <th>0</th>
        <th>1</th>
        <th>2</th>
        <th>3</th>
        <th>4</th>
        <th>5</th>
        <th>6</th>
        <th>7</th>
        <th>8</th>
        <th>9</th>
        <th colspan="4"></th>
      </tr>
    `;
    document.body.appendChild(table);
    tables[i] = table;
  }
  guitarStrings = [
    new GuitarString(tables[0], 0, 60 + 0 * 12 + 4 - 1, "yuiop"),
    new GuitarString(tables[0], 1, 60 - 1 * 12 + 11 - 1, "hjkl;"),
    new GuitarString(tables[0], 2, 60 - 1 * 12 + 7 - 1, "nm,./"),
    new GuitarString(tables[1], 3, 60 - 1 * 12 + 2 - 1, "trewq"),
    new GuitarString(tables[1], 4, 60 - 2 * 12 + 9 - 1, "gfdsa"),
    new GuitarString(tables[1], 5, 60 - 2 * 12 + 4 - 1, "bvcxz"),
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

