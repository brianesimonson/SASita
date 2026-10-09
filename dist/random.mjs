// MT19937 with the 2002 initialization. Integer operations are unsigned 32-bit.
// The core is independently testable; SAS distribution/float sequence equivalence
// is not implied by matching this core.
export function createMT32(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error('MT32 seed must be an unsigned 32-bit integer');
  const state = new Uint32Array(624);
  state[0] = seed >>> 0;
  for (let i = 1; i < 624; i++)
    state[i] = (Math.imul(1812433253, state[i-1] ^ (state[i-1] >>> 30)) + i) >>> 0;
  let index = 624;
  return {
    uint32() {
      if (index === 624) {
        for (let i = 0; i < 624; i++) {
          const y = (state[i] & 0x80000000) | (state[(i+1)%624] & 0x7fffffff);
          state[i] = state[(i+397)%624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
        }
        index = 0;
      }
      let y = state[index++];
      y ^= y >>> 11;
      y ^= (y << 7) & 0x9d2c5680;
      y ^= (y << 15) & 0xefc60000;
      y ^= y >>> 18;
      return y >>> 0;
    }
  };
}

export function createRandomStream(tick, logs) {
  let generator = null;
  function initialize(args) {
    if (generator) return; // First initialization wins within this DATA step.
    if (args.length !== 2 || typeof args[0] !== 'string')
      throw new Error("Use CALL STREAMINIT('MT32', positive_seed). SAS default MTHYBRID is not implemented.");
    const method = args[0].toUpperCase(), seed = args[1];
    if (!['MT32','MT2002'].includes(method))
      throw new Error('Unsupported RNG '+method+'. Supported: MT32 / MT2002.');
    if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff)
      throw new Error('STREAMINIT requires an integer seed from 1 to 4294967295');
    generator = createMT32(seed);
    logs.push('NOTE: RAND uses MT32 (2002 initialization). Uniform conversion matches the SAS seed-12345 fixture; normal sequences and other seeds are unverified.');
  }
  function uniform() {
    tick();
    // Preserve this exact double constant: all 40,000 seed-12345 SAS
    // uniform HEX16 values match. Replacing it with 1 / 2**32 changes bits.
    return generator.uint32() * 2.328306436538696e-10;
  }
  function sample(args) {
    if (!generator) throw new Error("Initialize RAND with CALL STREAMINIT('MT32', positive_seed) before use.");
    if (!args.length || args.length > 3 || typeof args[0] !== 'string')
      throw new Error('RAND expects a distribution name and up to two numeric parameters');
    const distribution = args[0].toLowerCase();
    const parameters = args.slice(1);
    if (parameters.some(v => typeof v !== 'number' || !Number.isFinite(v)))
      throw new Error('RAND parameters must be finite numbers');
    if (distribution.length >= 4 && distribution.startsWith('unif')) {
      const a = parameters[0] ?? 1, b = parameters[1] ?? 0;
      const lo = Math.min(a,b), hi = Math.max(a,b);
      if (!Number.isFinite(hi-lo)) throw new Error('RAND uniform interval is too large');
      const u = uniform();
      return lo + (hi-lo)*u;
    }
    if (distribution.length >= 4 && distribution.startsWith('norm')) {
      const mean = parameters[0] ?? 0, sigma = parameters[1] ?? 1;
      if (sigma < 0 || Math.abs(mean) > 1e14 * (sigma || 1))
        throw new Error('RAND normal requires nonnegative sigma and a bounded mean');
      // Marsaglia polar sampler, no cached second variate. Its stream consumption
      // and floating-point results are not a reproduction of SAS's normal sampler.
      for (let tries = 0; tries < 10000; tries++) {
        const x = 2*uniform()-1, y = 2*uniform()-1, s = x*x+y*y;
        if (s > 0 && s < 1) {
          const result = mean + sigma*x*Math.sqrt(-2*Math.log(s)/s);
          if (!Number.isFinite(result)) throw new Error('RAND normal result is outside the finite range');
          return result;
        }
      }
      throw new Error('RAND normal sampling limit reached');
    }
    throw new Error('Unsupported RAND distribution '+args[0]+'. Supported: UNIFORM, NORMAL.');
  }
  return {initialize, sample};
}
