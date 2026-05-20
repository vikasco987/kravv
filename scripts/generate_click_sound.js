/**
 * Generates a short, crisp click sound WAV file for the Kravv app.
 * Run with: node scripts/generate_click_sound.js
 */
const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const durationMs = 45; // 45ms — crisp click
const numSamples = Math.floor(sampleRate * (durationMs / 1000));

// ---------- WAV Header ----------
const dataSize = numSamples * 2; // 16-bit mono = 2 bytes/sample
const header = Buffer.alloc(44);

header.write('RIFF', 0);
header.writeUInt32LE(36 + dataSize, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);       // fmt chunk size
header.writeUInt16LE(1, 20);        // PCM
header.writeUInt16LE(1, 22);        // Mono
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28); // byte rate
header.writeUInt16LE(2, 32);        // block align
header.writeUInt16LE(16, 34);       // bits per sample
header.write('data', 36);
header.writeUInt32LE(dataSize, 40);

// ---------- PCM Data ----------
// A sine wave at 900Hz with very fast exponential decay → short crisp "tick"
const samples = Buffer.alloc(dataSize);
const freq = 900;
const amplitude = 0.75;
const decayRate = 80; // Higher = faster decay

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const decay = Math.exp(-t * decayRate);
  const wave = Math.sin(2 * Math.PI * freq * t);
  const value = Math.round(32767 * amplitude * wave * decay);
  // Clamp to int16 range
  const clamped = Math.max(-32768, Math.min(32767, value));
  samples.writeInt16LE(clamped, i * 2);
}

// ---------- Write file ----------
const outputDir = path.join(__dirname, '..', 'assets', 'sounds');
const outputPath = path.join(outputDir, 'click.wav');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, Buffer.concat([header, samples]));

console.log('✅ Click sound generated successfully!');
console.log('📁 Saved to:', outputPath);
console.log(`📊 Duration: ${durationMs}ms | Samples: ${numSamples} | Size: ${(44 + dataSize)} bytes`);
