// Feature discovery configuration
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ChatIcon from '@mui/icons-material/Chat';
import QrCodeIcon from '@mui/icons-material/QrCode';
import GroupsIcon from '@mui/icons-material/Groups';
import CelebrationIcon from '@mui/icons-material/Celebration';

const featureConfig = {
  title: 'Discover New Features',
  subtitle: 'Tools to support your recovery journey',
  features: [
    {
      title: 'Daily Reflections',
      description: 'Start your day with wisdom from AA literature. Read reflections on recovery principles and share your thoughts.',
      imageUrl: '/images/features/dailyreflection.png',
      icon: <CalendarMonthIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Read Today',
      actionUrl: '/today',
      accentColor: '#E4B95B',
    },
    {
      title: '4th Step Inventory',
      description: 'Work through your 4th step with guided inventory tools for resentments, fears, and relationships.',
      imageUrl: '/images/features/step4.png',
      icon: <PsychologyIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Start Inventory',
      actionUrl: '/step4',
      accentColor: '#5DA6A7',
    },
    {
      title: 'Recovery Connection',
      description: 'Share your recovery profile with others through custom QR codes and personalized links.',
      imageUrl: '/images/features/connection.png',
      icon: <QrCodeIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Manage Connection',
      actionUrl: '/profile/connection',
      accentColor: '#5D88A6',
      tag: 'New',
    },
    {
      title: '10th Step Journal',
      description: 'Record your daily inventory with guided prompts and track your recovery journey over time.',
      imageUrl: '/images/features/journal.png',
      icon: <EditNoteIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Open Journal',
      actionUrl: '/journal',
      accentColor: '#1A2B34',
    },
    {
      title: 'Big Book Reader',
      description: 'Access and search the Big Book with highlighting, annotations, and bookmarking tools.',
      imageUrl: '/images/features/bigbook.png',
      icon: <MenuBookIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Start Reading',
      actionUrl: '/big-book',
      accentColor: '#8C6C5B',
    },
    {
      title: 'Recovery Assistant',
      description: 'Get personalized guidance and answers to questions about recovery principles and literature.',
      imageUrl: '/images/features/assistant.png',
      icon: <ChatIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Ask a Question',
      actionUrl: '/assistant',
      accentColor: '#7E57C2',
    },
    {
      title: 'Recovery Circles',
      description: 'Connect with others in recovery through shared groups for mutual support and accountability.',
      imageUrl: '/images/features/circles.png',
      icon: <GroupsIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Find Circles',
      actionUrl: '/circles',
      accentColor: '#43A047',
    },
    {
      title: 'Sobriety Milestones',
      description: 'Celebrate your recovery journey with virtual sobriety chips and milestone tracking.',
      imageUrl: '/images/features/milestones.png',
      icon: <CelebrationIcon sx={{ fontSize: '2rem' }} />,
      actionText: 'Track Milestones',
      actionUrl: '/sobriety',
      accentColor: '#FFA726',
    },
  ]
};

export default featureConfig;