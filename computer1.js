
// We are going to use an array to simulate computer memory. We can store a
// number value at each position in the array, and we will use a number value to
// access each slot in the array (we'll call these 'memory addresses').
// 
// Real computers have memory which can be read as individual bytes, as well as
// in larger or smaller chunks, and their addresses and values are usually shown
// as hexadecimal (base-16) form, but we are going to represent addresses and
// values as decimal (base-10) numbers, so there's one less thing to know about
// at this point.
const MEMORY = [];

// Here we have the total amount of array slots (or memory addresses) we are
// going to have at which to store data values, and program code too, because
// at the hardware level, program code is just another form of data stored in
// memory.
const TOTAL_MEMORY_SIZE = 1000;

// The program will be loaded into memory starting at this slot.
const PROGRAM_START = 600;

// As we move through our program, we need to keep track of where we are up to.
// The program counter contains a memory address pointing to the location of the
// program instruction we are currently executing.
// In a real computer, there is a small piece of memory inside the CPU which
// holds this information, called the 'program counter'. The program counter is
// one of several 'registers', which are basically tiny pieces of memory built
// right into the CPU, which just hold one value at a time, but can be accessed
// very quickly.
let programCounter = PROGRAM_START;

// We also need to keep track of whether the CPU is running or not. The 'break'
// instruction, which is like 'debugger' in Javascript, will be implemented by
// setting this to false. We'll automatically put one at the end of any program
// we load so the CPU knows where to stop.
let running = false;

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

// These instructions represent the things the CPU can be told to do. We
// implement them here with code, but a real CPU would have circuitry
// implementing each one of these possible actions, which include things like
// loading data from memory, comparing it, operating on and combining it, and
// storing it back into memory.
const instructions = {
  // TODO: figure out how to implement this in assembler
  'set_data': function() {
    // const startAddress = getNextProgramValue();
    // const length = getNextProgramValue();
    // let currentAddress = startAddress;
    // for (var currentAddress = startAddress; currentAddress < length; currentAddress++) {
    //   MEMORY[currentAddress]
    // }
    // for (const value of data) {
    //   setMem(currentAddress, data);
    //   currentAddress++;
    // }
  },
  // We expose our memory setting function to be used in our program so that the
  // program code can initialize values in memory with whatever values they
  // need.
  'set_value': function() {
    const address = getNextProgramValue();
    const value = getNextProgramValue();
    setMem(address, value);
  },
  // add the value at the address 'a' with the value at the address 'b' and
  // store them at the address 'out'
  'add': function() {
    const aAddress = getNextProgramValue();
    const bAddress = getNextProgramValue();
    const outAddress = getNextProgramValue();
    const aValue = getMem(aAddress);
    const bValue = getMem(bAddress);
    const outValue = aValue + bValue;
    setMem(outAddress, outValue);
  },
  'label': function() {
    // don't actually do anything for the 'label' instruction, it's just here to
    // mark a place in the program so that we can jump to it as needed
  },
  'jump_to': function() {

  },
  'break': function() {
    running = false;
  }
};

// we'll set up a mapping between our instruction names and the numerical values
// we will turn them into when we assemble the program. It is these numerical
// values which will be interpreted by our simulated CPU as it runs
// the program.
const instructionsToOpcodes = new Map();
const opcodesToInstructions = new Map();

Object.keys(instructions).forEach((instructionName, index) => {
  const opcode = index + 100; // opcodes start at 100
  instructionsToOpcodes.set(instructionName, opcode);
  opcodesToInstructions.set(opcode, instructionName);
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

// We'll keep a map of the 'label' instructions in the program so we can
// jump to them later on. More on this later.
// TODO: implement labels in assembler
const labelLocations = {};

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
  programInstructions.push(['break']);
  return programInstructions;
}

// Having parsed our program text into an array, with each item itself being an
// array containing tokens representing the instruction name followed by the
// arguments to the instruction, we need to turn those tokens into values we can
// store in the computer's memory, and load them in there.
function assembleAndLoadProgram(programInstructions) {
  let loadingAddress = PROGRAM_START;
  for (const instruction of programInstructions) {
    MEMORY[loadingAddress++] = instructionsToOpcodes.get(instruction[0]);
    for (var i = 1; i < instruction.length; i++) {
      MEMORY[loadingAddress++] = instruction[i];
    }
  }
}

function getNextProgramValue() {
  return MEMORY[programCounter++];
}

// Advance the program counter and run the instruction at the new position.
// Returns true once the program is finished.
function step() {
  const opcode = getNextProgramValue();
  const instructionName = opcodesToInstructions.get(opcode);
  if (!instructionName) {
    throw new Error(`Unknown opcode '${opcode}'. Did you keep running past the end?`);
  }
  instructions[instructionName]();
}

function stepOnce() {
  running = true;
  step();
  running = false;
  updateUI(MEMORY, programCounter, program);
}
function runToEnd() {
  running = true;
  while(running) {
    step();
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