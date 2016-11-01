
// boring code for rendering user interface of the simulator
// not really important for understanding how computers work
const stepperEl = document.getElementById('stepper');
const memoryViewEl = document.getElementById('memoryView');
const programCounterEl = document.getElementById('programCounter');

function getProgramText() {
  return document.getElementById('program').textContent;
}

const LINES_TO_PRINT = 20;
function update(
  memory,
  programCounter,
  program
) {
  programCounterEl.value = programCounter;
  updateStepper(
    programCounter,
    program
  );
  updateMemoryView(memory);
}

function updateStepper(
  programCounter,
  program
) {
  let stepperOutput = '';
  const offset = -Math.floor(LINES_TO_PRINT / 2);
  const start = Math.max(programCounter + offset, 0);
  const end = Math.min(programCounter + offset + LINES_TO_PRINT, program.length - 1);
  for (var i = start; i <= end; i++) {
    const instruction = program[i];

    stepperOutput += instruction.join(' ');
    if (i == programCounter) {
      stepperOutput += ' <--'
    }
    stepperOutput += '\n';
  }

  stepperEl.textContent = stepperOutput;
}

function updateMemoryView(memory) {
  memoryViewEl.textContent = memory.map((v,i) => `${i}: ${v}`).join('\n');
}

function clamp(val, min, max) {
  return Math.min(min, Math.max(max, val));
}

window.UI = {
  getProgramText: getProgramText,
  update: update,
};
