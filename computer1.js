// --- MEMORY ---

/*
We are going to use an array to simulate computer memory. We can store a number
value at each position in the array, and we will use a number value to access
each slot in the array (we'll call these array indexes 'memory addresses').

Real computers have memory which can be read and written as individual bytes,
and also in larger or smaller chunks. In real computers memory addresses and
values are usually shown as hexadecimal (base-16) form, due to the fact that
hexadecimal is a concise alternative to binary, which 'lines up' nicely with
binary: a 1 digit hexadecimal number can represent exactly all of the values
which a 4 digit binary number ca. However, we are going to represent addresses
and values as decimal (base-10) numbers, so there's one less thing to know about
at this point.
*/
const MEMORY = [];

/*
Here we have the total amount of array slots (or memory addresses) we are
going to have at which to store data values.

The program code will also be loaded into these slots, and when the CPU starts
running, it will begin reading each instruction of the program from memory and
executing it. At the hardware level, program code is just another form of data
stored in memory.

We'll use the first 1000 (0 - 999) slots as working space for our code to use.
The next 1000 (1000 - 1999) we'll load our program code into, and that's where
it will be executed from.
The final 1000 slots will be used to communicate with the input and output (I/O)
devices.
2000: the keycode of the key which is currently pressed
2001, 2002: the x and y position of the mouse within the screen.
2003 - 2099: unused
2100 - 2999: The color values of the pixels of the 30x30 pixel screen, row by
  row, from the top left. For example, the top row uses slots 2100 - 2129, and
  the bottom row uses slots 2970 - 3000.
*/
const TOTAL_MEMORY_SIZE = 3000;
const WORKING_MEMORY_START = 0;
const WORKING_MEMORY_END = 1000;
const PROGRAM_MEMORY_START = 1000;
const PROGRAM_MEMORY_END = 2000;
const KEYCODE_ADDRESS = 2000;
const MOUSE_X_ADDRESS = 2001;
const MOUSE_Y_ADDRESS = 2002;
const VIDEO_MEMORY_START = 2100;
const VIDEO_MEMORY_END = 3000;

// The program will be loaded into the region of memory starting at this slot.
const PROGRAM_START = 1000;

// Store a value at a certain address in memory
function memorySet(address, value) {
  if (address < 0 || address >= TOTAL_MEMORY_SIZE) {
    throw new Error('tried to write to an invalid memory address');
  }
  MEMORY[address] = value;
}

// Get the value which is stored at a certain address in memory
function memoryGet(address) {
  if (address < 0 || address >= TOTAL_MEMORY_SIZE) {
    throw new Error('tried to read from an invalid memory address');
  }
  return MEMORY[address];
}

// --- CPU ---

/*
As we move through our program, we need to keep track of where we are up to.
The program counter contains a memory address pointing to the location of the
program instruction we are currently executing.
In a real computer, there is a small piece of memory inside the CPU which
holds this information, called the 'program counter'. The program counter is
one of several 'registers', which are basically tiny pieces of memory built
right into the CPU, which just hold one value at a time, but can be accessed
very quickly.
*/
let programCounter = PROGRAM_START;

/*
We also need to keep track of whether the CPU is running or not. The 'break'
instruction, which is like 'debugger' in Javascript, will be implemented by
setting this to false. This will cause the simulator to stop, but we can still
resume the program
The 'halt' instruction will tell the CPU that we are at the end of the program,
so it should stop executing instructions, and can't be resumed.
*/
let running = false;
let halted = false;

/*
Move the program counter forward to the next memory address and return the
opcode or data at that location
*/
function advanceProgramCounter() {
  return memoryGet(programCounter++);
}

