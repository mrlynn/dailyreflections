/**
 * Quick inspection script for the consolidated Big Book PDF.
 * Prints sample text from the first N pages to help calibrate page offsets.
 *
 * Usage: node scripts/bigbook/inspect.js [numPages=10]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.url);
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.mjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const debugPage = args.find((arg) => arg.startsWith('--page='))?.split('=')[1];
const NUM_PAGES = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 10);
const pdfPath = path.resolve(__dirname, '../../public/pdf/AA-Big-Book-4th-edition.pdf');

async function inspectPdf() {
  const data = await fs.readFile(pdfPath);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const doc = await loadingTask.promise;

  console.log(`PDF path: ${pdfPath}`);
  console.log(`Total pages: ${doc.numPages}`);
  console.log('--- Sample output ---');

  if (debugPage) {
    const pageNumber = Number(debugPage);
    if (Number.isNaN(pageNumber) || pageNumber < 1 || pageNumber > doc.numPages) {
      console.error(`Invalid debug page: ${debugPage}`);
      process.exit(1);
    }

    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    console.log(`Debug page ${pageNumber}`);
    textContent.items.forEach((item, idx) => {
      const text = item.str.trim();
      if (text) {
        const [, , , , , y] = item.transform;
        const font = item.fontName;
        console.log(`${idx.toString().padStart(3, '0')}: "${text}" (y=${y?.toFixed?.(2) ?? y}, font=${font})`);
      }
    });
    return;
  }

  const maxPages = Math.min(NUM_PAGES, doc.numPages);

  for (let i = 1; i <= maxPages; i += 1) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const firstItems = textContent.items
      .map((item) => item.str.trim())
      .filter(Boolean)
      .slice(0, 8);

    console.log(`Page ${i} sample: ${firstItems.join(' | ')}`);
  }
}

inspectPdf().catch((error) => {
  console.error('Failed to inspect PDF:', error);
  process.exit(1);
});


