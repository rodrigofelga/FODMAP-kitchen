import { messages } from '../i18n/content';
import { listAsText } from './grocery';
import type { ListDoc } from './listModel';
import { buildListPdf, pdfFileName } from './pdf';

export type ShareResult = 'shared' | 'cancelled' | 'failed';

async function pdfFile(doc: ListDoc): Promise<File> {
  const bytes = await buildListPdf(doc);
  return new File([bytes as BlobPart], pdfFileName(doc), { type: 'application/pdf' });
}

export function canShareNatively(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Opens the system share sheet (WhatsApp, Messages, e-mail…): the PDF where the
 * platform can share files, otherwise the formatted text.
 */
export async function shareList(doc: ListDoc): Promise<ShareResult> {
  if (!canShareNatively()) return 'failed';
  const text = listAsText(doc);
  const title = `${messages().shopping.listTitle} — ${doc.title}`;
  try {
    let data: ShareData = { title, text };
    try {
      const file = await pdfFile(doc);
      if (navigator.canShare?.({ files: [file] })) data = { title, text, files: [file] };
    } catch {
      // PDF could not be built: share the text.
    }
    await navigator.share(data);
    return 'shared';
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

export async function downloadPdf(doc: ListDoc): Promise<void> {
  const file = await pdfFile(doc);
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Copies text, falling back to a hidden text area where the Clipboard API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const mailtoUrl = (subject: string, text: string) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
