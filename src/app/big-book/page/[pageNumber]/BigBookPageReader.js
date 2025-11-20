'use client';

import { useParams } from 'next/navigation';
import BigBookReader from '@/components/BigBook/BigBookReader';
import BigBookSchema from '@/components/SchemaScripts/BigBookSchema';
import BigBookCommentList from '@/components/BigBook/BigBookCommentList';
import { useEffect, useState } from 'react';
import { getChapterForPageNumber } from '@/lib/bigbook/clientUtils';

export default function BigBookPageReader() {
  const params = useParams();
  const pageNumber = Number.parseInt(params?.pageNumber || '1', 10);
  const [pageData, setPageData] = useState(null);
  const [chapterInfo, setChapterInfo] = useState(null);

  // Fetch minimal page data for structured data
  useEffect(() => {
    async function fetchPageData() {
      try {
        // Get chapter info first (client-safe)
        const chapter = getChapterForPageNumber(pageNumber);
        setChapterInfo(chapter);

        // Then fetch page data
        const response = await fetch(`/api/bigbook/page/${pageNumber}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPageData(data.page);
        }
      } catch (error) {
        console.error('Failed to load page data for schema:', error);
      }
    }

    fetchPageData();
  }, [pageNumber]);

  return (
    <>
      {pageData && chapterInfo && (
        <BigBookSchema
          pageNumber={pageNumber}
          chapterTitle={chapterInfo?.title}
          chapterSlug={chapterInfo?.slug}
          pageText={pageData.text || pageData.fullText}
          url={typeof window !== 'undefined' ? window.location.href : `https://aacompanion.com/big-book/page/${pageNumber}`}
          imageUrl={pageData.imageUrl}
        />
      )}
      <BigBookReader />
      <BigBookCommentList pageNumber={pageNumber} />
    </>
  );
}