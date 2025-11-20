/**
 * Search for a text fragment within the normalized Big Book pages.
 * Usage: node scripts/bigbook/search-term.js "We Agnostics"
 */

import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import { extractBigBookPages } from '../../src/lib/bigbook/pdfParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const term = process.argv.slice(2).join(' ');

if (!term) {
  console.error('Usage: node scripts/bigbook/search-term.js "search phrase"');
  process.exit(1);
}

async function run() {
  const spinner = ora(`Searching for "${term}"...`).start();
  try {
    const pdfPath = path.resolve(__dirname, '../../public/pdf/AA-Big-Book-4th-edition.pdf');
    const { pages } = await extractBigBookPages({
      pdfPath,
      onProgress: ({ pdfPage, totalPdfPages }) => {
        spinner.text = `Parsing Big Book PDF (${pdfPage}/${totalPdfPages})...`;
      },
    });

    spinner.stop();

    const collapsedTerm = term.replace(/[^A-Za-z]/g, '').toLowerCase();

    const matches = pages
      .filter((page) => page.text.replace(/[^A-Za-z]/g, '').toLowerCase().includes(collapsedTerm))
      .map(({ pageNumber }) => pageNumber);

    if (!matches.length) {
      console.log(`No matches found for "${term}".`);
      return;
    }

    console.log(`"${term}" found on pages: ${matches.join(', ')}`);
  } catch (error) {
    spinner.fail('Search failed');
    console.error(error);
    process.exit(1);
  }
}

run();


