/* the flower patch, a browser playground for the Flower language.
   Mirrors the token table in flwr_lexer.py and the grammar handled by
   flwr_parser.py, plus a small tree-walking interpreter so the picker
   can actually go for a walk. */

'use strict';

/* ================= lexing ================= */

const KEYWORDS = ['if', 'else', 'for', 'output', 'null', 'break', 'int', 'enum'];
const BUILTINS = ['peek', 'pickFlower', 'moveUp', 'moveDown', 'moveLeft', 'moveRight',
  'putFlower', 'putGrass', 'putBarrier', 'putPicker', 'putExit', 'check', 'giveUp'];

const LINE_RULES = [
  ['comment', /^\/\/.*/],
  ['space', /^[ \t\r]+/],
  ['num', /^[0-9]+/],
  ['word', /^[A-Za-z][A-Za-z0-9]*/],
  ['op', /^(==|!=|<=|>=|[+\-*/=<>])/],
  ['punc', /^[(),[\]{};]/],
  ['stray', /^[^ ]/],
];

function tokenizeLine(text) {
  const out = [];
  let rest = text, col = 0;
  while (rest.length) {
    for (const [kind, re] of LINE_RULES) {
      const m = re.exec(rest);
      if (m) {
        out.push({ kind, text: m[0], col });
        col += m[0].length;
        rest = rest.slice(m[0].length);
        break;
      }
    }
  }
  return out;
}

function wilt(line, msg) {
  const e = new Error(msg);
  e.line = line;
  e.wilted = true;
  return e;
}

function lex(src) {
  const tokens = [];
  src.split('\n').forEach((lineText, i) => {
    for (const t of tokenizeLine(lineText)) {
      if (t.kind === 'space' || t.kind === 'comment') continue;
      if (t.kind === 'stray') throw wilt(i + 1, `i don't recognize the symbol “${t.text}”`);
      let kind = t.kind;
      if (kind === 'word') {
        kind = KEYWORDS.includes(t.text) ? 'kw'
          : BUILTINS.includes(t.text) ? 'fn'
          : 'var';
      }
      tokens.push({ kind, text: t.text, line: i + 1 });
    }
  });
  return tokens;
}

/* ================= parsing =================
   program := decl* block block
   decl    := 'int' VAR ('=' expr)? ';'
            | 'enum' 'garden' '[' expr ']' '[' expr ']' ';'
   stmt    := '(' args? ')' BUILTIN ';'
            | VAR '=' expr ';'
            | 'for' '(' cond ')' body
            | 'if' '(' cond ')' body ('else' body)?
            | 'output' '(' expr ')' ';'
            | 'break' ';'                                  */

