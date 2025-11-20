/**
 * Helper script to detect chapter start pages from the parsed Big Book content.
 * Usage: node scripts/bigbook/detect-chapters.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import { extractBigBookPages } from '../../src/lib/bigbook/pdfParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHAPTER_MARKERS = [
  {
    slug: 'the-doctors-opinion',
    title: "The Doctor's Opinion",
    key: 'thedoctorsopinionweofalcoholicsanonymous',
  },
  {
    slug: 'bill-story',
    title: "Bill's Story",
    key: 'billsstorywarfeverranhigh',
  },
  {
    slug: 'there-is-a-solution',
    title: 'There Is A Solution',
    key: 'thereisasolutionweofalcoholicsanonymous',
  },
  {
    slug: 'more-about-alcoholism',
    title: 'More About Alcoholism',
    key: 'moreaboutalcoholismmostofushavebeenunwilling',
  },
  {
    slug: 'we-agnostics',
    title: 'We Agnostics',
    key: 'weagnosticsinthepreviouschapter',
  },
  {
    slug: 'how-it-works',
    title: 'How It Works',
    key: 'howitworksrarelyhaveseen',
  },
  {
    slug: 'into-action',
    title: 'Into Action',
    key: 'intoactionhavingmadeourpersonal',
  },
  {
    slug: 'working-with-others',
    title: 'Working With Others',
    key: 'workingwithotherspracticalexperienceshows',
  },
  {
    slug: 'to-wives',
    title: 'To Wives',
    key: 'towiveswithfewexceptions',
  },
  {
    slug: 'the-family-afterward',
    title: 'The Family Afterward',
    key: 'thefamilyafterwardourwomenfolk',
  },
  {
    slug: 'to-employers',
    title: 'To Employers',
    key: 'toemployersamongmanyemployees',
  },
  {
    slug: 'a-vision-for-you',
    title: 'A Vision For You',
    key: 'avisionforyouformostnormalfolk',
  },
  {
    slug: 'dr-bob-nightmare',
    title: "Dr. Bob's Nightmare",
    key: 'drbobsnightmareitwasinthespringof',
  },
  {
    slug: 'appendix',
    title: 'Appendices',
    key: 'appendixtheaaanonymous',
  },
];

function detectChapterBounds(pages) {
  const matches = [];
  const seenSlugs = new Set();

  CHAPTER_MARKERS.forEach((marker) => {
    const page = pages.find((candidate) => {
      const collapsed = candidate.text.replace(/[^A-Za-z]/g, '').toLowerCase();
      return collapsed.includes(marker.key);
    });
    if (page) {
      matches.push({
        slug: marker.slug,
        title: marker.title,
        startPage: page.pageNumber,
      });
      seenSlugs.add(marker.slug);
    }
  });

  matches.sort((a, b) => a.startPage - b.startPage);

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    current.endPage = next ? next.startPage - 1 : pages[pages.length - 1].pageNumber;
  }

  return { matches, missing: CHAPTER_MARKERS.filter((marker) => !seenSlugs.has(marker.slug)) };
}

async function run() {
  const spinner = ora('Extracting pages...').start();
  const pdfPath = path.resolve(__dirname, '../../public/pdf/AA-Big-Book-4th-edition.pdf');

  try {
    const { pages } = await extractBigBookPages({
      pdfPath,
      onProgress: ({ pdfPage, totalPdfPages }) => {
        spinner.text = `Parsing Big Book PDF (${pdfPage}/${totalPdfPages})...`;
      },
    });

    spinner.succeed(`Parsed ${pages.length} printed pages`);

    const { matches, missing } = detectChapterBounds(pages);

    console.log('\nDetected chapter boundaries (edition numbering):\n');
    matches.forEach((match, index) => {
      console.log(
        `${index + 1}. ${match.title} [${match.slug}] — start: ${match.startPage}, end: ${match.endPage}`,
      );
    });

    if (missing.length) {
      console.warn('\nMarkers without matches:');
      missing.forEach((marker) => console.warn(`  • ${marker.title} (${marker.slug})`));
    }
  } catch (error) {
    spinner.fail('Failed to detect chapters.');
    console.error(error);
    process.exit(1);
  }
}

run();


