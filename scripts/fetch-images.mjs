#!/usr/bin/env node
/**
 * Downloads the Foodiesfeed photos listed in scripts/image-map.json, converts them
 * to 4:3 WebP thumbnails (480 and 960 px wide) in public/images/recipes/, and writes
 * licensing/source metadata to src/data/images.json.
 *
 * Access rules: Foodiesfeed's robots.txt allows /free-food-photo/ pages and its
 * sitemap lists each photo with its asset URL. We fetch one page per photo (to read
 * the asset URL, author and AI flag), wait 1 s between requests, and cache results in
 * .image-cache/ so re-runs make no network requests. Sponsored third-party images that
 * appear on Foodiesfeed pages (affiliate stock ads) are never used: only the photo's
 * own asset on the Foodiesfeed storage host is downloaded.
 *
 * Usage: node scripts/fetch-images.mjs [--sheet <out.jpg>]
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.image-cache');
const outDir = join(root, 'public', 'images', 'recipes');
const UA = 'FODMAP-Kitchen-image-sync/1.0 (personal recipe app; one request per photo)';
const ASSET_HOST = 'https://pub-aaa82e9851064d22b954c3ebbafc9ae6.r2.dev/';
const LICENSE = { name: 'Foodiesfeed License (CC0-equivalent, no attribution required)', url: 'https://www.foodiesfeed.com/license' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true, () => false);

function unescape(s) {
  return s.replace(/\\u0026/g, '&').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

let sitemap = null;
/** Asset URL as published in Foodiesfeed's photo sitemap (image:image). */
async function sitemapAsset(slug) {
  if (sitemap === null) {
    const p = join(cacheDir, 'photos-sitemap.xml');
    if (!(await exists(p))) {
      const r = await fetch('https://www.foodiesfeed.com/sitemaps/photos-0.xml', { headers: { 'User-Agent': UA } });
      await writeFile(p, await r.text());
      await sleep(1000);
    }
    sitemap = await readFile(p, 'utf8');
  }
  const re = new RegExp(`free-food-photo/${slug}</loc>[\\s\\S]*?<image:loc>([^<]+)</image:loc>`);
  return sitemap.match(re)?.[1] ?? null;
}