function parse(src) {
  const toks = lex(src);
  let p = 0;

  const cur = () => toks[p];
  const at = (kind, text) => {
    const t = toks[p];
    return !!t && t.kind === kind && (text === undefined || t.text === text);
  };
  const take = () => toks[p++];
  const fail = (what) => {
    const t = toks[p];
    const line = t ? t.line : (toks.length ? toks[toks.length - 1].line : 1);
    throw wilt(line, t
      ? `expected ${what}, but found “${t.text}”`
      : `expected ${what}, but the program just ends`);
  };
  const expect = (kind, text, what) => (at(kind, text) ? take() : fail(what));

  function parseExpr() {
    let left = parseTerm();
    while (at('op', '+') || at('op', '-')) {
      const op = take().text;
      left = { t: 'bin', op, l: left, r: parseTerm() };
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    while (at('op', '*') || at('op', '/')) {
      const op = take().text;
      left = { t: 'bin', op, l: left, r: parseFactor() };
    }
    return left;
  }

  function parseFactor() {
    if (at('op', '-')) { take(); return { t: 'bin', op: '-', l: { t: 'num', v: 0 }, r: parseFactor() }; }
    if (at('num')) { const t = take(); return { t: 'num', v: parseInt(t.text, 10) }; }
    if (at('kw', 'null')) { take(); return { t: 'num', v: 0 }; }
    if (at('var')) { const t = take(); return { t: 'var', name: t.text, line: t.line }; }
    if (at('punc', '(')) {
      const open = take();
      if (at('punc', ')')) {           // ( ) check, a call used as a value
        take();
        const fn = expect('fn', undefined, 'a garden command after ( )');
        return { t: 'call', fn: fn.text, args: [], line: open.line };
      }
      const inner = parseExpr();
      expect('punc', ')', 'a closing )');
      if (at('fn')) {                  // (2) peek, a call with an argument
        const fn = take();
        return { t: 'call', fn: fn.text, args: [inner], line: open.line };
      }
      return inner;                    // plain parentheses
    }
    return fail('a number, a variable, or (');
  }

  const RELOPS = ['==', '!=', '<', '>', '<=', '>='];
  function parseCond() {
    const l = parseExpr();
    if (!at('op') || !RELOPS.includes(cur().text)) fail('a comparison (== != < > <= >=)');
    const op = take().text;
    return { t: 'cmp', op, l, r: parseExpr() };
  }

  function parseBody() {
    if (at('punc', '{')) return parseBlock();
    return [parseStmt()];
  }

  function parseBlock() {
    expect('punc', '{', 'a { to open the block');
    const stmts = [];
    while (!at('punc', '}')) {
      if (p >= toks.length) fail('a } to close the block');
      stmts.push(parseStmt());
    }
    take();
    return stmts;
  }

  function parseStmt() {
    if (at('kw', 'for')) {
      const kw = take();
      expect('punc', '(', 'a ( after for');
      const cond = parseCond();
      expect('punc', ')', 'a closing )');
      return { t: 'for', cond, body: parseBody(), line: kw.line };
    }
    if (at('kw', 'if')) {
      const kw = take();
      expect('punc', '(', 'a ( after if');
      const cond = parseCond();
      expect('punc', ')', 'a closing )');
      const then = parseBody();
      let other = null;
      if (at('kw', 'else')) { take(); other = parseBody(); }
      return { t: 'if', cond, then, other, line: kw.line };
    }
    if (at('kw', 'break')) {
      const kw = take();
      expect('punc', ';', 'a ; after break');
      return { t: 'break', line: kw.line };
    }
    if (at('kw', 'output')) {
      const kw = take();
      expect('punc', '(', 'a ( after output');
      const value = parseExpr();
      expect('punc', ')', 'a closing )');
      expect('punc', ';', 'a ; after output(...)');
      return { t: 'output', value, line: kw.line };
    }
    if (at('punc', '(')) {
      const open = take();
      const args = [];
      if (!at('punc', ')')) {
        args.push(parseExpr());
        while (at('punc', ',')) { take(); args.push(parseExpr()); }
      }
      expect('punc', ')', 'a closing )');
      const fn = expect('fn', undefined, 'a garden command after the ( ) arguments');
      expect('punc', ';', 'a ; to end the command');
      return { t: 'call', fn: fn.text, args, line: open.line };
    }
    if (at('var')) {
      const name = take();
      expect('op', '=', 'an = for the assignment');
      const value = parseExpr();
      expect('punc', ';', 'a ; to end the assignment');
      return { t: 'assign', name: name.text, value, line: name.line };
    }
    return fail('a statement (an assignment, a command, for, if, output, or break)');
  }

  // declarations
  const decls = [];
  let gardenDecl = null;
  while (!at('punc', '{')) {
    if (p >= toks.length) throw wilt(1, 'the program needs two { } blocks after the declarations');
    if (at('kw', 'int')) {
      take();
      const name = expect('var', undefined, 'a variable name after int');
      let init = null;
      if (at('op', '=')) { take(); init = parseExpr(); }
      expect('punc', ';', 'a ; to end the declaration');
      decls.push({ name: name.text, init, line: name.line });
    } else if (at('kw', 'enum')) {
      const kw = take();
      expect('var', 'garden', 'the word garden after enum');
      expect('punc', '[', 'a [');
      const a = parseExpr();
      expect('punc', ']', 'a ]');
      expect('punc', '[', 'a second [');
      const b = parseExpr();
      expect('punc', ']', 'a ]');
      expect('punc', ';', 'a ; to end the declaration');
      gardenDecl = { a, b, line: kw.line };
    } else {
      fail('a declaration (int or enum) before the blocks');
    }
  }

  const garden = parseBlock();
  const logic = parseBlock();
  if (p < toks.length) throw wilt(cur().line, `there's extra text after the last block (“${cur().text}”)`);
  return { decls, gardenDecl, garden, logic, tokens: toks };
}

/* ================= the world ================= */

const CELL_CODE = { empty: 0, flower: 1, grass: 2, barrier: 3, exit: 4 };

function makeEnv(prog, notes) {
  const env = new Map();
  for (const d of prog.decls) {
    env.set(d.name, d.init ? evalExpr(d.init, env, null, notes) : 0);
  }
  return env;
}

function evalExpr(e, env, world, notes) {
  switch (e.t) {
    case 'num': return e.v;
    case 'var': {
      if (env.has(e.name)) return env.get(e.name);
      notes && notes.push({ kind: 'warn', msg: `“${e.name}” was never planted (declared), so it counts as 0` });
      env.set(e.name, 0);
      return 0;
    }
    case 'bin': {
      const l = evalExpr(e.l, env, world, notes);
      const r = evalExpr(e.r, env, world, notes);
      switch (e.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r === 0 ? 0 : Math.trunc(l / r);
      }
      return 0;
    }
    case 'cmp': {
      const l = evalExpr(e.l, env, world, notes);
      const r = evalExpr(e.r, env, world, notes);
      switch (e.op) {
        case '==': return l === r;
        case '!=': return l !== r;
        case '<': return l < r;
        case '>': return l > r;
        case '<=': return l <= r;
        case '>=': return l >= r;
      }
      return false;
    }
    case 'call': {
      if (!world) throw wilt(e.line, `${e.fn} can't be used before the garden exists`);
      if (e.fn === 'check') return CELL_CODE[world.grid[world.py][world.px]];
      if (e.fn === 'peek') {
        const [dx, dy] = world.lastDir;
        const nx = world.px + dx, ny = world.py + dy;
        if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.d) return CELL_CODE.barrier;
        return CELL_CODE[world.grid[ny][nx]];
      }
      throw wilt(e.line, `${e.fn} doesn't hand back a value; only check and peek do`);
    }
  }
  return 0;
}