/*
These instructions represent the things the CPU can be told to do. We
implement them here with code, but a real CPU would have circuitry
implementing each one of these possible actions, which include things like
loading data from memory, comparing it, operating on and combining it, and
storing it back into memory.
*/
const instructions = {
  // We expose our memory setting function to be used in our program so that the
  // program code can initialize values in memory with whatever values they
  // need.
  'set_value': function() {
    const address = advanceProgramCounter();
    const value = advanceProgramCounter();
    memorySet(address, value);
  },
  // add the value at the 'a' address with the value at the 'b' address and
  // store them at the 'result' address
  'add': function() {
    const aAddress = advanceProgramCounter();
    const bAddress = advanceProgramCounter();
    const resultAddress = advanceProgramCounter();
    const aValue = memoryGet(aAddress);
    const bValue = memoryGet(bAddress);
    const resultValue = aValue + bValue;
    memorySet(resultAddress, resultValue);
  },
  'label': function() {
    // don't actually do anything for the 'label' instruction, it's just here to
    // mark a place in the program so that we can jump to it as needed
  },
  'jump_to': function() {

  },
  'break': function() {
    running = false;
  },
  'halt': function() {
    running = false;
    halted = true;
  },
};

/*
We'll set up a mapping between our instruction names and the numerical values
we will turn them into when we assemble the program. It is these numerical
values which will be interpreted by our simulated CPU as it runs the program.
*/
const instructionsToOpcodes = new Map();
const opcodesToInstructions = new Map();
Object.keys(instructions).forEach((instructionName, index) => {
  // We assign numerical values to each of the instructions. We'll start the
  // numbering at 10000 to make the values a bit more distinctive when we see
  // them in the memory viewer.
  const opcode = index + 10000;
  instructionsToOpcodes.set(instructionName, opcode);
  opcodesToInstructions.set(opcode, instructionName);
});

/*
Advances through the program by one instruction, getting input from the input
devices (keyboard, mouse), executing the instruction, then writing output to the
output devices (screen, audio).
*/
function step() {
  const opcode = advanceProgramCounter();
  const instructionName = opcodesToInstructions.get(opcode);
  if (!instructionName) {
    throw new Error(`Unknown opcode '${opcode}'`);
  }
  instructions[instructionName]();

  drawScreen();
}


// --- DISPLAY ---

const SCREEN_WIDTH = 30;
const SCREEN_HEIGHT = 30;

/*
To reduce the amount of memory required to contain the data for each pixel on
the screen, we're going to use a lookup table mapping color IDs to RGB colors.
This is sometimes called a 'color palette'.

This means that rather than having to store a red, green and blue value for each
color, in our simulated program we can just use the ID of the color we want to
use for each pixel, and when the simulated video hardware draws the screen it
can look up the actual RGB color values to use for each pixel rendered.

The drawback of approach is that the colors you can use are much more limited,
as you can only use a color if it's in the palette. It also means you can't
simply lighten or darken colors using math (unless you use a clever layout of
your palette).
*/

const COLOR_PALETTE = {
  0:  [  0,  0,  0], // Black
  1:  [255,255,255], // White
  2:  [255,  0,  0], // Red
  3:  [  0,255,  0], // Lime 
  4:  [  0,  0,255], // Blue 
  5:  [255,255,  0], // Yellow 
  6:  [  0,255,255], // Cyan/Aqua
  7:  [255,  0,255], // Magenta/Fuchsia
  8:  [192,192,192], // Silver 
  9:  [128,128,128], // Gray 
  10: [128,  0,  0], // Maroon 
  11: [128,128,  0], // Olive
  12: [  0,128,  0], // Green
  13: [128,  0,128], // Purple 
  14: [  0,128,128], // Teal 
  15: [  0,  0,128], // Navy 
};

