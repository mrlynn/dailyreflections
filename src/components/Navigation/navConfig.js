'use client';

import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import ArticleIcon from '@mui/icons-material/Article';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import ChatIcon from '@mui/icons-material/Chat';
import CelebrationIcon from '@mui/icons-material/Celebration';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EventIcon from '@mui/icons-material/Event';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import QuizIcon from '@mui/icons-material/Quiz';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { getTodayKey } from '@/utils/dateUtils';

export const primaryNav = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Circles', href: '/circles', icon: GroupsIcon, featureFlag: 'CIRCLES' },
  { label: 'Daily Reflection', href: `/today`, icon: CalendarMonthIcon, featureFlag: 'TODAY' },
  { label: 'Big Book Reader', href: '/big-book', icon: MenuBookIcon, featureFlag: 'BIGBOOK' },
  { label: 'Search', href: '/search', icon: SearchIcon, featureFlag: 'SEARCH' },
];

export const toolsNav = [
  { label: '4th Step Inventory', href: '/step4', icon: PsychologyIcon, featureFlag: 'STEP4' },
  { label: '90 in 90 Tracker', href: '/meetings/tracker', icon: AssignmentTurnedInIcon },
  { label: '8th Step Amends List', href: '/step8', icon: FormatListBulletedIcon },
  { label: '9th Step Making Amends', href: '/step9', icon: FormatListBulletedIcon },
  { label: '10th Step Journal', href: '/journal', icon: EditNoteIcon, featureFlag: 'JOURNAL' },
  { label: 'Sobriety Tracker', href: '/sobriety', icon: CelebrationIcon, featureFlag: 'SOBRIETY' },
];

export const resourcesNav = [
  { label: 'Resources', href: '/resources', icon: LibraryBooksIcon },
  { label: 'Meetings', href: '/resources/meetings', icon: MenuBookIcon },
  { label: 'Literature', href: '/resources/literature', icon: ArticleIcon },
  { label: 'Big Book Reader', href: '/big-book', icon: MenuBookIcon, featureFlag: 'BIGBOOK' },
  { label: '12 Steps Explorer', href: '/steps', icon: MenuBookIcon },
  { label: 'Meeting Topics', href: '/topics', icon: LightbulbIcon, featureFlag: 'TOPICS' },
  { label: 'AA Trivia', href: '/trivia', icon: QuizIcon },
  { label: 'Blog', href: '/blog', icon: ArticleIcon, featureFlag: 'BLOG' },
  { label: 'Talk to a Volunteer', href: '/chat', icon: ChatIcon },
];

export const assistantNav = [
  { label: 'Recovery Assistant', href: '/assistant', icon: ChatIcon },
];

export const adminNav = [
  { label: 'Admin Dashboard', href: '/admin', icon: DashboardIcon, featureFlag: 'ADMIN' },
  { label: 'Circles', href: '/admin/circles', icon: GroupsIcon, featureFlag: 'ADMIN' },
  { label: 'Users', href: '/admin/users', icon: DashboardIcon, featureFlag: 'ADMIN', subFeature: 'USER_MANAGEMENT' },
  { label: 'Moderation', href: '/admin/moderation', icon: DashboardIcon, featureFlag: 'ADMIN', subFeature: 'CONTENT_MODERATION' },
  { label: 'Assistant Feedback', href: '/admin/feedback', icon: ThumbsUpDownIcon, featureFlag: 'ADMIN', subFeature: 'CHAT_FEEDBACK' },
  { label: 'Analytics', href: '/admin/analytics', icon: DashboardIcon, featureFlag: 'ADMIN', subFeature: 'ANALYTICS' },
  { label: 'RAG Sources', href: '/admin/rag-sources', icon: DashboardIcon, featureFlag: 'ADMIN', subFeature: 'RAG_SOURCES' },
  { label: 'Meetings', href: '/admin/meetings', icon: EventIcon, featureFlag: 'ADMIN', subFeature: 'MEETINGS_MANAGEMENT' },
  { label: 'Resources', href: '/admin/resources', icon: BookmarksIcon, featureFlag: 'ADMIN', subFeature: 'RESOURCES' },
  { label: 'Blog', href: '/admin/blog', icon: ArticleIcon, featureFlag: 'ADMIN', subFeature: 'BLOG' },
];

export default {
  primaryNav,
  toolsNav,
  resourcesNav,
  assistantNav,
  adminNav,
};