function buildWorld(prog) {
  const notes = [];
  const env = makeEnv(prog, notes);

  let w = env.has('width') ? env.get('width') : null;
  let d = env.has('depth') ? env.get('depth') : null;
  if ((w === null || d === null) && prog.gardenDecl) {
    // enum garden[a][b]: the test files swap the order, so trust width/depth vars first
    const a = evalExpr(prog.gardenDecl.a, env, null, notes);
    const b = evalExpr(prog.gardenDecl.b, env, null, notes);
    if (w === null) w = b;
    if (d === null) d = a;
  }
  if (!w || !d) {
    notes.push({ kind: 'warn', msg: 'no width or depth found, planting a 6×6 garden' });
    w = w || 6; d = d || 6;
  }
  w = Math.max(2, Math.min(14, w));
  d = Math.max(2, Math.min(14, d));

  const world = {
    w, d,
    grid: Array.from({ length: d }, () => Array(w).fill('empty')),
    px: 0, py: 0,
    hasPicker: false,
    bouquet: 0,
    steps: 0,
    lastDir: [0, 1],
    done: null,
  };

  for (const s of prog.garden) {
    if (s.t !== 'call') {
      notes.push({ kind: 'warn', msg: `line ${s.line}: only (x, y) put… commands belong in the garden block, so this was skipped` });
      continue;
    }
    applyPut(world, env, s, notes);
  }
  if (!world.hasPicker) {
    notes.push({ kind: 'warn', msg: 'no putPicker in the garden block, so the picker starts at (0, 0)' });
  }
  syncXY(world, env);
  return { world, env, notes };
}

function applyPut(world, env, s, notes) {
  const vals = s.args.map(a => evalExpr(a, env, world, notes));
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < world.w && y < world.d;

  const PUTS = { putFlower: 'flower', putGrass: 'grass', putBarrier: 'barrier', putExit: 'exit' };
  if (s.fn in PUTS || s.fn === 'putPicker') {
    const [x, y] = [vals[0] ?? 0, vals[1] ?? 0];
    if (!inBounds(x, y)) {
      notes.push({ kind: 'warn', msg: `line ${s.line}: (${x}, ${y}) is outside the garden, so it was skipped` });
      return true;
    }
    if (s.fn === 'putPicker') {
      world.px = x; world.py = y; world.hasPicker = true;
    } else {
      world.grid[y][x] = PUTS[s.fn];
    }
    return true;
  }
  return false;
}

function syncXY(world, env) {
  if (env.has('x')) env.set('x', world.px);
  if (env.has('y')) env.set('y', world.py);
}

/* ================= the stroll (interpreter) ================= */

const DIRS = { moveUp: [0, -1], moveDown: [0, 1], moveLeft: [-1, 0], moveRight: [1, 0] };
const LOOP_CAP = 2000;

function* runLogic(prog, world, env) {
  const ctx = { world, env, breaking: false };
  yield* execStmts(prog.logic, ctx);
  if (!world.done) {
    world.done = 'end';
    yield { kind: 'end' };
  }
}

function* execStmts(stmts, ctx) {
  for (const s of stmts) {
    if (ctx.breaking || ctx.world.done) return;
    yield* execStmt(s, ctx);
  }
}

