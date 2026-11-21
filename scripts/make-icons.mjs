#!/usr/bin/env node
// Generates PNG app icons from an inline SVG (bowl with leaf), plus favicon.svg.
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'icons');

const mark = (scale = 1) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <path d="M96 252h320c0 92-72 160-160 160S96 344 96 252z" fill="#fffdf6"/>
    <rect x="80" y="236" width="352" height="28" rx="14" fill="#fffdf6"/>
    <path d="M262 226c-6-58 30-104 96-116 6 66-30 110-96 116z" fill="#bfe3c8"/>
    <path d="M262 226c18-34 44-58 78-76" stroke="#3f7d58" stroke-width="10" stroke-linecap="round" fill="none"/>
    <circle cx="200" cy="208" r="26" fill="#f2a46c"/>
    <path d="M178 330c40 24 116 24 156 0" stroke="#e08a4f" stroke-width="14" stroke-linecap="round" fill="none"/>
  </g>`;

const svg = (rounded, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ''} fill="#3f7d58"/>${mark(scale)}</svg>`;

await mkdir(out, { recursive: true });
const any = Buffer.from(svg(true, 1));
const full = Buffer.from(svg(false, 1));
const maskable = Buffer.from(svg(false, 0.78));
await sharp(any).resize(192, 192).png().toFile(join(out, 'icon-192.png'));
await sharp(any).resize(512, 512).png().toFile(join(out, 'icon-512.png'));
await sharp(maskable).resize(512, 512).png().toFile(join(out, 'maskable-512.png'));
await sharp(full).resize(180, 180).png().toFile(join(out, 'apple-touch-icon.png'));
await writeFile(join(root, 'public', 'favicon.svg'), svg(true, 1));
console.log('icons written');
