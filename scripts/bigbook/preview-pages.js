/**
 * Utility script to preview parsed Big Book pages from the consolidated PDF.
 * Usage: node scripts/bigbook/preview-pages.js [count=5]
 */

import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import { extractBigBookPages } from '../../src/lib/bigbook/pdfParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const countArg = process.argv.slice(2).find((arg) => /^\d+$/.test(arg));
const previewCount = Number.parseInt(countArg || '5', 10);

async function preview() {
  const spinner = ora('Parsing Big Book PDF...').start();
  try {
    const pdfPath = path.resolve(__dirname, '../../public/pdf/AA-Big-Book-4th-edition.pdf');
    const result = await extractBigBookPages({
      pdfPath,
      onProgress: ({ pdfPage, totalPdfPages }) => {
        spinner.text = `Parsing Big Book PDF (${pdfPage}/${totalPdfPages})...`;
      },
    });

    spinner.succeed(`Parsed ${result.pages.length} printed pages across ${result.totalPdfPages} PDF pages`);

    if (result.warnings.length) {
      console.warn('Warnings:');
      result.warnings.forEach((warning) => console.warn(`  • ${warning}`));
    }

    console.log(`\nPreviewing first ${previewCount} pages:`);
    result.pages.slice(0, previewCount).forEach((page) => {
      console.log(`\nPage ${page.pageNumber} (pdf index ${page.pdfPageIndex})`);
      console.log(page.text.slice(0, 180).replace(/\n/g, ' '));
    });
  } catch (error) {
    spinner.fail('Failed to parse Big Book PDF');
    console.error(error);
    process.exit(1);
  }
}

preview();


