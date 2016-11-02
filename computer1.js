
// We are going to use an array to simulate computer memory. We can store a
// Number value at each position in the array.
const MEMORY = [];

// The total amount of 'slots', or memory addresses, we are going to
// have to store data values at. Real computers have memory which can be read as
// individual bytes, as well as in larger or smaller increments, but we will be
// simulating it using an array of Number values, which we'll access by index.
const TOTAL_MEMORY_SIZE = 1000;

// The program will be loaded into memory starting at this slot.
const PROGRAM_START = 600;

// As we move through our program, we need to keep track of where we are up to.
// In a real computer, there is a small piece of memory inside the CPU which
// holds this information, and the program counter contains a memory address 
// pointing to the start of the program in memory. However for our simulation we
// will be representing the program as an array of instructions, so this counter
// keeps track of the array index of the instruction we're currently at.
let programCounter = 0;

// Our program is represented as an array, with each item itself being an array
// which contains the instruction name, followed by the arguments to the
// instruction, if any. We'll include a button in the user interface for loading
// the program code.
let program = [];

// We'll keep a map of the 'label' instructions in the program so we can
// jump to them later on. More on this later.
const labelLocations = {};

// Store a value at a certain address in memory
function setMem(address, value) {
  if (address < 0 || address >= TOTAL_MEMORY_SIZE) {
    throw new Error('tried to write to an invalid memory address');
  }
  MEMORY[address] = value;
}

// Get the value which is stored at a certain address in memory
function getMem(address) {
  if (address < 0 || address >= TOTAL_MEMORY_SIZE) {
    throw new Error('tried to read from an invalid memory address');
  }
  return MEMORY[address];
}

const instructions = {
  // We expose our memory setting function to be used in our program so that the
  // program code can initialize values in memory with whatever values they
  // need.
  'set_data': function(startAddress, data) {
    let currentAddress = startAddress;
    for (const value of data) {
      setMem(currentAddress, data);
      currentAddress++;
    }
  },
  'set_value': function(address, value) {
    setMem(address, value);
  },
  // add the value at the address 'a' with the value at the address 'b' and
  // store them at the address 'out'
  'add': function(aAddr, bAddr, outAddr) {
    const aVal = getMem(aAddr);
    const bVal = getMem(bAddr);
    const outVal = aVal + bVal;
    setMem(outAddr, outVal);
  },
  'label': function() {
    // don't actually do anything for the 'label' instruction, it's just here to
    // mark a place in the program so that we can jump to it as needed
  },
  'jump_to': function(labelName) {

  },
};

// we'll set up a mapping between our instruction names and the values we will
// compile them into (which will be interpreted by our simulated cpu as it runs
// the program)
const instructionsOpcodes = new Map();
const opcodesInstructions = new Map();

Object.keys(instructions).forEach((instructionName, index) => {
  const opcode = index + 100; // opcodes start at 100
  instructionsOpcodes.set(instructionName, opcode);
  opcodesInstructions.set(opcode, instructionName);
});

// In a real computer, memory addresses which have never had any value set are
// considered 'uninitialized', and might contain any garbage value, but to keep
// our simulation simple we're going to initialize every location with the value
// 0. However, just like in a real computer, in our simulation it is possible
// for us to mistakenly read from the wrong place in memory if we have a bug in
// our simulated program where we get the memory address wrong.
for (var i = 0; i < TOTAL_MEMORY_SIZE; i++) {
  MEMORY[i] = 0;
}

// We use a simple text-based language to input our program, which we will
// convert into the array representation described earlier. This is our
// equivalent of an assembly language.
// We parse the program text into our array form by splitting the text into
// lines, then splitting those lines into tokens (words), which gives us to an
// instruction name and arguments for that instruction, from each line.
function parseProgramText(programText) {
  const programInstructions = [];
  const lines = programText.split('\n');
  for (const line of lines) {
    const instruction = [];
    let tokens = line.split(' ');
    for (const token of tokens) {
      // skip empty tokens
      if (token == null || token == "") {
        continue;
      }
      // first token
      if (instruction.length == 0) {
        instruction.push(token); // instruction name token
      } else {
        instruction.push(parseInt(token, 0)); // turn token text into Number value
      }
    }
    //  if instruction was found on this line, add it to the program
    if (instruction.length) {
      programInstructions.push(instruction);
    }
  }
  return programInstructions;
}

function assembleAndLoadProgram(program) {
  let loadingAddress = PROGRAM_START;
  for (const instruction of program) {
    MEMORY[loadingAddress++] = instructionsOpcodes.get(instruction[0]);
    for (var i = 1; i < instruction.length; i++) {
      MEMORY[loadingAddress++] = instruction[i];
    }
  }
}

// Advance the program counter and run the instruction at the new position.
// Returns true once the program is finished.
function step() {
  if (programCounter >= program.length) {
    return true;
  }
  const instruction = program[programCounter];
  const [name] = instruction;
  const args = instruction.slice(1, instruction.length);
  instructions[name].apply(null, args);
  programCounter++;
  return false;
}

function stepOnce() {
  step();
  updateUI(MEMORY, programCounter, program);
}
function runToEnd() {
  let done = false;
  while(!done) {
    done = step();
  }

  updateUI(MEMORY, programCounter, program);
}

function loadProgram() {
  assembleAndLoadProgram(parseProgramText(getProgramText()));
}


function init() {
  loadProgram();
  updateUI(MEMORY, programCounter, program);
}

// boring code for rendering user interface of the simulator
// not really important for understanding how computers work

const LINES_TO_PRINT = 20;

const stepperEl = document.getElementById('stepper');
const memoryViewEl = document.getElementById('memoryView');
const programCounterEl = document.getElementById('programCounter');
const programEl = document.getElementById('program');

function getProgramText() {
  return programEl.textContent;
}

function updateUI(
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

init();