/*
Read the pixel values from video memory, look them up in our color palette, and
convert them to the format which the Canvas 2D API requires: an array of RGBA
values for each pixel. This format uses 4 consecutive array slots to represent
each pixel, one for each of the RGBA channels (red, green, blue, alpha).

We don't need to vary the alpha (opacity) values, so we'll just set them to 255
(full opacity) for every pixel.
*/
const VIDEO_MEMORY_LENGTH = VIDEO_MEMORY_END - VIDEO_MEMORY_START;
function drawScreen() {
  const pixelsRGBA = new Uint8ClampedArray(SCREEN_WIDTH * SCREEN_HEIGHT * 4);
  for (var i = 0; i < VIDEO_MEMORY_LENGTH; i++) {
    const pixelColorId = MEMORY[VIDEO_MEMORY_START + i];
    const colorRGB = COLOR_PALETTE[pixelColorId || 0];
    pixelsRGBA[i * 4] = colorRGB[0];
    pixelsRGBA[i * 4 + 1] = colorRGB[1];
    pixelsRGBA[i * 4 + 2] = colorRGB[2];
    pixelsRGBA[i * 4 + 3] = 255; // full opacity
  }
  // actually write pixels to the canvas (scaled up)
  putScreenPixelsToCanvas(pixelsRGBA);
}

// --- ASSEMBLER ---

/*
We use a simple text-based language to input our program, which we will
convert into the array representation described earlier. This is our
equivalent of an assembly language.
We parse the program text into our array form by splitting the text into
lines, then splitting those lines into tokens (words), which gives us to an
instruction name and arguments for that instruction, from each line.
*/
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
  programInstructions.push(['halt']);
  return programInstructions;
}

// Having parsed our program text into an array, with each item itself being an
// array containing tokens representing the instruction name followed by the
// arguments to the instruction, we need to turn those tokens into values we can
// store in the computer's memory, and load them in there.
function assembleAndLoadProgram(programInstructions) {
  let loadingAddress = PROGRAM_START;
  const labelReferences = {};
  const labelAddresses = {};
  for (const instruction of programInstructions) {
    // 'label' is a special case – it's not really an instruction which the CPU
    // understands. Instead, it's a marker for the location of the next
    // instruction, which we can substitute for the actual location once we know
    // where this instruction will be loaded into memory, and where else it is
    // referred to in the program
    if (instruction[0] === 'label') {
      labelAddresses[instruction[1]] = loadingAddress;
    }
    MEMORY[loadingAddress++] = instructionsToOpcodes.get(instruction[0]);
    for (var i = 1; i < instruction.length; i++) {
      MEMORY[loadingAddress++] = instruction[i];
    }
  }
}

// --- SIMULATION CONTROL ---

function stepOnce() {
  running = true;
  step();
  running = false;
  updateUI();
}

function runToEnd() {
  running = true;

  step();
  updateUI();
  if (running) {
    setTimeout(runToEnd, 300);
  }
}

function loadProgram() {
  assembleAndLoadProgram(parseProgramText(getProgramText()));
  updateProgramMemoryView(MEMORY);
}


function init() {
  /*
  In a real computer, memory addresses which have never had any value set are
  considered 'uninitialized', and might contain any garbage value, but to keep
  our simulation simple we're going to initialize every location with the value
  0. However, just like in a real computer, in our simulation it is possible
  for us to mistakenly read from the wrong place in memory if we have a bug in
  our simulated program where we get the memory address wrong.
  */
  for (var i = 0; i < TOTAL_MEMORY_SIZE; i++) {
    MEMORY[i] = 0;
  }

  loadProgram();
  updateUI();
}

const PROGRAMS = {
  'RandomPixel':
`set_value 2100 4`,
  'Add':
`set_value 0 4
set_value 1 4
add 0 1 2`,
  'Custom 1': '',
  'Custom 2': '',
  'Custom 3': '',
};

// boring code for rendering user interface of the simulator
// not really important for understanding how computers work

const LINES_TO_PRINT = 20;

function ge(id) {
  return document.getElementById(id);
}

const stepButtonEl = ge('stepButton');
const runButtonEl = ge('runButton');
const workingMemoryViewEl = ge('workingMemoryView');
const programMemoryViewEl = ge('programMemoryView');
const inputMemoryViewEl = ge('inputMemoryView');
const videoMemoryViewEl = ge('videoMemoryView');
const programCounterEl = ge('programCounter');
const programEl = ge('program');
const runningEl = ge('running');
const programSelectorEl = ge('programSelector');
const canvasEl = ge('canvas');
const canvasCtx = canvasEl.getContext('2d');