async function getPhoto(slug) {
  const metaPath = join(cacheDir, `${slug}.json`);
  const imgPath = join(cacheDir, `${slug}.webp`);
  if ((await exists(metaPath)) && (await exists(imgPath))) {
    return { meta: JSON.parse(await readFile(metaPath, 'utf8')), imgPath, fetched: false };
  }
  const pageUrl = `https://www.foodiesfeed.com/free-food-photo/${slug}`;
  const res = await fetch(pageUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${slug}: page HTTP ${res.status}`);
  const html = unescape(await res.text());
  const webp = html.match(/https:\/\/pub-[a-z0-9]+\.r2\.dev\/[a-z]+\/webp\/[^"\s\\]+\.webp/);
  const master = html.match(/https:\/\/pub-[a-z0-9]+\.r2\.dev\/[a-z]+\/masters\/[^"\s\\]+\.(?:jpe?g|png)/);
  const assetUrl = (webp ?? master)?.[0] ?? (await sitemapAsset(slug));
  if (!assetUrl || !assetUrl.startsWith(ASSET_HOST)) throw new Error(`${slug}: no Foodiesfeed asset URL found`);
  const user = html.match(/"user":\{"id":"[^"]+","name":"([^"]+)"/)?.[1] ?? null;
  const ffAlt = html.match(/"alt_text":"([^"]+)"/)?.[1] ?? null;
  const title = html.match(/"sourceTitle":"([^"]+)"/)?.[1] ?? null;
  const aiGenerated = /AI-Generated Food Photography/i.test(user ?? '') || /This AI-generated food photo/i.test(html);
  await sleep(1000);
  const img = await fetch(assetUrl, { headers: { 'User-Agent': UA } });
  if (!img.ok) throw new Error(`${slug}: asset HTTP ${img.status}`);
  await writeFile(imgPath, Buffer.from(await img.arrayBuffer()));
  const meta = { slug, pageUrl, assetUrl, title, author: user, aiGenerated, foodiesfeedAlt: ffAlt, retrieved: new Date().toISOString().slice(0, 10) };
  await writeFile(metaPath, JSON.stringify(meta, null, 2));
  await sleep(1000);
  return { meta, imgPath, fetched: true };
}

async function main() {
  const sheetIdx = process.argv.indexOf('--sheet');
  const sheetOut = sheetIdx > -1 ? process.argv[sheetIdx + 1] : null;
  await mkdir(cacheDir, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const map = JSON.parse(await readFile(join(root, 'scripts', 'image-map.json'), 'utf8'));
  const manifest = {};
  const tiles = [];
  for (const [recipeId, entry] of Object.entries(map)) {
    if (entry.file) {
      // Photo supplied by the app owner (stored in assets/owner-photos/).
      const src = join(root, entry.file);
      for (const w of [480, 960]) {
        await sharp(src)
          .resize(w, Math.round((w * 3) / 4), { fit: 'cover', position: sharp.strategy.attention })
          .webp({ quality: w === 480 ? 70 : 74, effort: 5 })
          .toFile(join(outDir, `${recipeId}-${w}.webp`));
      }
      manifest[recipeId] = {
        match: entry.match,
        alt: entry.alt,
        src480: `/images/recipes/${recipeId}-480.webp`,
        src960: `/images/recipes/${recipeId}-960.webp`,
        source: 'Owner-supplied',
        license: 'Provided by the app owner for use in this app',
      };
      tiles.push({ recipeId, file: join(outDir, `${recipeId}-480.webp`), label: `${recipeId} [owner]` });
      console.log(`owner   ${recipeId} <- ${entry.file}`);
      continue;
    }
    if (!entry.slug) {
      manifest[recipeId] = { match: 'placeholder', reason: entry.reason ?? 'No accurately matching licensed Foodiesfeed photograph was found.' };
      continue;
    }
    const { meta, imgPath, fetched } = await getPhoto(entry.slug);
    for (const w of [480, 960]) {
      await sharp(imgPath)
        .resize(w, Math.round((w * 3) / 4), { fit: 'cover', position: sharp.strategy.attention })
        .webp({ quality: w === 480 ? 70 : 74, effort: 5 })
        .toFile(join(outDir, `${recipeId}-${w}.webp`));
    }
    manifest[recipeId] = {
      match: entry.match,
      alt: entry.alt,
      src480: `/images/recipes/${recipeId}-480.webp`,
      src960: `/images/recipes/${recipeId}-960.webp`,
      source: 'Foodiesfeed',
      photoPage: meta.pageUrl,
      assetUrl: meta.assetUrl,
      title: meta.title,
      author: meta.author,
      aiGenerated: meta.aiGenerated,
      license: LICENSE.name,
      licenseUrl: LICENSE.url,
      retrieved: meta.retrieved,
    };
    tiles.push({ recipeId, file: join(outDir, `${recipeId}-480.webp`), label: `${recipeId} [${entry.match}]` });
    console.log(`${fetched ? 'fetched' : 'cached '} ${recipeId} <- ${entry.slug}`);
  }
  await writeFile(join(root, 'src', 'data', 'images.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`wrote ${Object.keys(manifest).length} entries`);

  if (sheetOut) {
    const cols = 6, tw = 320, th = 240, lh = 22;
    const rowsN = Math.ceil(tiles.length / cols);
    const composites = [];
    for (const [i, t] of tiles.entries()) {
      const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + lh);
      composites.push({ input: await sharp(t.file).resize(tw, th).toBuffer(), left: x, top: y });
      const svg = `<svg width="${tw}" height="${lh}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000"/><text x="4" y="16" font-size="12" font-family="Arial" fill="#fff">${t.label.replace(/&/g, '&amp;')}</text></svg>`;
      composites.push({ input: Buffer.from(svg), left: x, top: y + th });
    }
    await sharp({ create: { width: cols * tw, height: rowsN * (th + lh), channels: 3, background: '#222' } })
      .composite(composites)
      .jpeg({ quality: 70 })
      .toFile(sheetOut);
    console.log(`contact sheet -> ${sheetOut}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
