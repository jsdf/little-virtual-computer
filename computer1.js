/*

Components: (do a ctrl-f find for them)
1.MEMORY
2.CPU
3.DISPLAY
4.INPUT
5.ASSEMBLER
6.SIMULATION CONTROL
7.BUILT-IN PROGRAMS

*/

// 1.MEMORY

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
2000 - 2003: the keycode of a key which is currently pressed, from most recently
  to least recently started
2010, 2011: the x and y position of the mouse within the screen.
2012: the address of the pixel the mouse is currently on
2013: mouse button status (0 = up, 1 = down)
2050: a random number which changes before every instruction
2051 - 2099: unused
2100 - 2999: The color values of the pixels of the 30x30 pixel screen, row by
  row, from the top left. For example, the top row uses slots 2100 - 2129, and
  the bottom row uses slots 2970 - 3000.
*/
const TOTAL_MEMORY_SIZE = 3000;
const WORKING_MEMORY_START = 0;
const WORKING_MEMORY_END = 1000;
const PROGRAM_MEMORY_START = 1000;
const PROGRAM_MEMORY_END = 2000;
const KEYCODE_0_ADDRESS = 2000;
const KEYCODE_1_ADDRESS = 2001;
const KEYCODE_2_ADDRESS = 2002;
const MOUSE_X_ADDRESS = 2010;
const MOUSE_Y_ADDRESS = 2011;
const MOUSE_PIXEL_ADDRESS = 2012;
const MOUSE_BUTTON_ADDRESS = 2013;
const RANDOM_NUMBER_ADDRESS = 2050
const VIDEO_MEMORY_START = 2100;
const VIDEO_MEMORY_END = 3000;

// The program will be loaded into the region of memory starting at this slot.
const PROGRAM_START = 1000;

// Store a value at a certain address in memory
function memorySet(address, value) {
  if (Number.isNaN(value)) {
    throw new Error(`tried to write to an invalid value at ${address}`);
  }
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

// 2.CPU

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
  if (programCounter < PROGRAM_MEMORY_START || programCounter >= PROGRAM_MEMORY_END) {
    throw new Error(`program counter outside valid program memory region at ${programCounter}`);
  }
  return memoryGet(programCounter++);
}

