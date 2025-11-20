'use client';

// This is a placeholder page to handle pretty permalinks for TSML-UI
// TSML-UI will handle the routing and displaying of specific meeting details

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MeetingsPage from '../page';

/**
 * Meeting Detail Page (TSML-UI pretty permalinks)
 *
 * This component simply reuses the main MeetingsPage component,
 * as TSML-UI will handle showing the specific meeting based on the URL.
 *
 * When the page loads, TSML-UI will detect the meeting slug from the URL
 * and display the corresponding meeting details.
 */
export default function MeetingDetailPage() {
  return <MeetingsPage />;
}