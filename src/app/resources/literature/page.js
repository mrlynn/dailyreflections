import { redirect } from 'next/navigation';

export default function LiteratureRedirectPage() {
  redirect('/resources?type=literature');
}