/*
These instructions represent the things the CPU can be told to do. We
implement them here with code, but a real CPU would have circuitry
implementing each one of these possible actions, which include things like
loading data from memory, comparing it, operating on and combining it, and
storing it back into memory.

We assign numerical values called 'opcodes' to each of the instructions. When
our program is 'assembled' from the program code text, the version of the
program that we actually load into memory will use these numeric codes to refer
to the CPU instructions in place of the textual names as a numeric value is a
more efficient representation, especially as computers only directly understand
numbers, whereas text is an abstraction on top of number values.

We'll make the opcodes numbers starting at 9000 to make the values a bit more
distinctive when we see them in the memory viewer. We'll include some extra info
about each of the instructions so our simulator user interface can show it
alongside the 'disassembled' view of the program code in memory.
*/
const instructions = {
  // this instruction is typically called 'mov', short for 'move', as in 'move
  // value at *this* address to *that* address', but this naming can be a bit
  // confusing, because the operation doesn't remove the value at the source
  // address, as 'move' might seem to imply, so for clarity we'll call it 'copy' instead.
  copy: {
    opcode: 9000,
    description: 'set memory at address to the value at the given address',
    operands: [['destination', 'address'], ['source', 'address']],
    execute(destination, sourceAddress) {
      const sourceValue = memoryGet(sourceAddress);
      memorySet(destination, sourceValue);
    },
  },
  copy_constant: {
    opcode: 9001,
    description: 'set memory at address to the given constant value',
    operands: [['destination', 'address'], ['source', 'constant']],
    execute(address, sourceValue) {
      memorySet(address, sourceValue);
    },
  },
  copy_from_ptr: {
    opcode: 9002,
    description: `set memory at destination address to the value at the
address pointed to by the value at 'source' address`,
    operands: [['destination', 'address'], ['source', 'pointer']],
    execute(destinationAddress, sourcePointer) {
      const sourceAddress = memoryGet(sourcePointer);
      const sourceValue = memoryGet(sourceAddress);
      memorySet(destinationAddress, sourceValue);
    },
  },
  copy_into_ptr: {
    opcode: 9003,
    description: `set memory at the address pointed to by the value at
'destination' address to the value at the source address`,
    operands: [['destination', 'pointer'], ['source', 'address']],
    execute(destinationPointer, sourceAddress) {
      const destinationAddress = memoryGet(destinationPointer);
      const sourceValue = memoryGet(sourceAddress);
      memorySet(destinationAddress, sourceValue);
    },
  },
  add: {
    opcode: 9010,
    description: `add the value at the 'a' address with the value at the 'b'
address and store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'address'], ['result', 'address']],
    execute(aAddress, bAddress, resultAddress) {
      const a = memoryGet(aAddress);
      const b = memoryGet(bAddress);
      const result = a + b;
      memorySet(resultAddress, result);
    },
  },
  add_constant: {
    opcode: 9011,
    description: `add the value at the 'a' address with the constant value 'b' and store
the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'constant'], ['result', 'address']],
    execute(aAddress, b, resultAddress) {
      const a = memoryGet(aAddress);
      const result = a + b;
      memorySet(resultAddress, result);
    },
  },
  subtract: {
    opcode: 9020,
    description: `from the value at the 'a' address, subtract the value at the
'b' address and store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'address'], ['result', 'address']],
    execute(aAddress, bAddress, resultAddress) {
      const a = memoryGet(aAddress);
      const b = memoryGet(bAddress);
      const result = a - b;
      memorySet(resultAddress, result);
    },
  },
  subtract_constant: {
    opcode: 9021,
    description: `from the value at the 'a' address, subtract the constant value 'b' and
store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'constant'], ['result', 'address']],
    execute(aAddress, b, resultAddress) {
      const a = memoryGet(aAddress);
      const result = a - b;
      memorySet(resultAddress, result);
    },
  },
  multiply: {
    opcode: 9030,
    description: `multiply the value at the 'a' address and the value at the 'b'
address and store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'address'], ['result', 'address']],
    execute(aAddress, bAddress, resultAddress) {
      const a = memoryGet(aAddress);
      const b = memoryGet(bAddress);
      const result = a * b;
      memorySet(resultAddress, result);
    },
  },
  multiply_constant: {
    opcode: 9031,
    description: `multiply the value at the 'a' address and the constant value 'b' and
store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'constant'], ['result', 'address']],
    execute(aAddress, b, resultAddress) {
      const a = memoryGet(aAddress);
      const result = a * b;
      memorySet(resultAddress, result);
    },
  },
  divide: {
    opcode: 9040,
    description: `integer divide the value at the 'a' address by the value at
the 'b' address and store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'address'], ['result', 'address']],
    execute(aAddress, bAddress, resultAddress) {
      const a = memoryGet(aAddress);
      const b = memoryGet(bAddress);
      if (b === 0) throw new Error('tried to divide by zero');
      const result = Math.floor(a / b);
      memorySet(resultAddress, result);
    },
  },
  divide_constant: {
    opcode: 9041,
    description: `integer divide the value at the 'a' address by the constant value 'b'
and store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'constant'], ['result', 'address']],
    execute(aAddress, b, resultAddress) {
      const a = memoryGet(aAddress);
      if (b === 0) throw new Error('tried to divide by zero');
      const result = Math.floor(a / b);
      memorySet(resultAddress, result);
    },
  },
  modulo: {
    opcode: 9050,
    description: `get the value at the 'a' address modulo the value at the 'b'
address and store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'address'], ['result', 'address']],
    execute(aAddress, bAddress, resultAddress) {
      const a = memoryGet(aAddress);
      const b = memoryGet(bAddress);
      if (b === 0) throw new Error('tried to modulo by zero');
      const result = a % b;
      memorySet(resultAddress, result);
    },
  },
  modulo_constant: {
    opcode: 9051,
    description: `get the value at the 'a' address modulo the constant value 'b' and
store the result at the 'result' address`,
    operands: [['a', 'address'], ['b', 'constant'], ['result', 'address']],
    execute(aAddress, b, resultAddress) {
      const a = memoryGet(aAddress);
      const result = a % b;
      if (b === 0) throw new Error('tried to modulo by zero');
      memorySet(resultAddress, result);
    },
  },
  'jump_to':  {
    opcode: 9100,
    description: `set the program counter to the address of the label specified,
so the program continues from there`,
    operands: [['destination', 'label']],
    execute(labelAddress) {
      programCounter = labelAddress;
    },
  },
  'branch_if_equal':  {
    opcode: 9101,
    description: `if the value at address 'a' is equal to the value at address
'b', set the program counter to the address of the label specified, so the
program continues from there`,
    operands: [['a', 'address'], ['b', 'address'], ['destination', 'label']],
    execute(aAddress, bAddress, labelAddress) {
      const a = memoryGet(aAddress);
      const b = memoryGet(bAddress);
      if (a === b)  {
        programCounter = labelAddress;
      }
    },
  },
  'branch_if_equal_constant':  {
    opcode: 9102,
    description: `if the value at address 'a' is equal to the constant value 'b', set the
program counter to the address of the label specified, so the program continues
from there`,
    operands: [['a', 'address'], ['b', 'constant'], ['destination', 'label']],
    execute(aAddress, b, labelAddress) {
      const a = memoryGet(aAddress);
      if (a === b)  {
        programCounter = labelAddress;
      }
    },
  },
  'branch_if_not_equal':  {
    opcode: 9103,
    description: `if the value at address 'a' is not equal to the value at
address 'b', set the program counter to the address of the label specified, so
the program continues from there`,
    operands: [['a', 'address'], ['b', 'address'], ['destination', 'label']],
    execute(aAddress, bAddress, labelAddress) {
      const a = memoryGet(aAddress);
      const b = memoryGet(bAddress);
      if (a !== b)  {
        programCounter = labelAddress;
      }
    },
  },
  'branch_if_not_equal_constant':  {
    opcode: 9104,
    description: `if the value at address 'a' is not equal to the constant value 'b', set
the program counter to the address of the label specified, so the program
continues from there`,
    operands: [['a', 'address'], ['b', 'constant'], ['destination', 'label']],
    execute(aAddress, b, labelAddress) {
      const a = memoryGet(aAddress);
      if (a !== b)  {
        programCounter = labelAddress;
      }
    },
  },
  'break': {
    opcode: 9998,
    description: 'pause program execution, so it must be resumed via simulator UI',
    operands: [],
    execute() {
      running = false;
    },
  },
  'halt': {
    opcode: 9999,
    description: 'end program execution, requiring the simulator to be reset to start again',
    operands: [],
    execute() {
      running = false;
      halted = true;
    },
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
  const opcode = instructions[instructionName].opcode;
  instructionsToOpcodes.set(instructionName, opcode);
  opcodesToInstructions.set(opcode, instructionName);
});

/*
Advances through the program by one instruction, getting input from the input
devices (keyboard, mouse), executing the instruction, then writing output to the
output devices (screen, audio).
*/
function step() {
  updateInputs();
  const opcode = advanceProgramCounter();
  const instructionName = opcodesToInstructions.get(opcode);
  if (!instructionName) {
    throw new Error(`Unknown opcode '${opcode}'`);
  }

  // read as many values from memory as the instruction takes as operands and
  // execute the instruction with those operands
  const operands = instructions[instructionName].operands.map(advanceProgramCounter);
  instructions[instructionName].execute.apply(null, operands);
}


// 3.DISPLAY

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

const canvasCtx = getCanvas().getContext('2d');
const imageData = canvasCtx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
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
  const pixelsRGBA = imageData.data;
  for (var i = 0; i < VIDEO_MEMORY_LENGTH; i++) {
    const pixelColorId = MEMORY[VIDEO_MEMORY_START + i];
    const colorRGB = COLOR_PALETTE[pixelColorId || 0];
    pixelsRGBA[i * 4] = colorRGB[0];
    pixelsRGBA[i * 4 + 1] = colorRGB[1];
    pixelsRGBA[i * 4 + 2] = colorRGB[2];
    pixelsRGBA[i * 4 + 3] = 255; // full opacity
  }

  canvasCtx.putImageData(imageData, 0, 0);
}

// 4.INPUT

const keysPressed = new Set();
document.body.onkeydown = function(event) {
  keysPressed.add(event.which);
}
document.body.onkeyup = function(event) {
  keysPressed.delete(event.which);
}

let mouseDown = 0;
document.body.onmousedown = function() { 
  ++mouseDown;
}
document.body.onmouseup = function() {
  --mouseDown;
}

let mouseX = 0;
let mouseY = 0;

document.getElementById('canvas').onmousemove = function(event) {
  mouseX = event.offsetX;
  mouseY = event.offsetY;
}

function updateInputs() {
  const mostRecentKeys = Array.from(keysPressed.values()).reverse();

  MEMORY[KEYCODE_0_ADDRESS] = mostRecentKeys[0] || 0;
  MEMORY[KEYCODE_1_ADDRESS] = mostRecentKeys[1] || 0;
  MEMORY[KEYCODE_2_ADDRESS] = mostRecentKeys[2] || 0;
  MEMORY[MOUSE_BUTTON_ADDRESS] = mouseDown ? 1 : 0;
  MEMORY[MOUSE_X_ADDRESS] = mouseX;
  MEMORY[MOUSE_Y_ADDRESS] = mouseY;
  MEMORY[MOUSE_PIXEL_ADDRESS] = VIDEO_MEMORY_START + mouseY * SCREEN_WIDTH + mouseX;
  MEMORY[RANDOM_NUMBER_ADDRESS] = Math.floor(Math.random() * 255);
}

// 5.ASSEMBLER

/*
We use a simple text-based language to input our program. This is our 'assembly
language'. We need to convert it into a form which is made up of only numerical
values so we can load it into our computer's memory. This is a two step process:

1. parse program text into an array of objects representing our instructions and
  their operands.
2. convert the objects into numeric values to be interpreted by the CPU. This is
  our 'machine code'.

We parse the program text into tokens by splitting the text into lines, then
splitting those lines into tokens (words), which gives us to an instruction name
and operands for that instruction, from each line.
*/

// we'll keep a map of instructions which take a label as an operand so we
// know when to substitute an operand for the corresponding label address
const instructionsLabelOperands = new Map();
Object.keys(instructions).forEach(name => {
  const labelOperandIndex = instructions[name].operands.findIndex(operand =>
    operand[1] === 'label'
  );
  if (labelOperandIndex > -1) {
    instructionsLabelOperands.set(name, labelOperandIndex);
  }
});

function parseProgramText(programText) {
  const programInstructions = [];
  const lines = programText.split('\n');
  for (const line of lines) {
    const instruction = {name: null, operands: []};
    let tokens = line.replace(/;.*$/, '') // strip comments
      .split(' ');
    for (const token of tokens) {
      // skip empty tokens
      if (token == null || token == "") {
        continue;
      }
      // first token
      if (!instruction.name) {
        // special case for labels
        if (token.endsWith(':')) {
          instruction.name = 'label';
          instruction.operands.push(token.slice(0, token.length - 1));
          break;
        }

        instruction.name = token; // instruction name token
      } else {
        // handle text operands
        if (
          (
            // define name
            instruction.name === 'define' &&
            instruction.operands.length === 0
          ) || (
            // label used as operand
            instructionsLabelOperands.get(instruction.name) === instruction.operands.length
          )
        ) {
          instruction.operands.push(token);
          continue;
        }

        // try to parse number operands
        const number = parseInt(token, 10);
        if (Number.isNaN(number)) {
          instruction.operands.push(token);
        } else {
          instruction.operands.push(number);
        }
      }
    }

    // validate number of operands given
    if (
      instruction.name &&
      instruction.name !== 'label' &&
      instruction.name !== 'define'
    ) {
      const expectedOperands = instructions[instruction.name].operands;
      if (instruction.operands.length !== expectedOperands.length) {
        throw new Error(`Wrong number of operands for instruction ${instruction.name}
got ${instruction.operands.length}, expected ${expectedOperands.length}
at line '${line}'`
        );
      }
    }

    //  if instruction was found on this line, add it to the program
    if (instruction.name) {
      programInstructions.push(instruction);
    }
  }
  programInstructions.push({name: 'halt', operands: []});
  return programInstructions;
}

/*
Having parsed our program text into an array of objects containing instruction
name and the operands to the instruction, we need to turn those objects into
numeric values we can store in the computer's memory, and load them in there.
*/
function assembleAndLoadProgram(programInstructions) {
  // 'label' is a special case – it's not really an instruction which the CPU
  // understands. Instead, it's a marker for the location of the next
  // instruction, which we can substitute for the actual location once we know
  // the memory locations in the assembled program which the labels refer to.
  const labelAddresses = {};
  let labelAddress = PROGRAM_START;
  for (const instruction of programInstructions) {
    if (instruction.name === 'label') {
      const labelName = instruction.operands[0];
      labelAddresses[labelName] = labelAddress;
    } else if (instruction.name === 'define') {
      continue;
    } else {
      // advance labelAddress by the length of the instruction and its operands
      labelAddress += 1 + instruction.operands.length;
    }
  }

  const defines = {};

  // load instructions and operands into memory
  let loadingAddress = PROGRAM_START;
  for (const instruction of programInstructions) {
    if (instruction.name === 'label') {
      continue;
    }
    if (instruction.name === 'define') {
      defines[instruction.operands[0]] = instruction.operands[1];
      continue;
    }

    // for each instruction, we first write the relevant opcode to memory
    const opcode = instructionsToOpcodes.get(instruction.name);
    if (!opcode) {
      throw new Error(`No opcode found for instruction '${instruction.name}'`);
    }
    MEMORY[loadingAddress++] = opcode;
    
    // then, we write the operands for instruction to memory
    const operands = instruction.operands.slice(0);

    // replace labels used as operands with actual memory address
    if (instructionsLabelOperands.has(instruction.name)) {
      const labelOperandIndex = instructionsLabelOperands.get(instruction.name);
      const labelName = instruction.operands[labelOperandIndex];
      const labelAddress = labelAddresses[labelName];
      if (!labelAddress) {
        throw new Error(`unknown label '${labelName}'`);
      }
      operands[labelOperandIndex] = labelAddress;
    }

    for (var i = 0; i < operands.length; i++) {
      let value = null;
      if (typeof operands[i] === 'string') {
        if (operands[i] in defines) {
          value = defines[operands[i]];
        } else {
          throw new Error(`'${operands[i]}' not defined`);
        }
      } else {
        value = operands[i];
      }

      MEMORY[loadingAddress++] = value;
    }
  }
}

// 6.SIMULATION CONTROL

function runStop() {
  if (running) {
    running = false;
  } else {
    running = true;
    loop();
  }
  updateUI();
  updateSpeedUI();
}

function stepOnce() {
  running = true;
  step();
  running = false;
  drawScreen();
  updateUI();
}

let delayBetweenCycles = 0;
const CYCLES_PER_YIELD = 997;
function loop() {
  if (delayBetweenCycles === 0) {
    for (var i = 0; i < CYCLES_PER_YIELD; i++) {
      if (!running) break;
      step();
    }
  } else {
    step();
    updateUI();
  }
  drawScreen();
  if (running) {
    setTimeout(loop, delayBetweenCycles);
  }
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

  const programText = getProgramText();
  try {
    assembleAndLoadProgram(parseProgramText(programText));
  } catch (err) {
    alert(err.stack);
    console.error(err.stack)
  }
  setLoadedProgramText(programText);

  programCounter = PROGRAM_START;
  halted = false;
  running = false;
  drawScreen();
  updateProgramMemoryView(MEMORY);
  updateUI();
  updateSpeedUI();
}

// 7.BUILT-IN PROGRAMS

const PROGRAMS = {
  'Add':
`
define a 0
define b 1
define result 2

copy_constant a 4
copy_constant b 4
add a b result
; look at memory location 2, you should now see '8'
`,

  'RandomPixels':
`
define videoStartAddr 2100
define videoEndAddr 3000
define randomNumberAddr 2050
define numColors 16

FillScreen:
define fillScreenPtr 0 ; address at which store address of current screen pixel in loop
copy_constant fillScreenPtr videoStartAddr ; initialize to point to first pixel
jump_to FillScreenLoop

FillScreenLoop:
define tempAddr 1 ; address to use for temporary storage

; modulo random value by number of colors in palette to get a random color...
modulo_constant randomNumberAddr numColors tempAddr

; ...and write it to current screen pixel, eg. the address pointed to by fillScreenPtr
copy_into_ptr fillScreenPtr tempAddr

; increment pointer to point to next screen pixel address
add_constant fillScreenPtr 1 fillScreenPtr

branch_if_not_equal_constant fillScreenPtr videoEndAddr FillScreenLoop ; if not finished, repeat
jump_to FillScreen ; filled screen, now start again from the top
`,

  'Paint':
`Init:
copy_constant 0 3; init current color stored at addr 0
copy_constant 1 2100 ; init loop counter to start of video memory
DrawColorPickerLoop:

branch_if_not_equal_constant 1 3000 DrawColorPickerLoop

MainLoop:
branch_if_equal_constant 2013 1 PaintAtCursor ; if mouse button down, paint
jump_to MainLoop

PaintAtCursor:
copy_into_ptr 2012 0 ; set pixel at mouse cursor to color at addr 0
jump_to MainLoop
`,

  'Custom 1': '',
  'Custom 2': '',
  'Custom 3': '',
};

// boring code for rendering user interface of the simulator
// not really important for understanding how computers work

function $(selector) {
  return document.querySelector(selector);
}

let selectedProgram = localStorage.getItem('selectedProgram') || 'RandomPixels';

function initUI() {
  // init program selector
  Object.keys(PROGRAMS).forEach(programName => {
    const option = document.createElement('option');
    option.value = programName;
    option.textContent = programName;
    $('#programSelector').append(option);
  });
  $('#programSelector').value = selectedProgram;
  selectProgram();  
}

function getProgramText() {
  return $('#program').value;
}

function getCanvas() {
  return $('#canvas');
}

let loadedProgramText = null;
function setLoadedProgramText(programText) {
  loadedProgramText = programText;
  $('#loadProgramButton').disabled = true;
}

function updateLoadProgramButton() {
  $('#loadProgramButton').disabled = loadedProgramText === getProgramText();
}

function selectProgram() {
  selectedProgram = $('#programSelector').value;
  localStorage.setItem('selectedProgram', selectedProgram);
  $('#program').value =
    localStorage.getItem(selectedProgram) || PROGRAMS[selectedProgram] || '';
  updateLoadProgramButton();
}

function editProgramText() {
  if (selectedProgram.startsWith('Custom')) {
    localStorage.setItem(selectedProgram, $('#program').value);
  }
  updateLoadProgramButton();
}

function setSpeed() {
  delayBetweenCycles = -parseInt($('#speed').value, 10);
  updateSpeedUI();
}

function setFullspeed() {
  if ($('#fullspeed').checked) {
    delayBetweenCycles = 0;
  } else {
    delayBetweenCycles = 1;
  }
  updateSpeedUI();
}

function updateSpeedUI() {
  const fullspeed = delayBetweenCycles === 0;
  const runningAtFullspeed = running && fullspeed;
  $('#fullspeed').checked = fullspeed;
  $('#speed').value = -delayBetweenCycles;
  $('#debugger').classList.toggle('fullspeed', runningAtFullspeed);
  $('#debuggerMessageArea').textContent = runningAtFullspeed ?
    'debug UI disabled when running at full speed' : '';
}

function updateUI() {
  $('#programCounter').value = programCounter;
  if (halted) {
    $('#running').textContent = 'halted';
    $('#stepButton').disabled = true;
    $('#runButton').disabled = true;
  } else {
    $('#running').textContent = running ? 'running' : 'paused';
    $('#stepButton').disabled = false;
    $('#runButton').disabled = false;
  }
  updateWorkingMemoryView(MEMORY);
  updateInputMemoryView(MEMORY);
  updateVideoMemoryView(MEMORY);
  if (delayBetweenCycles > 300 || !running) {
    scrollToProgramLine(Math.max(0, programCounter - PROGRAM_MEMORY_START - 3));
  }
}

function updateWorkingMemoryView(memory) {
  const lines = [];
  for (var i = WORKING_MEMORY_START; i < WORKING_MEMORY_END; i++) {
    lines.push(`${i}: ${memory[i]}`);
  }
  $('#workingMemoryView').textContent = lines.join('\n');
}

let scrollToProgramLine = null
function updateProgramMemoryView(memory) {
  const lines = [];
  for (var i = PROGRAM_MEMORY_START; i < PROGRAM_MEMORY_END; i++) {
    const instruction = opcodesToInstructions.get(memory[i]);
    lines.push(`${padRight(i, 4)}: ${padRight(memory[i], 8)} ${instruction || ''}`);
    if (instruction) {
      const operands = instructions[instruction].operands;
      for (var j = 0; j < operands.length; j++) {
        lines.push(`${padRight(i + 1 + j, 4)}: ${padRight(memory[i + 1 + j], 8)}   ${operands[j][0]} (${operands[j][1]})`);
      }
      i += operands.length;
    }
  }
  
  const itemHeight = 14;
  const renderProgramMemoryView = virtualizedScrollView(
    $('#programMemoryView'),
    136,
    itemHeight,
    lines.length,
    (start, end) => (
      lines.slice(start, end)
        .map((l, i) => {
          const current = PROGRAM_MEMORY_START + start + i === programCounter;
          return `
<pre
  class="tablerow"
  style="height: ${itemHeight}px; background: ${current ? '#eee' : 'none'}"
>${l}</pre>
          `;
        })
        .join('')
    )
  );

  scrollToProgramLine = (item) => {
    $('#programMemoryView').scrollTop = item * itemHeight;
    renderProgramMemoryView(); 
  };

  renderProgramMemoryView();
}


function updateInputMemoryView(memory) {
  $('#inputMemoryView').textContent =
    `${KEYCODE_0_ADDRESS}: ${padRight(memory[KEYCODE_0_ADDRESS], 8)} keycode 0
${KEYCODE_1_ADDRESS}: ${padRight(memory[KEYCODE_1_ADDRESS], 8)} keycode 1
${KEYCODE_2_ADDRESS}: ${padRight(memory[KEYCODE_2_ADDRESS], 8)} keycode 2
${MOUSE_X_ADDRESS}: ${padRight(memory[MOUSE_X_ADDRESS], 8)} mouse x
${MOUSE_Y_ADDRESS}: ${padRight(memory[MOUSE_Y_ADDRESS], 8)} mouse y
${MOUSE_PIXEL_ADDRESS}: ${padRight(memory[MOUSE_PIXEL_ADDRESS], 8)} mouse pixel
${MOUSE_BUTTON_ADDRESS}: ${padRight(memory[MOUSE_BUTTON_ADDRESS], 8)} mouse button
${RANDOM_NUMBER_ADDRESS}: ${padRight(memory[RANDOM_NUMBER_ADDRESS], 8)} random number`;
}

function updateVideoMemoryView(memory) {
  const lines = [];
  for (var i = VIDEO_MEMORY_START; i < VIDEO_MEMORY_END; i++) {
    lines.push(`${i}: ${memory[i]}`);
  }
  $('#videoMemoryView').textContent = lines.join('\n');
}

function virtualizedScrollView(container, containerHeight, itemHeight, numItems, renderItems) {
  const content = document.createElement('div');
  content.style.height = `${itemHeight * numItems}px`;
  content.style.overflow = 'hidden';
  container.appendChild(content);
  container.style.height = `${containerHeight}px`;
  container.style.overflow = 'auto';
  const overscan = 10;

  const render = () => requestAnimationFrame(() => {
    const start = Math.max(
      0,
      Math.floor(container.scrollTop / itemHeight) - overscan
    );
    const end = Math.min(
      numItems,
      Math.ceil((container.scrollTop + containerHeight) / itemHeight) + overscan
    );
    const offsetTop = start * itemHeight;

    content.style.transform = `translateY(${offsetTop}px)`;
    content.innerHTML = renderItems(start, end);
  }, 0);

  container.onscroll = render;


  return render;
}

function clamp(val, min, max) {
  return Math.min(min, Math.max(max, val));
}

function padRight(input, length) {
  const str = input + '';
  let padded = str;
  for (var i = str.length; i < length; i++) {
    padded += " ";
  }
  return padded;
}

initUI();
init();
