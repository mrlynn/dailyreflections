import { redirect } from 'next/navigation';

export default function LegacyJournalCreatePage() {
  redirect('/journal/new');
}