let selectedProgram = localStorage.getItem('selectedProgram') || 'RandomPixel'; // default

// init program selector
Object.keys(PROGRAMS).forEach(programName => {
  const option = document.createElement('option');
  option.value = programName;
  option.textContent = programName;
  programSelectorEl.append(option);
});
programSelectorEl.value = selectedProgram;
selectProgram();

function getProgramText() {
  return programEl.value;
}

function selectProgram() {
  selectedProgram = programSelectorEl.value;
  localStorage.setItem('selectedProgram', selectedProgram);
  programEl.value =
    localStorage.getItem(selectedProgram) || PROGRAMS[selectedProgram];
}

function editProgramText() {
  if (selectedProgram.startsWith('Custom')) {
    localStorage.setItem(selectedProgram, programEl.value);
  }
}

function updateUI() {
  programCounterEl.value = programCounter;
  if (halted) {
    runningEl.textContent = 'halted';
    stepButtonEl.disabled = true;
    runButtonEl.disabled = true;
  } else {
    runningEl.textContent = running ? 'running' : 'paused';
    stepButtonEl.disabled = false;
    runButtonEl.disabled = false;
  }
  updateWorkingMemoryView(MEMORY);
  updateInputMemoryView(MEMORY);
  updateVideoMemoryView(MEMORY);
}

function updateWorkingMemoryView(memory) {
  const lines = [];
  for (var i = WORKING_MEMORY_START; i < WORKING_MEMORY_END; i++) {
    lines.push(`${i}: ${memory[i]}`);
  }
  workingMemoryViewEl.textContent = lines.join('\n');
}

function updateProgramMemoryView(memory) {
  const lines = [];
  for (var i = PROGRAM_MEMORY_START; i < PROGRAM_MEMORY_END; i++) {
    const instruction = opcodesToInstructions.get(memory[i]);
    lines.push(`${i}: ${memory[i]} ${instruction || ''}`);
  }
  programMemoryViewEl.textContent = lines.join('\n');
}

function updateInputMemoryView(memory) {
  inputMemoryViewEl.textContent =
    `${KEYCODE_ADDRESS}: ${memory[KEYCODE_ADDRESS]} (keycode)
${MOUSE_X_ADDRESS}: ${memory[MOUSE_X_ADDRESS]} (mouse x)
${MOUSE_Y_ADDRESS}: ${memory[MOUSE_Y_ADDRESS]} (mouse y)`;
}

function updateVideoMemoryView(memory) {
  const lines = [];
  for (var i = VIDEO_MEMORY_START; i < VIDEO_MEMORY_END; i++) {
    lines.push(`${i}: ${memory[i]}`);
  }
  videoMemoryView.textContent = lines.join('\n');
}

const PIXEL_SCALE = 20;
const CANVAS_WIDTH = SCREEN_WIDTH * PIXEL_SCALE;
const CANVAS_HEIGHT = SCREEN_HEIGHT * PIXEL_SCALE;
function putScreenPixelsToCanvas(pixelsRGBA) {
  const imageData = canvasCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);

  // scale our RGBA pixels up and blit (copy) them to the canvas 
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      const rowStartOffset = Math.floor(y / PIXEL_SCALE) * SCREEN_WIDTH;
      const columnOffset = Math.floor(x / PIXEL_SCALE);
      const index = (rowStartOffset + columnOffset) * 4; // 4 channels (rgba)
      const indexScaled = (y * CANVAS_WIDTH + x) * 4; // 4 channels (rgba)
      imageData.data[indexScaled] = pixelsRGBA[index];
      imageData.data[indexScaled + 1] = pixelsRGBA[index + 1];
      imageData.data[indexScaled + 2] = pixelsRGBA[index + 2];
      imageData.data[indexScaled + 3] = pixelsRGBA[index + 3];
    }
  }
  canvasCtx.putImageData(imageData, 0, 0);
}

function clamp(val, min, max) {
  return Math.min(min, Math.max(max, val));
}

init();