import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.url);
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.mjs');

const standardFontDir = path.join(
  path.dirname(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')),
  '../standard_fonts',
);
pdfjsLib.GlobalWorkerOptions.standardFontDataUrl = `${standardFontDir}/`;

const PAGE_NUMBER_REGEX = /^\d{1,3}$/;
const MAX_PAGE_NUMBER = 800;
const MAX_GAP = 3;

const isMostlyUppercase = (value = '') => {
  if (!value) return false;
  const letters = value.replace(/[^A-Za-z]/g, '');
  if (!letters) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper > 0 && upper / letters.length > 0.6;
};

const hasMeaningfulUppercase = (tokens = []) =>
  tokens.some((token) => {
    if (!token || !isMostlyUppercase(token)) return false;
    const letters = token.replace(/[^A-Za-z]/g, '');
    return letters.length >= 3;
  });

const shouldTreatAsPageNumber = (value, context) => {
  const { previousTokens, nextTokens, yCoordinate } = context;
  const neighbors = [...previousTokens, ...nextTokens];
  const hasOrdinalNeighbor = neighbors.some((token) => /^(st|nd|rd|th)$/i.test(token));

  if (yCoordinate !== undefined && yCoordinate < 40) {
    return false;
  }

  const headerMatches =
    hasMeaningfulUppercase(neighbors) ||
    nextTokens.some((token) => token && /Chapter/i.test(token)) ||
    previousTokens.some((token) => token && /Chapter/i.test(token)) ||
    neighbors.some((token) => token && /Alcoholics|Anonymous|Stories/i.test(token));

  if (headerMatches) {
    return true;
  }

  if (value <= 15 && !hasOrdinalNeighbor) {
    return true;
  }

  return false;
};

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim();

const buildPageContent = (segments) => {
  if (!segments.length) {
    return {
      text: '',
      html: '',
      paragraphs: [],
      paragraphOffsets: [],
    };
  }

  const lines = [];
  let currentLine = [];
  let lastY = null;

  const pushLine = () => {
    if (currentLine.length) {
      const lineText = currentLine.join(' ').replace(/\s+/g, ' ').trim();
      lines.push(lineText);
      currentLine = [];
    }
  };

  segments.forEach((segment) => {
    const { text, hasEOL, transform } = segment;
    const normalized = normalizeWhitespace(text);
    if (!normalized) {
      if (hasEOL) {
        pushLine();
      }
      return;
    }

    const [, , , , , y] = transform;
    if (lastY !== null && Math.abs(y - lastY) > 6) {
      pushLine();
    }

    currentLine.push(normalized);
    lastY = y;

    if (hasEOL) {
      pushLine();
      lastY = null;
    }
  });

  pushLine();

  const paragraphs = [];
  const paragraphOffsets = [];
  let currentParagraph = [];
  let offset = 0;

  const pushParagraph = () => {
    if (!currentParagraph.length) return;
    const paragraphText = currentParagraph.join(' ').replace(/\s+/g, ' ').trim();
    if (paragraphText) {
      paragraphs.push(paragraphText);
      paragraphOffsets.push(offset);
      offset += paragraphText.length + 2;
    }
    currentParagraph = [];
  };

  lines.forEach((line) => {
    if (!line) {
      pushParagraph();
      return;
    }
    currentParagraph.push(line);
  });

  pushParagraph();

  const text = paragraphs.join('\n\n');
  const html = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');

  return {
    text,
    html,
    paragraphs,
    paragraphOffsets,
  };
};

export async function extractBigBookPages({ pdfPath, maxPages, onProgress } = {}) {
  if (!pdfPath) {
    throw new Error('pdfPath is required to extract Big Book pages');
  }

  const data = await fs.readFile(pdfPath);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const doc = await loadingTask.promise;

  const totalPdfPages = doc.numPages;
  const pages = [];
  const warnings = [];

  let currentPage = null;
  let expectedNextPage = 1;

  const finalizeCurrentPage = () => {
    if (!currentPage) return;
    const content = buildPageContent(currentPage.segments);
    pages.push({
      pageNumber: currentPage.pageNumber,
      pdfPageIndex: currentPage.pdfPageIndex,
      text: content.text,
      html: content.html,
      paragraphs: content.paragraphs,
      paragraphOffsets: content.paragraphOffsets,
    });
    currentPage = null;
  };

  const startNewPage = (pageNumber, pdfPageIndex) => {
    finalizeCurrentPage();
    currentPage = {
      pageNumber,
      pdfPageIndex,
      segments: [],
    };
    expectedNextPage = pageNumber + 1;
  };

  for (let pdfIndex = 0; pdfIndex < totalPdfPages; pdfIndex += 1) {
    if (maxPages && pdfIndex + 1 > maxPages) {
      break;
    }

    if (onProgress) {
      onProgress({ pdfPage: pdfIndex + 1, totalPdfPages });
    }

    const page = await doc.getPage(pdfIndex + 1);
    const textContent = await page.getTextContent();

    const items = textContent.items || [];

    for (let idx = 0; idx < items.length; idx += 1) {
      const item = items[idx];
      const rawText = item.str;
      if (!rawText) continue;

      const normalized = normalizeWhitespace(rawText);
      if (!normalized) continue;

      if (PAGE_NUMBER_REGEX.test(normalized)) {
        const value = Number.parseInt(normalized, 10);
        if (Number.isNaN(value) || value <= 0 || value > MAX_PAGE_NUMBER) {
          continue;
        }

        const prevTokens = [];
        for (let lookback = 1; lookback <= 3; lookback += 1) {
          const prev = items[idx - lookback];
          if (!prev) break;
          prevTokens.push(normalizeWhitespace(prev.str || ''));
        }

        const nextTokens = [];
        for (let lookahead = 1; lookahead <= 3; lookahead += 1) {
          const next = items[idx + lookahead];
          if (!next) break;
          nextTokens.push(normalizeWhitespace(next.str || ''));
        }

        const [, , , , , yCoordinate] = item.transform || [];

        let treatCandidate = shouldTreatAsPageNumber(value, {
          previousTokens: prevTokens,
          nextTokens,
          yCoordinate,
        });

        if (
          !treatCandidate &&
          currentPage &&
          value === currentPage.pageNumber + 1 &&
          (hasMeaningfulUppercase(nextTokens.slice(0, 3)) ||
            hasMeaningfulUppercase(prevTokens.slice(0, 3)))
        ) {
          treatCandidate = true;
        }

        if (!treatCandidate && !currentPage && value === expectedNextPage) {
          treatCandidate = true;
        }

        if (!treatCandidate && yCoordinate !== undefined && yCoordinate < 40) {
          continue;
        }

        if (treatCandidate) {
          if (!currentPage) {
            startNewPage(value, pdfIndex);
            continue;
          }

          if (value === currentPage.pageNumber) {
            continue;
          }

          const gap = value - currentPage.pageNumber;

          if (gap >= 1 && gap <= MAX_GAP) {
            startNewPage(value, pdfIndex);
            continue;
          }

          if (value >= expectedNextPage - 1 && value <= expectedNextPage + MAX_GAP) {
            warnings.push(
              `Non-sequential page jump detected: from ${currentPage.pageNumber} to ${value} (pdf page ${pdfIndex + 1})`,
            );
            startNewPage(value, pdfIndex);
            continue;
          }
        }
      }

      if (!currentPage) {
        continue;
      }

      currentPage.segments.push({
        text: rawText,
        hasEOL: item.hasEOL,
        transform: item.transform,
      });
    }
  }

  finalizeCurrentPage();

  return {
    pages,
    warnings,
    totalPdfPages,
  };
}