function* execStmt(s, ctx) {
  const { world, env } = ctx;
  const notes = [];
  yield { kind: 'line', line: s.line };

  switch (s.t) {
    case 'assign': {
      if (!env.has(s.name)) {
        notes.push({ kind: 'warn', msg: `“${s.name}” sprouted on its own; it was never declared` });
      }
      env.set(s.name, evalExpr(s.value, env, world, notes));
      break;
    }
    case 'output': {
      const v = evalExpr(s.value, env, world, notes);
      yield { kind: 'output', value: v };
      break;
    }
    case 'break': {
      ctx.breaking = true;
      break;
    }
    case 'if': {
      const hit = evalExpr(s.cond, env, world, notes);
      yield* flushNotes(notes);
      yield* execStmts(hit ? s.then : (s.other || []), ctx);
      return;
    }
    case 'for': {
      let laps = 0;
      while (evalExpr(s.cond, env, world, notes)) {
        if (++laps > LOOP_CAP) {
          yield { kind: 'warn', msg: `the loop on line ${s.line} ran ${LOOP_CAP} laps, stopping it before it wears a trench` };
          break;
        }
        yield* execStmts(s.body, ctx);
        if (world.done) return;
        if (ctx.breaking) { ctx.breaking = false; break; }
        yield { kind: 'line', line: s.line };
      }
      break;
    }
    case 'call':
      yield* execCall(s, ctx, notes);
      break;
  }
  yield* flushNotes(notes);
}

function* flushNotes(notes) {
  while (notes.length) yield notes.shift();
}

function* execCall(s, ctx, notes) {
  const { world, env } = ctx;
  const fn = s.fn;

  if (fn in DIRS) {
    const n = s.args.length ? evalExpr(s.args[0], env, world, notes) : 1;
    yield* flushNotes(notes);
    yield* walk(fn, Math.max(0, Math.min(99, n)), ctx);
    return;
  }

  switch (fn) {
    case 'pickFlower': {
      const here = world.grid[world.py][world.px];
      if (here === 'flower') {
        world.grid[world.py][world.px] = 'empty';
        world.bouquet += 1;
        if (env.has('bouquet')) env.set('bouquet', world.bouquet);
        yield { kind: 'pick', x: world.px, y: world.py, bouquet: world.bouquet };
      } else {
        yield { kind: 'warn', msg: `nothing to pick at (${world.px}, ${world.py}), just ${here === 'grass' ? 'grass' : 'bare earth'}` };
      }
      return;
    }
    case 'giveUp': {
      world.done = 'giveup';
      yield { kind: 'giveup' };
      return;
    }
    case 'check':
    case 'peek': {
      const v = evalExpr({ t: 'call', fn, args: [], line: s.line }, env, world, notes);
      yield { kind: 'output', value: v, mut: true };
      return;
    }
    default: {
      if (applyPut(world, env, s, notes)) {
        yield* flushNotes(notes);
        yield { kind: 'world' };
        return;
      }
      yield { kind: 'warn', msg: `line ${s.line}: i don't know how to ${fn}` };
    }
  }
}

function* walk(fn, n, ctx) {
  const { world, env } = ctx;
  const [dx, dy] = DIRS[fn];
  world.lastDir = [dx, dy];
  for (let k = 0; k < n; k++) {
    const nx = world.px + dx, ny = world.py + dy;
    const offEdge = nx < 0 || ny < 0 || nx >= world.w || ny >= world.d;
    if (offEdge || world.grid[ny][nx] === 'barrier') {
      yield { kind: 'bump', x: nx, y: ny, edge: offEdge };
      return;
    }
    world.px = nx; world.py = ny;
    world.steps += 1;
    syncXY(world, env);
    yield { kind: 'move', x: nx, y: ny };
    if (world.grid[ny][nx] === 'exit') {
      world.done = 'exit';
      yield { kind: 'exit' };
      return;
    }
  }
}

/* ================= construction-block codegen (for painting) ================= */

function gardenToLines(world) {
  const lines = ['// construction of the world'];
  const byType = { barrier: [], flower: [], grass: [], exit: [] };
  for (let y = 0; y < world.d; y++) {
    for (let x = 0; x < world.w; x++) {
      const c = world.grid[y][x];
      if (c !== 'empty') byType[c].push(`(${x}, ${y}) put${c[0].toUpperCase()}${c.slice(1)} ;`);
    }
  }
  lines.push(...byType.barrier, ...byType.flower, ...byType.grass);
  lines.push(`(${world.px}, ${world.py}) putPicker ;`);
  lines.push(...byType.exit);
  return lines;
}

