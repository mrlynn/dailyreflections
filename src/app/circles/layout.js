import { createMetadata } from '@/utils/seoUtils';
import PageHeader from '@/components/PageHeader';
import GroupsIcon from '@mui/icons-material/Groups';

export const metadata = createMetadata({
  title: 'Recovery Circles',
  description: 'Join trusted micro-communities to share experience, strength, and hope. Circles make it easy to turn individual step work into shared recovery.',
  path: '/circles',
});

export default function CirclesLayout({ children }) {
  return (
    <>
      <PageHeader
        title="Circles"
        icon={<GroupsIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Join trusted micro-communities to share experience, strength, and hope. Circles make it easy to turn individual step work into shared recovery."
        fullWidth
      />
      {children}
    </>
  );
}