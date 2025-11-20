/**
 * Print the full normalized text for a specific printed page number.
 * Usage: node scripts/bigbook/debug-page-text.js <pageNumber>
 */

import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import { extractBigBookPages } from '../../src/lib/bigbook/pdfParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPage = Number.parseInt(process.argv[2] || '1', 10);

async function run() {
  if (Number.isNaN(targetPage) || targetPage <= 0) {
    console.error('Please provide a positive page number.');
    process.exit(1);
  }

  const spinner = ora(`Loading page ${targetPage}...`).start();

  try {
    const pdfPath = path.resolve(__dirname, '../../public/pdf/AA-Big-Book-4th-edition.pdf');
    const { pages } = await extractBigBookPages({
      pdfPath,
      onProgress: ({ pdfPage, totalPdfPages }) => {
        spinner.text = `Parsing Big Book PDF (${pdfPage}/${totalPdfPages})...`;
      },
    });

    spinner.stop();

    const page = pages.find(({ pageNumber }) => pageNumber === targetPage);
    if (!page) {
      console.error(`Page ${targetPage} not found.`);
      process.exit(1);
    }

    console.log(`\n=== Page ${page.pageNumber} (pdf index ${page.pdfPageIndex}) ===\n`);
    console.log(page.text);
    console.log('\n=== End ===');
  } catch (error) {
    spinner.fail(`Failed to load page ${targetPage}`);
    console.error(error);
    process.exit(1);
  }
}

run();