// find the first top-level { ... } (skipping // comments)
function findFirstBlock(src) {
  let depth = 0, open = -1;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) open = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && open !== -1) return { open, close: i };
    }
  }
  return null;
}

function rewriteConstructionBlock(src, lines) {
  const r = findFirstBlock(src);
  if (!r) return null;
  const body = '\n' + lines.join('\n') + '\n';
  return src.slice(0, r.open + 1) + body + src.slice(r.close);
}

/* ================= seed packets ================= */

const SEEDS = {
  stroll: `// a little stroll: picks every flower, then heads for the gate

int width = 6;
int depth = 6;
enum garden[depth][width];
int bouquet = 0;
int x = 0;
int y = 0;
int i;

{
// construction of the world
(1, 2) putBarrier ;
(2, 2) putBarrier ;
(3, 2) putBarrier ;
(2, 0) putFlower ;
(4, 1) putFlower ;
(0, 3) putFlower ;
(2, 4) putFlower ;
(4, 4) putGrass ;
(0, 0) putPicker ;
(5, 5) putExit ;
}

{
(2) moveRight ;
( ) pickFlower ;
(2) moveRight ;
(1) moveDown ;
( ) pickFlower ;
(4) moveLeft ;
(2) moveDown ;
( ) pickFlower ;
(2) moveRight ;
(1) moveDown ;
( ) pickFlower ;
(1) moveDown ;
for(i < 3) {
(1) moveRight ;
i = i + 1 ;
}
}
`,
  test1: `int width = 10;
int depth = 10;
int bouquet = 0 ;
enum garden[width] [depth] ;
int x = 0 ;
int y = 0 ;
int i;
int m;


{

//Construction of the world

}


{


for(i < 3) {

i = i+1;

}

}
`,
  test2: `int width = 6 ;
int depth = 6 ;
enum garden[depth] [width] ;
int bouquet = 0 ;
int x = 0 ;
int y = 0 ;
int initalx;
int initialy;

{

//construction of the world

}

{
//This is the beginning code from the start cell to a flowerbed; x and y take the value of the current cell where the picker reached

initialx = x;
initialy = y;

for(i != initialx) {
for(j != initialy) {
(1) moveDown ;



// the code keeps using the four move functions following an algorithm to find and pick all flowers until it circles around the whole flowerbed
}
}
}
`,
  test3: `int width = 6;
int depth = 6;
enum garden[depth] [width] ;
int bouquet = 0;
int x = 0;
int y = 0;
int i ;
int j ;
int z ;

{
//construction of the world
(0, 3) putBarrier ;
(0, 2) putBarrier ;
(1, 2) putBarrier ;
(2, 2) putBarrier ;
(3, 2) putBarrier ;
(4, 2) putBarrier ;
(5, 2) putBarrier ;
(5, 3) putBarrier ;
(5, 4) putBarrier ;
(4, 4) putBarrier ;
(3, 4) putBarrier ;
(2, 4) putBarrier ;
(1, 4) putBarrier ;
(0, 4) putBarrier ;
(1, 3) putFlower ;
(2, 3) putFlower ;
(3, 3) putFlower ;
(4, 3) putGrass ;
(0, 0) putPicker ;
(0, 5) putExit ;
}

{

i = 5;
j = 0;
if( z == 7 )
( ) giveUp ;
else
(2) moveDown ;
//code for reaching the exit

}
`,
  test4: `int width = 6;
int depth = 6;
enum garden[depth] [width] ;
int bouquet = 0;
int x = 0;
int y = 0;

{

//construction of the world

}

{
//This is the beginning code from the start cell to a flowerbed; x and y take the value of the current cell where the picker reached

//No value assigned for initalx

initialx = ;
initialy = y;


for(i != initialx) {
for(j != initialy) {
(1) moveDown ;


// the code keeps using the four move functions following an algorithm to find and pick all flowers until it circles around the whole flowerbed
}
}
}
`,
};

/* ================= UI ================= */

