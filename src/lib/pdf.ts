import { getLang } from '../i18n/core';
import { messages } from '../i18n/content';
import { groupItems, itemName, itemQuantity, weekLabel } from './grocery';
import { liveItems, type ListDoc } from './listModel';

export type PaperSize = 'a4' | 'letter';

const SIZES: Record<PaperSize, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };

/** US and Canada use Letter; everyone else A4. */
export function defaultPaper(): PaperSize {
  const l = typeof navigator !== 'undefined' ? navigator.language : '';
  return /^(en|es|fr)-(US|CA)$/i.test(l) && getLang() === 'en' ? 'letter' : 'a4';
}

/** The standard PDF fonts cover Western European text (all Portuguese accents); a few symbols need plain-text fallbacks. */
const REPLACE: Record<string, string> = { '⅓': '1/3', '⅔': '2/3', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8', '☐': '', '☑': '', '←': '<-', '→': '->' };

export interface PdfLine {
  text: string;
  qty: string;
  checked: boolean;
}

export interface PdfBlock {
  title: string;
  lines: PdfLine[];
}

/** Plan name and week, without repeating the week when the plan still has its automatic name ("Week of …"). */
export function listSubtitle(doc: ListDoc): string {
  const t = messages().shopping;
  const week = weekLabel(doc);
  const auto = ['Week of', 'Semana de'].some((w) => doc.title.startsWith(w));
  return [auto && week ? '' : doc.title, week ? t.pdfWeek(week) : ''].filter(Boolean).join('  ·  ');
}

/** Content of the PDF in the current language (separate from drawing, so it can be tested without a PDF library). */
export function pdfContent(doc: ListDoc): { title: string; subtitle: string; blocks: PdfBlock[]; footer: string } {
  const t = messages().shopping;
  return {
    title: t.listTitle,
    subtitle: [listSubtitle(doc), t.people(doc.people)].filter(Boolean).join('  ·  '),
    blocks: groupItems(liveItems(doc)).map(([c, items]) => ({
      title: t.categories[c],
      lines: items.map((i) => ({ text: itemName(i), qty: itemQuantity(i), checked: i.checked })),
    })),
    footer: t.pdfFooter,
  };
}

/** Builds a printable A4/Letter PDF: categories in two columns, never split across a column unless longer than a whole page. */
export async function buildListPdf(doc: ListDoc, paper: PaperSize = defaultPaper()): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const content = pdfContent(doc);
  const t = messages().shopping;
  pdf.setTitle(`${content.title} — ${doc.title}`);
  pdf.setLanguage(getLang());
  pdf.setCreator('My FODMAP Kitchen');
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const charset = new Set(font.getCharacterSet());
  const clean = (s: string) =>
    [...s]
      .map((ch) => REPLACE[ch] ?? ch)
      .join('')
      .split('')
      .filter((ch) => charset.has(ch.codePointAt(0)!))
      .join('');

  const [W, H] = SIZES[paper];
  const M = 42;
  const GUTTER = 22;
  const colW = (W - 2 * M - GUTTER) / 2;
  const SIZE = 10;
  const LINE = 13;
  const HEAD = 20;
  const BOX = 8;
  const textW = colW - BOX - 8;
  const top = H - M;
  const bottom = M + 22;
  const ink = rgb(0.13, 0.15, 0.14);
  const muted = rgb(0.42, 0.45, 0.43);
  const accent = rgb(0.25, 0.49, 0.35);

  const wrap = (text: string, f = font, width = textW): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(next, SIZE) <= width || !cur) cur = next;
      else {
        out.push(cur);
        cur = w;
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [''];
  };

  type Row = { lines: string[]; qty: string; checked: boolean };
  const blocks = content.blocks.map((b) => ({
    title: clean(b.title),
    rows: b.lines.map((l): Row => ({ lines: wrap(clean(l.qty ? `${l.text} — ${l.qty}` : l.text)), qty: clean(l.qty), checked: l.checked })),
  }));
  const rowH = (r: Row) => r.lines.length * LINE + 3;
  const blockH = (rows: Row[]) => HEAD + rows.reduce((a, r) => a + rowH(r), 0) + 10;

  let page = pdf.addPage([W, H]);
  const pages = [page];
  const header = () => {
    page.drawText(clean(content.title), { x: M, y: top - 18, size: 20, font: bold, color: ink });
    let y = top - 36;
    for (const l of wrap(clean(content.subtitle), font, W - 2 * M)) {
      page.drawText(l, { x: M, y, size: SIZE, font, color: muted });
      y -= LINE;
    }
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 0.6, color: muted });
    return y - 10;
  };
  let colTop = header();
  let col = 0;
  let y = colTop;
  const newColumn = () => {
    if (col === 0) {
      col = 1;
    } else {
      page = pdf.addPage([W, H]);
      pages.push(page);
      col = 0;
      colTop = top;
    }
    y = colTop;
  };
  const drawRow = (r: Row) => {
    const x = M + col * (colW + GUTTER);
    page.drawRectangle({ x, y: y - BOX - 1, width: BOX, height: BOX, borderWidth: 0.8, borderColor: ink });
    if (r.checked) {
      page.drawLine({ start: { x: x + 1.5, y: y - 5 }, end: { x: x + 3.5, y: y - 7.5 }, thickness: 1, color: accent });
      page.drawLine({ start: { x: x + 3.5, y: y - 7.5 }, end: { x: x + 7, y: y - 1.5 }, thickness: 1, color: accent });
    }
    for (const l of r.lines) {
      page.drawText(l, { x: x + BOX + 8, y: y - BOX, size: SIZE, font, color: ink });
      y -= LINE;
    }
    y -= 3;
  };
  const drawHead = (title: string) => {
    const x = M + col * (colW + GUTTER);
    page.drawText(title, { x, y: y - 12, size: 11.5, font: bold, color: accent });
    y -= HEAD;
  };

  for (const b of blocks) {
    const h = blockH(b.rows);
    const colHeight = colTop - bottom;
    if (h > y - bottom && !(y === colTop && h > colHeight)) {
      // Move whole category to the next column/page so it is never cut.
      if (h <= top - bottom) newColumn();
    }
    drawHead(b.title);
    for (const r of b.rows) {
      if (y - rowH(r) < bottom) {
        // Only for a category longer than a full column: continue it with its heading repeated.
        newColumn();
        drawHead(`${b.title} (...)`);
      }
      drawRow(r);
    }
    y -= 10;
  }

  pages.forEach((p, i) => {
    const footer = clean(`${content.footer}   ${t.pdfPage(i + 1, pages.length)}`);
    p.drawText(footer, { x: M, y: M - 10, size: 8, font, color: muted });
  });
  return pdf.save();
}

export function pdfFileName(doc: ListDoc): string {
  const date = (doc.weekOf || new Date().toISOString()).slice(0, 10);
  return `${messages().shopping.pdfFile}-${date}.pdf`;
}
