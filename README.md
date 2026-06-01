# Flower Language Translator 

> A domain-specific programming language for grid-based agent navigation - `with a hand-built lexer, recursive-descent parser (CST + AST), and C interpreter.

![Python](https://img.shields.io/badge/Python-3.x-blue?style=flat-square)
![C](https://img.shields.io/badge/C-Interpreter-lightgrey?style=flat-square)
![Course](https://img.shields.io/badge/CSC%203315-Languages%20%26%20Compilers-orange?style=flat-square)

---

## Overview

Flower is a task-oriented DSL designed for navigating a grid-based garden environment. An agent (the "picker") moves through cells, interacts with objects (flowers, barriers, grass, exits), and executes programs written in the Flower language.

This project implements the full compilation pipeline from source code to execution:

```
.flwr source → Lexer → Token stream → Parser → CST + AST → [Code gen*] → Interpreter → Output
```

> *Code generation (CST → machine code) is not yet implemented. The interpreter executes machine code directly when provided.

---

## Pipeline Components

### 1. Lexer (`flwr_lexer.py`)
Regex-based tokenizer over a 54-token table covering:
- **Keywords**: `if`, `else`, `for`, `int`, `enum`, `output`, `break`, `null`
- **Built-in functions**: `moveUp$`, `moveDown$`, `moveLeft$`, `moveRight$`, `pickFlower$`, `putFlower$`, `putBarrier$`, `putGrass$`, `putExit$`, `putPicker$`, `peek$`, `check$`, `giveUp$`
- **Built-in constants**: `width$`, `depth$`, `garden$`
- **Operators**: `+`, `-`, `*`, `/`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `=`
- **User-defined**: identifiers (`VAR`) and integer literals (`INTEGER`)

Outputs a token stream to `tokens.txt` and per-file logs under `./logs/`.

### 2. Parser (`flwr_parser.py`)
Hand-written **recursive-descent parser** that simultaneously builds two tree representations:

- **CST (Concrete Syntax Tree)**: captures the full grammar structure including punctuation and delimiters
- **AST (Abstract Syntax Tree)**: simplified representation retaining only semantically meaningful nodes

Handles: width/depth declarations, variable declarations (scalar and 2D arrays), garden construction blocks, logic blocks, `for` loops, `if/else` selections, assignment expressions, arithmetic operations, function calls with parameters, and constraint expressions.

Both trees are printed to the log file for inspection.

### 3. Interpreter (`interpreter.c`)
A C interpreter that executes structured machine code files. Implements:

| Opcode | Operation |
|--------|-----------|
| `+0` | ASSIGN — copy variable value to memory location |
| `+1` | ADD |
| `-1` | SUB |
| `+2` | MUL |
| `-2` | DIV |
| `+4` | Branch if equal |
| `-4` | Branch if not equal |
| `+5` | Branch if ≥ |
| `-5` | Branch if < |
| `+6` | RFA — read from array |
| `-6` | RIA — write into array |
| `+7` | LOOP — increment and branch |
| `+8` | READ from input |
| `-8` | PRINT to stdout |
| `+9000000000` | HALT |

Maintains a **symbol table** (variable name → memory location → value) and a **label table** (label → instruction index) for branch resolution.

---

## Language Syntax (Flower)

A Flower program has three sections:

```
// 1. Declarations
int width = 10;
int depth = 10;
enum garden[width][depth];
int x = 0;
int y = 0;

// 2. Garden construction block
{
  (0, 3) putBarrier;
  (1, 3) putFlower;
  (0, 0) putPicker;
  (0, 5) putExit;
}

// 3. Logic block
{
  for(i < 3) {
    i = i + 1;
  }
  if(z == 7)
    () giveUp;
  else
    (2) moveDown;
}
```

---

## Running

```bash
git clone https://github.com/khalilshots/FlowerLanguageTranslator
cd FlowerLanguageTranslator

pip install nltk

# Create logs directory
mkdir -p logs

# Run lexer + parser on all .flwr files in test_suit/
python main.py
```

To run the interpreter (requires a machine code input file):

```bash
gcc interpreter.c -o interpreter
./interpreter
```

---

## Test Suite

| File | Tests |
|------|-------|
| `test1.flwr` | Basic for loop, variable declarations, 10×10 garden |
| `test2.flwr` | Nested for loops, navigation algorithm scaffold |
| `test3.flwr` | Full garden construction (barriers, flowers, grass, picker, exit) + if/else |
| `test4.flwr` | Intentionally malformed (missing assignment value) — tests parser error reporting |

---

## Project Structure

```
FlowerLanguageTranslator/
├── flwr_lexer.py       Lexical analyzer (54-token table, symbol + variable tables)
├── flwr_parser.py      Recursive-descent parser (CST + AST construction)
├── main.py             Entry point — runs lexer + parser on all .flwr files
├── interpreter.c       C interpreter with full opcode execution engine
├── test_suit/
│   ├── test1.flwr
│   ├── test2.flwr
│   ├── test3.flwr
│   └── test4.flwr      Malformed program for error handling test
└── logs/               Generated per-file token + parse tree logs
```

---

## Known Limitations

- Code generation (CST → machine code) is not implemented in this version. The interpreter is functional and executes machine code files when provided directly.
- The interpreter's `main()` function expects a hardcoded `loop.txt` input file — update the filename before running.

---

## License

MIT