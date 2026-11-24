// Tiny stack VM, from the published ISA v1 alone. Plain JS, builtins only.
import fs from "node:fs";
import path from "node:path";
const IN_DIR = process.env.MAKEFUN_INPUT_DIR || "/input";
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";
function run(prog, input) {
  const st = new Int32Array(256), cs = new Int32Array(64);
  const mem = new Int32Array(256), out = new Uint8Array(65536);
  let sp = 0, csp = 0, pc = 0, steps = 0, olen = 0, ipos = 0;
  const plen = prog.length;
  try {
    for (;;) {
      if (steps >= 1000000) throw 10;
      if (pc < 0 || pc >= plen) throw 9;
      const op = prog[pc];
      steps++;
      switch (op) {
        case 0x00: throw 0;
        case 0x01:
          if (pc + 2 > plen) throw 9;
          if (sp >= 256) throw 3;
          st[sp++] = prog[pc + 1] << 24 >> 24;
          pc += 2; break;
        case 0x02:
          if (pc + 5 > plen) throw 9;
          if (sp >= 256) throw 3;
          st[sp++] = prog[pc + 1] | prog[pc + 2] << 8 | prog[pc + 3] << 16 | prog[pc + 4] << 24;
          pc += 5; break;
        case 0x03: if (sp < 1) throw 2; sp--; pc++; break;
        case 0x04:
          if (sp < 1) throw 2; if (sp >= 256) throw 3;
          st[sp] = st[sp - 1]; sp++; pc++; break;
        case 0x05: {
          if (sp < 2) throw 2;
          const t = st[sp - 1]; st[sp - 1] = st[sp - 2]; st[sp - 2] = t; pc++; break;
        }
        case 0x06:
          if (sp < 2) throw 2; if (sp >= 256) throw 3;
          st[sp] = st[sp - 2]; sp++; pc++; break;
        case 0x07: {
          if (sp < 3) throw 2;
          const a = st[sp - 3]; st[sp - 3] = st[sp - 2]; st[sp - 2] = st[sp - 1]; st[sp - 1] = a;
          pc++; break;
        }
        case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
        case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
        case 0x20: case 0x21: case 0x22: {
          if (sp < 2) throw 2;
          const b = st[sp - 1], a = st[sp - 2]; let r;
          if (op >= 0x13 && op <= 0x16 && !b) throw 4;
          if (op === 0x10) r = (a + b) | 0;
          else if (op === 0x11) r = (a - b) | 0;
          else if (op === 0x12) r = Math.imul(a, b);
          else if (op === 0x13) r = (a / b) | 0;
          else if (op === 0x14) r = (a % b) | 0;
          else if (op === 0x15) r = (a >>> 0) / (b >>> 0) | 0;
          else if (op === 0x16) r = (a >>> 0) % (b >>> 0) | 0;
          else if (op === 0x18) r = a & b;
          else if (op === 0x19) r = a | b;
          else if (op === 0x1a) r = a ^ b;
          else if (op === 0x1c) r = a << (b & 31);
          else if (op === 0x1d) r = a >> (b & 31);
          else if (op === 0x1e) r = a >>> (b & 31) | 0;
          else if (op === 0x20) r = a === b ? 1 : 0;
          else if (op === 0x21) r = a < b ? 1 : 0;
          else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
          st[sp - 2] = r; sp--; pc++; break;
        }
        case 0x17: case 0x1b:
          if (sp < 1) throw 2;
          st[sp - 1] = op === 0x17 ? -st[sp - 1] | 0 : ~st[sp - 1]; pc++; break;
        case 0x30: case 0x31: case 0x32: {
          if (pc + 3 > plen) throw 9;
          let off = prog[pc + 1] | prog[pc + 2] << 8;
          if (off >= 32768) off -= 65536;
          const next = pc + 3;
          if (op === 0x30) { pc = next + off; break; }
          if (sp < 1) throw 2;
          const v = st[--sp];
          pc = (op === 0x31 ? v === 0 : v !== 0) ? next + off : next; break;
        }
        case 0x33:
          if (pc + 3 > plen) throw 9;
          if (csp >= 64) throw 7;
          cs[csp++] = pc + 3; pc = prog[pc + 1] | prog[pc + 2] << 8; break;
        case 0x34: if (csp < 1) throw 8; pc = cs[--csp]; break;
        case 0x40: {
          if (sp < 1) throw 2;
          const ad = st[sp - 1];
          if (ad < 0 || ad > 255) throw 6;
          st[sp - 1] = mem[ad]; pc++; break;
        }
        case 0x41: { // STORE: value below, address on top
          if (sp < 2) throw 2;
          const ad = st[sp - 1];
          if (ad < 0 || ad > 255) throw 6;
          mem[ad] = st[sp - 2]; sp -= 2; pc++; break;
        }
        case 0x50: {
          if (sp < 1) throw 2;
          const s = String(st[sp - 1]);
          if (olen + s.length > 65536) throw 11;
          sp--; for (let i = 0; i < s.length; i++) out[olen++] = s.charCodeAt(i);
          pc++; break;
        }
        case 0x51:
          if (sp < 1) throw 2;
          if (olen >= 65536) throw 11;
          out[olen++] = st[--sp] & 255; pc++; break;
        case 0x52:
          if (sp >= 256) throw 3;
          st[sp++] = ipos < input.length ? input[ipos++] : -1; pc++; break;
        case 0x53: if (sp < 1) throw 2; throw st[--sp] & 255;
        default: throw 5;
      }
    }
  } catch (e) {
    return { code: e, out, len: olen };
  }
}
let ids = [];
try { ids = fs.readdirSync(IN_DIR).sort(); } catch { ids = []; }
for (const id of ids) {
  try {
    const prog = fs.readFileSync(path.join(IN_DIR, id, "program.bin"));
    let input;
    try { input = fs.readFileSync(path.join(IN_DIR, id, "input.bin")); }
    catch { input = Buffer.alloc(0); }
    const r = run(prog, input), dir = path.join(OUT_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "stdout.bin"), Buffer.from(r.out.subarray(0, r.len)));
    fs.writeFileSync(path.join(dir, "exit.txt"), r.code + "\n");
  } catch { }
}
