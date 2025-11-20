import { redirect } from 'next/navigation';
import BigBookLanding from '@/components/BigBook/BigBookLanding';
import BigBookLandingSchema from '@/components/SchemaScripts/BigBookLandingSchema';
import { createMetadata } from '@/utils/seoUtils';

export function generateMetadata() {
  return createMetadata({
    title: 'Big Book Reader | AA Literature',
    description: 'Explore the Alcoholics Anonymous Big Book (4th Edition) with chapter navigation, search, bookmarks, and personal notes. Read the complete text that has helped millions recover from alcoholism.',
    path: '/big-book',
    keywords: [
      'Alcoholics Anonymous',
      'AA Big Book',
      'AA literature',
      'recovery',
      'sobriety',
      'twelve steps',
      'Bill Wilson',
      'Dr. Bob Smith',
    ],
    ogType: 'website',
    additionalMetadata: {
      openGraph: {
        siteName: 'Daily Reflections - AA Literature',
      },
    }
  });
}

export default function BigBookHome({ searchParams }) {
  const pageQuery = searchParams?.p;
  const parsedPage = pageQuery ? Number.parseInt(pageQuery, 10) : null;

  if (parsedPage && !Number.isNaN(parsedPage) && parsedPage > 0) {
    redirect(`/big-book/page/${parsedPage}`);
  }

  return (
    <>
      <BigBookLandingSchema />
      <BigBookLanding />
    </>
  );
}


