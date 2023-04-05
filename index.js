let audioCtx = null;
let guitarStrings = null;
let noteNumberOffset10 = 0;
let noteNumberOffset1 = 0;

function getNoteNumberOffset() {
  return noteNumberOffset10 + noteNumberOffset1;
}

function renderStyle() {
  const style = document.createElement("style");
  style.innerHTML = `
    table {
      border-collapse: collapse;
      font-size: 12px;
      margin: 8px auto;
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
}

function renderTable() {
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th colspan="4"></th>
        <th colspan="10">]</th>
        <th colspan="10">[</th>
        <th></th>
        <th></th>
        <th colspan="10">[</th>
        <th colspan="10">]</th>
        <th colspan="4"></th>
      </tr>
      <tr>
        <th colspan="4"></th>
        ${[...Array(20)].map((_, i) => `<th>${(19 - i) % 10}</th>`).join("")}
        <th></th>
        <th></th>
        ${[...Array(20)].map((_, i) => `<th>${i % 10}</th>`).join("")}
        <th colspan="4"></th>
      </tr>
    </thead>
  `;
  document.body.appendChild(table);
  renderNoteNumberOffsetBackgrounds();
}

function renderNoteNumberOffsetBackgrounds() {
  const thead = document.querySelector("table > thead");
  const tr10 = thead.querySelector("tr:nth-of-type(1)");
  for (let i = 0; i < 2; ++i) {
    for (let j = 0; j < 2; ++j) {
      const th10 = (
        j === 0
        ? tr10.querySelector(`th:nth-of-type(${4 + (1 + i) + 1})`)
        : tr10.querySelector(`th:nth-of-type(${4 - (1 + i) + 0})`)
      );
      th10.style.backgroundColor = i === noteNumberOffset10 / 10 ? "#f0f0f0" : "transparent";
    }
  }
  const tr1 = thead.querySelector("tr:nth-of-type(2)");
  const noteNumberOffset = getNoteNumberOffset();
  for (let i = 0; i < 20; ++i) {
    for (let j = 0; j < 2; ++j) {
      const th1 = (
        j === 0
        ? tr1.querySelector(`th:nth-of-type(${22 + (1 + i) + 1})`)
        : tr1.querySelector(`th:nth-of-type(${22 - (1 + i) + 0})`)
      );
      th1.style.backgroundColor = i === noteNumberOffset ? "#f0f0f0" : "transparent";
    }
  }
}

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
    const noteNumberOffset = getNoteNumberOffset();
    const noteNumber = this.noteNumberBase + i + noteNumberOffset;
    this.oscillator.frequency.value = 440 * Math.pow(2, (noteNumber - 69) / 12);
    this.oscillator.connect(this.biquadFilter);
    this.oscillator.start();
    for (let j = 0; j < 2; ++j) {
      const td = (
        j === 0
        ? this.trElm.querySelector(`td:nth-of-type(${25 + (i + noteNumberOffset) + 1})`)
        : this.trElm.querySelector(`td:nth-of-type(${25 - (i + noteNumberOffset) + 0})`)
      );
      td.style.transition = "background 0s";
      td.style.background = "#c0f0f0";
      setTimeout(() => {
        td.style.transition = "background 1s";
        const sn = [noteNumber % 12];
        const sc = ["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B", ""][sn];
        td.style.background = sc !== "" ? "#ffffff" : "#f0f0f0";
      }, 0);
    }
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
    const noteNumberOffset = getNoteNumberOffset();
    for (let i = 0; i < 25; ++i) {
      const noteNumber = this.noteNumberBase + i;
      const sn = [noteNumber % 12];
      const on = Math.floor(noteNumber / 12) - 1;
      const sc = ["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B", ""][sn];
      const key = (this.keys[i - noteNumberOffset] ?? "").toUpperCase();
      for (let j = 0; j < 2; ++j) {
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
        if (j === 0) {
          tr.appendChild(td);
        } else {
          tr.insertBefore(td, tr.firstChild);
        }
      }
    }
    this.renderKeyChars();
  }
  renderKeyChars() {
    const tr = this.trElm;
    const noteNumberOffset = getNoteNumberOffset();
    for (let i = 0; i < 25; ++i) {
      const key = (this.keys[i - noteNumberOffset] ?? "").toUpperCase();
      const td = (
        this.index < 3
        ? tr.querySelector(`td:nth-of-type(${25 + i + 1})`)
        : tr.querySelector(`td:nth-of-type(${25 - i + 0})`)
      );
      const divK = td.querySelector("div:nth-of-type(2)");
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
  renderNoteNumberOffsetBackgrounds();
  guitarStrings.forEach((gs) => gs.renderKeyChars());
}

function onKeyDown(event) {
  if (event.key === "[") {
    noteNumberOffset10 = 0;
    renderNoteNumberOffset();
  }
  if (event.key === "]") {
    noteNumberOffset10 = 10;
    renderNoteNumberOffset();
  }
  if ([..."0123456789"].includes(event.key)) {
    noteNumberOffset1 = Number(event.key);
    renderNoteNumberOffset();
  }
  if (event.key === " ") {
    guitarStrings.forEach((s) => s.stop());
  }
  renderNoteNumberOffset();
}

onload = () => {
  renderStyle();
  renderTable();
  const table = document.querySelector("table");
  guitarStrings = [
    new GuitarString(table, 0, 60 + 0 * 12 + 4 - 1, "yuiop"),
    new GuitarString(table, 1, 60 - 1 * 12 + 11 - 1, "hjkl;"),
    new GuitarString(table, 2, 60 - 1 * 12 + 7 - 1, "nm,./"),
    new GuitarString(table, 3, 60 - 1 * 12 + 2 - 1, "trewq"),
    new GuitarString(table, 4, 60 - 2 * 12 + 9 - 1, "gfdsa"),
    new GuitarString(table, 5, 60 - 2 * 12 + 4 - 1, "bvcxz"),
  ];
  addEventListener("keydown", (event) => onKeyDown(event));
};