function initUI() {
  const $ = (id) => document.getElementById(id);
  const codeEl = $('code');
  const hlEl = $('hl');
  const boardEl = $('board');
  const boardWrap = $('board-wrap');
  const sprite = $('pickerSprite');
  const consoleEl = $('console');
  const tokensEl = $('tokens');

  const FLOWERS = ['🌷', '🌸', '🌼', '🌻'];
  const CELL_EMOJI = { grass: '🌿', barrier: '🪨', exit: '🚪' };

  let prog = null;
  let world = null;
  let env = null;
  let gen = null;
  let timer = null;
  let dirty = true;
  let activeLine = 0;
  let oopsLine = 0;
  let tool = 'flower';
  let painting = false;

  /* ---- editor highlight ---- */

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function paintCode() {
    const lines = codeEl.value.split('\n');
    hlEl.innerHTML = lines.map((line, i) => {
      const n = i + 1;
      const cls = n === oopsLine ? 'ln oops' : n === activeLine ? 'ln active' : 'ln';
      const html = tokenizeLine(line).map((t) => {
        const safe = esc(t.text);
        if (t.kind === 'comment') return `<span class="c-comment">${safe}</span>`;
        if (t.kind === 'num') return `<span class="c-num">${safe}</span>`;
        if (t.kind === 'op') return `<span class="c-op">${safe}</span>`;
        if (t.kind === 'punc') return `<span class="c-punc">${safe}</span>`;
        if (t.kind === 'word') {
          if (KEYWORDS.includes(t.text)) return `<span class="c-kw">${safe}</span>`;
          if (BUILTINS.includes(t.text)) return `<span class="c-fn">${safe}</span>`;
        }
        return safe;
      }).join('');
      return `<span class="${cls}">${html || ' '}</span>`;
    }).join('\n');
    hlEl.scrollTop = codeEl.scrollTop;
    hlEl.scrollLeft = codeEl.scrollLeft;
  }

  function setLine(n, oops) {
    activeLine = oops ? 0 : n;
    oopsLine = oops ? n : 0;
    paintCode();
    if (n) {
      const lh = codeEl.scrollHeight / Math.max(1, codeEl.value.split('\n').length);
      const y = (n - 1) * lh;
      if (y < codeEl.scrollTop || y > codeEl.scrollTop + codeEl.clientHeight - lh * 2) {
        codeEl.scrollTop = Math.max(0, y - codeEl.clientHeight / 2);
        hlEl.scrollTop = codeEl.scrollTop;
      }
    }
  }

  codeEl.addEventListener('input', () => { dirty = true; oopsLine = 0; activeLine = 0; paintCode(); });
  codeEl.addEventListener('scroll', () => {
    hlEl.scrollTop = codeEl.scrollTop;
    hlEl.scrollLeft = codeEl.scrollLeft;
  });
  codeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd } = codeEl;
      codeEl.setRangeText('  ', s, selectionEnd, 'end');
      dirty = true;
      paintCode();
    }
  });

  /* ---- the diary ---- */

  function say(msg, cls) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = msg;
    consoleEl.appendChild(p);
    while (consoleEl.children.length > 200) consoleEl.removeChild(consoleEl.firstChild);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  /* ---- tokens pane ---- */

  function showTokens(tokens) {
    tokensEl.innerHTML = '';
    let row = null, lastLine = 0;
    for (const t of tokens) {
      if (t.line !== lastLine) {
        row = document.createElement('div');
        row.className = 'tok-line';
        const no = document.createElement('span');
        no.className = 'no';
        no.textContent = String(t.line);
        row.appendChild(no);
        tokensEl.appendChild(row);
        lastLine = t.line;
      }
      const chip = document.createElement('span');
      chip.className = `tk tk-${t.kind}`;
      chip.textContent = t.text;
      chip.title = t.kind === 'kw' ? 'keyword' : t.kind === 'fn' ? 'garden command' : t.kind === 'var' ? 'identifier' : t.kind === 'num' ? 'integer' : t.kind;
      row.appendChild(chip);
    }
    if (!tokens.length) tokensEl.textContent = 'nothing here yet. plant a program first.';
  }

  /* ---- board ---- */

  function flowerFor(x, y) { return FLOWERS[(x * 7 + y * 13) % FLOWERS.length]; }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${world.w}, var(--cell))`;
    boardEl.innerHTML = '';
    for (let y = 0; y < world.d; y++) {
      for (let x = 0; x < world.w; x++) {
        const cell = document.createElement('div');
        cell.className = `cell ${(x + y) % 2 ? 'b' : 'a'}`;
        cell.dataset.x = x;
        cell.dataset.y = y;
        const c = world.grid[y][x];
        if (c !== 'empty') {
          const span = document.createElement('span');
          span.textContent = c === 'flower' ? flowerFor(x, y) : CELL_EMOJI[c];
          span.style.transform = `rotate(${((x * 31 + y * 17) % 13) - 6}deg)`;
          cell.appendChild(span);
        }
        boardEl.appendChild(cell);
      }
    }
    placeSprite(false);
    updateStatus();
  }

  function cellAt(x, y) { return boardEl.children[y * world.w + x]; }

  function cellSize() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell')) || 52;
  }

  function placeSprite(animate) {
    if (!world) { sprite.hidden = true; return; }
    sprite.hidden = false;
    sprite.innerHTML = '<span class="bob">🐝</span>';
    if (!animate) sprite.style.transition = 'none';
    const s = cellSize();
    const base = boardEl.offsetTop, left = boardEl.offsetLeft;
    sprite.style.transform = `translate(${left + 3 + world.px * s}px, ${base + 3 + world.py * s}px)`;
    if (!animate) requestAnimationFrame(() => { sprite.style.transition = ''; });
  }

  function updateStatus() {
    $('stat-bouquet').textContent = `🧺 ${world ? world.bouquet : 0}`;
    $('stat-pos').textContent = `📍 (${world ? world.px : 0}, ${world ? world.py : 0})`;
    $('stat-steps').textContent = `👣 ${world ? world.steps : 0}`;
  }

  function petals(x, y, count) {
    const s = cellSize();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      p.textContent = ['🌸', '✿', '❀'][i % 3];
      p.style.left = `${boardEl.offsetLeft + x * s + 10 + Math.random() * 24}px`;
      p.style.top = `${boardEl.offsetTop + y * s + Math.random() * 14}px`;
      p.style.setProperty('--dx', `${Math.round(Math.random() * 50 - 25)}px`);
      p.style.animationDelay = `${Math.random() * 0.25}s`;
      boardWrap.appendChild(p);
      setTimeout(() => p.remove(), 2100);
    }
  }

  function petalRain() {
    const w = world.w;
    for (let i = 0; i < 26; i++) {
      setTimeout(() => { if (world) petals(Math.floor(Math.random() * w), 0, 1); }, i * 55);
    }
  }

  /* ---- planting ---- */

  function plant(quiet) {
    stopStroll();
    oopsLine = 0; activeLine = 0;
    try {
      prog = parse(codeEl.value);
    } catch (e) {
      prog = null; world = null; gen = null;
      showTokens([]);
      setLine(e.line || 1, true);
      say(`🥀 line ${e.line || '?'}: ${e.message}`, 'oops');
      return false;
    }
    const built = buildWorld(prog);
    world = built.world;
    env = built.env;
    gen = null;
    dirty = false;
    renderBoard();
    showTokens(prog.tokens);
    paintCode();
    for (const n of built.notes) say(`🍂 ${n.msg}`, 'warn');
    if (!quiet) say(`planted a ${world.w}×${world.d} garden. the picker waits at (${world.px}, ${world.py}).`, 'mut');
    return true;
  }

  /* ---- running ---- */

  function ensureGen() {
    if (dirty || !prog || !world) {
      if (!plant(true)) return false;
    }
    if (!gen || world.done) {
      const built = buildWorld(prog);   // fresh world for a fresh stroll
      world = built.world;
      env = built.env;
      renderBoard();
      gen = runLogic(prog, world, env);
    }
    return true;
  }

  function applyEvent(ev) {
    switch (ev.kind) {
      case 'line':
        setLine(ev.line, false);
        break;
      case 'move':
        placeSprite(true);
        updateStatus();
        break;
      case 'bump': {
        sprite.classList.remove('bonk');
        void sprite.offsetWidth;
        sprite.classList.add('bonk');
        say(ev.edge
          ? `bonk! that's the hedge at the edge of the garden.`
          : `bonk! a rock at (${ev.x}, ${ev.y}). the picker stops.`, 'warn');
        break;
      }
      case 'pick': {
        const cell = cellAt(ev.x, ev.y);
        if (cell) cell.innerHTML = '';
        petals(ev.x, ev.y, 6);
        updateStatus();
        say(`picked a flower at (${ev.x}, ${ev.y}). bouquet: ${ev.bouquet}`);
        break;
      }
      case 'world':
        renderBoard();
        break;
      case 'output':
        say(ev.mut ? `(whispered) ${ev.value}` : `output: ${ev.value}`, ev.mut ? 'mut' : '');
        break;
      case 'warn':
        say(`🍂 ${ev.msg}`, 'warn');
        break;
      case 'giveup':
        say('🥀 the picker sat down among the weeds and gave up.', 'oops');
        break;
      case 'exit':
        say(`🌼 through the gate! ${world.bouquet} flower${world.bouquet === 1 ? '' : 's'} in the basket, ${world.steps} steps.`, 'win');
        petalRain();
        break;
      case 'end':
        say(`the program ends here. the picker rests at (${world.px}, ${world.py}) with ${world.bouquet} flower${world.bouquet === 1 ? '' : 's'}.`, 'mut');
        break;
    }
  }

  function advance() {
    if (!gen) return false;
    let r;
    try {
      r = gen.next();
    } catch (e) {
      say(`🥀 line ${e.line || '?'}: ${e.message}`, 'oops');
      setLine(e.line || 1, true);
      gen = null;
      return false;
    }
    if (r.done) { gen = null; activeLine = 0; paintCode(); return false; }
    applyEvent(r.value);
    return true;
  }

  function tickDelay() {
    const v = parseInt($('speed').value, 10);
    return 760 - v * 68;   // 🐌 692ms … 🐝 80ms
  }

  function startStroll() {
    if (timer) { stopStroll(); return; }
    if (!ensureGen()) return;
    say('off we go!', 'mut');
    $('run').textContent = 'pause ⏸';
    const loop = () => {
      // moves get the full beat; bookkeeping events hurry along
      let keep = true;
      for (let i = 0; i < 6; i++) {
        keep = advance();
        if (!keep || ['move', 'bump', 'pick', 'output'].includes(lastKind)) break;
      }
      if (keep) timer = setTimeout(loop, tickDelay());
      else stopStroll();
    };
    timer = setTimeout(loop, tickDelay());
  }

  let lastKind = '';
  const rawApply = applyEvent;
  applyEvent = (ev) => { lastKind = ev.kind; rawApply(ev); };

  function stopStroll() {
    if (timer) clearTimeout(timer);
    timer = null;
    $('run').textContent = 'take a stroll ▶';
  }

  /* ---- painting the garden ---- */

  function stamp(cell) {
    if (!world) return;
    const x = +cell.dataset.x, y = +cell.dataset.y;
    if (tool === 'picker') {
      world.px = x; world.py = y; world.hasPicker = true;
      if (world.grid[y][x] === 'barrier') world.grid[y][x] = 'empty';
    } else if (tool === 'erase') {
      world.grid[y][x] = 'empty';
    } else {
      world.grid[y][x] = tool;
      if (tool === 'barrier' && world.px === x && world.py === y) world.grid[y][x] = 'empty';
    }
    const next = rewriteConstructionBlock(codeEl.value, gardenToLines(world));
    if (next !== null) {
      codeEl.value = next;
      paintCode();
      dirty = true;      // re-plant before the next stroll
    }
    renderBoard();
  }

  boardEl.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    if (!world) {
      say('🍂 plant a program first, then paint away.', 'warn');
      return;
    }
    stopStroll();
    painting = true;
    stamp(cell);
  });
  boardEl.addEventListener('pointerover', (e) => {
    if (!painting) return;
    const cell = e.target.closest('.cell');
    if (cell) stamp(cell);
  });
  window.addEventListener('pointerup', () => { painting = false; });

  document.querySelectorAll('.stamp').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stamp').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      tool = btn.dataset.tool;
    });
  });

  /* ---- tabs, buttons, seeds ---- */

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      consoleEl.classList.toggle('hidden', btn.dataset.pane !== 'console');
      tokensEl.classList.toggle('hidden', btn.dataset.pane !== 'tokens');
    });
  });

  $('plant').addEventListener('click', () => plant(false));
  $('run').addEventListener('click', startStroll);
  $('step').addEventListener('click', () => {
    stopStroll();
    if (!ensureGen()) return;
    // one step = advance until something visible happens
    for (let i = 0; i < 8; i++) {
      if (!advance()) break;
      if (['move', 'bump', 'pick', 'output', 'giveup', 'exit', 'end'].includes(lastKind)) break;
    }
  });
  $('reset').addEventListener('click', () => {
    stopStroll();
    consoleEl.innerHTML = '';
    plant(false);
  });

  $('examples').addEventListener('change', (e) => {
    stopStroll();
    codeEl.value = SEEDS[e.target.value];
    consoleEl.innerHTML = '';
    dirty = true;
    plant(false);
  });

  window.addEventListener('resize', () => world && placeSprite(false));

  // first bloom
  codeEl.value = SEEDS.stroll;
  plant(false);
  say('hello! pick a stamp and click the garden, or just press “take a stroll”.', 'mut');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initUI);
}

// let the core be poked at from node for quick checks
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { lex, parse, buildWorld, runLogic, gardenToLines, rewriteConstructionBlock, SEEDS };
}
