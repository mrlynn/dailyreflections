'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Global, css } from '@emotion/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotesIcon from '@mui/icons-material/Notes';
import SearchIcon from '@mui/icons-material/Search';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import BorderColorIcon from '@mui/icons-material/BorderColor';

import ZoomControl from './ZoomControl';
import KeyboardHints from './KeyboardHints';
import { useSession } from 'next-auth/react';

import BigBookSearchDialog from './BigBookSearchDialog';
import BookmarkList from './BookmarkList';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const PAGE_PATH = (pageNumber) => `/api/bigbook/page/${pageNumber}`;
const CHAPTERS_PATH = '/api/bigbook/chapters';
const BOOKMARKS_PATH = '/api/bigbook/bookmarks';
const NOTES_PATH = '/api/bigbook/notes';
const HIGHLIGHTS_PATH = '/api/bigbook/highlights';
const ASK_PATH = '/api/bigbook/ask';

const buildSameOriginUrl = (path) => {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const current =
        typeof window !== 'undefined'
          ? new URL(window.location.href)
          : null;
      if (!current) {
        return path;
      }
      const target = new URL(path);
      if (current.host === target.host) {
        return path;
      }
      return `${current.origin}${target.pathname}${target.search}${target.hash}`;
    } catch {
      return path;
    }
  }
  if (typeof window === 'undefined') {
    return path;
  }
  return `${window.location.origin}${path}`;
};

// Intelligently truncate text preserving whole words and adding ellipsis
const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;

  // Keep whole words and add ellipsis
  const truncated = text.substring(0, maxLength);

  // Find the last space before the cutoff
  const lastSpace = truncated.lastIndexOf(' ');

  // If we found a space, truncate at that position
  if (lastSpace > maxLength * 0.8) { // Only use this if we don't lose too much text
    return truncated.substring(0, lastSpace) + '…';
  } else {
    return truncated + '…';
  }
};

const fetchSameOrigin = (path, options = {}) => {
  const url = buildSameOriginUrl(path);

  // Ensure credentials are included by default for all API requests
  const enhancedOptions = {
    ...options,
    credentials: 'include',  // Always include credentials
    headers: {
      ...options.headers,
      // Add CSRF protection if needed
      'X-Requested-With': 'XMLHttpRequest',
    }
  };

  return fetch(url, enhancedOptions);
};

function getSelectedText() {
  if (typeof window === 'undefined') return '';
  return window.getSelection()?.toString().trim() || '';
}

function clearSelection() {
  if (typeof window === 'undefined') return;
  if (window.getSelection) {
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  }
}

export default function BigBookReader() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'));
  const { data: session, status: sessionStatus } = useSession();
  const aiEnabled = useFeatureFlag('BIGBOOK', 'AI_HELPER');

  const pageParam = Number.parseInt(params?.pageNumber || '1', 10);
  const pageNumber = Number.isNaN(pageParam) || pageParam <= 0 ? 1 : pageParam;

  const [pageData, setPageData] = useState(null);
  const [pageImage, setPageImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previousPage, setPreviousPage] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [chapters, setChapters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkError, setBookmarkError] = useState(null);

  const [notes, setNotes] = useState([]);
  const [notesError, setNotesError] = useState(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteQuote, setNoteQuote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

  const [askOpen, setAskOpen] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(null);
  const [textDialogOpen, setTextDialogOpen] = useState(false);

  // Full highlight text dialog
  const [fullHighlightOpen, setFullHighlightOpen] = useState(false);
  const [fullHighlightText, setFullHighlightText] = useState('');

  // Highlight functionality
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [highlightError, setHighlightError] = useState(null);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectionInProgress, setSelectionInProgress] = useState(false);

  // Zoom and pan functionality
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });

  // Remember user's zoom preference
  useEffect(() => {
    try {
      // Load saved zoom level from localStorage if available
      const savedZoom = localStorage.getItem('bigbook-zoom-level');
      if (savedZoom) {
        setZoomLevel(parseFloat(savedZoom));
      }
    } catch (err) {
      // Ignore localStorage errors
    }
  }, []);

  // Save zoom level when it changes
  useEffect(() => {
    try {
      localStorage.setItem('bigbook-zoom-level', zoomLevel.toString());
    } catch (err) {
      // Ignore localStorage errors
    }

    // Reset pan position when zoom level changes to 1
    if (zoomLevel <= 1) {
      setPanPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Pan handling functions
  // Calculate max allowed pan distance based on zoom level
  const maxPanDistance = useMemo(() => {
    // At higher zoom levels, allow more panning
    // This is a rough estimate to prevent the content from being panned completely off-screen
    const baseDistance = 500; // Base max distance in pixels
    return (zoomLevel - 1) * baseDistance;
  }, [zoomLevel]);

  const handleMouseDown = (e) => {
    // Don't enable panning when in highlight mode or when zoom level is 1 or less
    if (highlightMode || zoomLevel <= 1) return;

    e.preventDefault(); // Prevent text selection during pan
    setIsPanning(true);
    setStartPanPosition({
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;

    // Calculate new position
    let newX = e.clientX - startPanPosition.x;
    let newY = e.clientY - startPanPosition.y;

    // Apply constraints based on zoom level to prevent content from moving too far off-screen
    newX = Math.max(Math.min(newX, maxPanDistance), -maxPanDistance);
    newY = Math.max(Math.min(newY, maxPanDistance), -maxPanDistance);

    setPanPosition({ x: newX, y: newY });
  };

  // Handle a click on a text row
  const handleRowClick = (e, rowText, rowIndex) => {
    e.stopPropagation();
    e.preventDefault();

    // Start selection or finish selection
    if (!selectionInProgress) {
      // Start a new selection
      setSelectedRows(new Set([rowIndex]));
      setSelectionInProgress(true);
    } else {
      // Complete the selection - determine range and create highlight
      const rows = Array.from(selectedRows);

      // Add current row if not already selected
      if (!selectedRows.has(rowIndex)) {
        rows.push(rowIndex);
      }

      // Find min and max row indexes to get the full range
      const minIndex = Math.min(...rows);
      const maxIndex = Math.max(...rows);

      // Get all rows in the range
      const allSelectedRows = new Set();
      for (let i = minIndex; i <= maxIndex; i++) {
        allSelectedRows.add(i);
      }

      setSelectedRows(allSelectedRows);

      // Create the highlight after a small delay
      setTimeout(() => {
        createHighlightFromRows(allSelectedRows);
        // Reset selection state
        setSelectedRows(new Set());
        setSelectionInProgress(false);
      }, 100);
    }
  };

  // Handle mouse movement over rows when selection in progress
  const handleRowMouseOver = (e, rowText, rowIndex) => {
    if (selectionInProgress) {
      e.stopPropagation();

      // Add this row to selection
      setSelectedRows(prev => {
        const updated = new Set(prev);
        updated.add(rowIndex);
        return updated;
      });
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // If we're in highlight mode but not actively selecting rows,
    // cancel any ongoing selection
    if (highlightMode && !e.target.hasAttribute('data-row-index')) {
      setSelectionInProgress(false);
      setSelectedRows(new Set());
    }
  };

  // Touch support for mobile devices
  const handleTouchStart = (e) => {
    // Don't enable panning when in highlight mode or when zoom level is 1 or less
    if (highlightMode || zoomLevel <= 1) return;

    if (e.touches.length === 1) {
      setIsPanning(true);
      setStartPanPosition({
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isPanning || zoomLevel <= 1) return;
    if (e.touches.length === 1) {
      e.preventDefault(); // Prevent scrolling when panning

      // Calculate new position
      let newX = e.touches[0].clientX - startPanPosition.x;
      let newY = e.touches[0].clientY - startPanPosition.y;

      // Apply constraints based on zoom level to prevent content from moving too far off-screen
      newX = Math.max(Math.min(newX, maxPanDistance), -maxPanDistance);
      newY = Math.max(Math.min(newY, maxPanDistance), -maxPanDistance);

      setPanPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // For touch, we'll complete any active row selection
    if (highlightMode && selectionInProgress) {
      // Find the touched element
      const touch = e.changedTouches?.[0];
      if (touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const rowIndex = element?.getAttribute('data-row-index');
        if (rowIndex !== null && rowIndex !== undefined) {
          // Complete the selection
          const numericIndex = parseInt(rowIndex, 10);
          if (!isNaN(numericIndex)) {
            // Add this row and create highlight
            setSelectedRows(prev => {
              const updated = new Set(prev);
              updated.add(numericIndex);
              return updated;
            });

            setTimeout(() => {
              createHighlightFromRows(selectedRows);
              setSelectedRows(new Set());
              setSelectionInProgress(false);
            }, 100);
          }
        }
      }
    }
  };

  // Create a highlight from selected rows
  const createHighlightFromRows = async (rowIndexes) => {
    if (!isAuthenticated) {
      setHighlightError('Sign in to save highlights.');
      return;
    }

    if (rowIndexes.size === 0) {
      return;
    }

    setHighlightLoading(true);
    setHighlightError(null);

    try {
      // Get all row elements
      const rowElements = document.querySelectorAll('[data-row-index]');
      let combinedText = '';

      // Sort row indexes
      const sortedIndexes = Array.from(rowIndexes).sort((a, b) => a - b);

      // Gather text from all selected rows
      sortedIndexes.forEach(rowIndex => {
        const rowElement = document.querySelector(`[data-row-index="${rowIndex}"]`);
        if (rowElement) {
          const rowText = rowElement.getAttribute('data-row-text');
          if (rowText) {
            combinedText += rowText + ' ';
          }
        }
      });

      combinedText = combinedText.trim();

      if (!combinedText) {
        throw new Error('No text found in selected rows');
      }

      // Find position in page text
      const pageText = pageData?.text || pageData?.fullText || '';
      let selectionStart = pageText.indexOf(combinedText);

      // If exact match fails, use the text from the first row as anchor
      if (selectionStart < 0) {
        const firstRowElement = document.querySelector(`[data-row-index="${sortedIndexes[0]}"]`);
        if (firstRowElement) {
          const firstRowText = firstRowElement.getAttribute('data-row-text');
          if (firstRowText) {
            selectionStart = pageText.indexOf(firstRowText);
          }
        }
      }

      // If we still can't find a match, use a simple position
      if (selectionStart < 0) {
        selectionStart = 0;
      }

      // Create and save the highlight
      const payload = {
        pageNumber,
        text: combinedText,
        color: highlightColor,
        selectionStart,
        selectionEnd: selectionStart + combinedText.length
      };

      const response = await fetchSameOrigin(HIGHLIGHTS_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save highlight.');
      }

      // Reload highlights to show the new one
      await loadHighlights();
    } catch (err) {
      console.error('Failed to save highlight:', err);
      setHighlightError(err.message || 'Failed to save highlight.');
    } finally {
      setHighlightLoading(false);
    }
  };

  // Add global event listeners for panning and highlighting
  useEffect(() => {
    // Always listen for mouse up events when in highlight mode
    if (highlightMode) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
    }

    // Add panning event listeners only when zoomed in
    if (zoomLevel > 1) {
      // Mouse events
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);

      // Touch events
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }

    return () => {
      // Mouse events
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);

      // Touch events
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isPanning, startPanPosition, zoomLevel, highlightMode]);

  // Check if user is authenticated with proper session
  const isAuthenticated = sessionStatus === 'authenticated' && !!session?.user;

  // Debug authentication status
  useEffect(() => {
    console.log('Authentication status in BigBookReader:', {
      sessionStatus,
      hasSession: !!session,
      hasUser: !!session?.user,
      isAuthenticated
    });
  }, [sessionStatus, session, isAuthenticated]);

  const loadChapters = useCallback(async () => {
    try {
      const response = await fetchSameOrigin(CHAPTERS_PATH, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load chapters');
      }
      const data = await response.json();
      setChapters(Array.isArray(data.chapters) ? data.chapters : []);
    } catch (err) {
      console.error('Failed to load chapters:', err);
    }
  }, []);

  const loadBookmarks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      console.log('Loading bookmarks for page:', pageNumber, 'User authenticated:', isAuthenticated);

      const response = await fetchSameOrigin(BOOKMARKS_PATH, {
        cache: 'no-store',
        // Note: credentials now included by default in fetchSameOrigin
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated for bookmarks, status:', sessionStatus);
          setIsBookmarked(false);
          return;
        }
        throw new Error(`Failed to load bookmarks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const bookmarkList = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      console.log('Bookmark data received:', bookmarkList.length, 'bookmarks found');

      const current = bookmarkList.find((item) => item.pageNumber === pageNumber);
      setIsBookmarked(Boolean(current));
      console.log('Current page bookmark status:', Boolean(current));
    } catch (err) {
      console.error('Bookmark load error:', err);
      // Don't set error message for loading issues - just log it
    }
  }, [pageNumber, isAuthenticated, sessionStatus]);

  const loadNotes = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const params = new URLSearchParams({ pageNumber: pageNumber.toString() });
      const response = await fetchSameOrigin(`${NOTES_PATH}?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          setNotes([]);
          setNotesError('Sign in to save personal notes.');
          return;
        }
        throw new Error('Failed to load notes');
      }
      const data = await response.json();
      setNotes(Array.isArray(data.notes) ? data.notes : []);
      setNotesError(null);
    } catch (err) {
      console.error('Notes load error:', err);
      setNotesError(err.message || 'Failed to load notes.');
    }
  }, [pageNumber, isAuthenticated]);

  const loadHighlights = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setHighlightLoading(true);
      const params = new URLSearchParams({ pageNumber: pageNumber.toString() });
      const response = await fetchSameOrigin(`${HIGHLIGHTS_PATH}?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setHighlights([]);
          setHighlightError('Sign in to save highlights.');
          return;
        }
        throw new Error('Failed to load highlights');
      }

      const data = await response.json();
      setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
      setHighlightError(null);
    } catch (err) {
      console.error('Highlights load error:', err);
      setHighlightError(err.message || 'Failed to load highlights.');
    } finally {
      setHighlightLoading(false);
    }
  }, [pageNumber, isAuthenticated]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchSameOrigin(PAGE_PATH(pageNumber), { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Page ${pageNumber} not found.`);
        }
        throw new Error('Failed to load page.');
      }
      const data = await response.json();
      const { page } = data;
      setPageData(page);
      setPageImage({
        url: page.imageUrl,
        width: page.pageWidth,
        height: page.pageHeight,
        spans: Array.isArray(page.spans) ? page.spans : [],
      });
      setImageLoaded(false);
      setPreviousPage(data.previousPageNumber);
      setNextPage(data.nextPageNumber);
    } catch (err) {
      console.error('Big Book page load error:', err);
      setError(err.message || 'Failed to load page.');
    } finally {
      setLoading(false);
    }
  }, [pageNumber]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  useEffect(() => {
    if (isAuthenticated) {
      setBookmarkError(null);
      setNotesError(null);
      setHighlightError(null);
      Promise.resolve(loadBookmarks());
      Promise.resolve(loadNotes());
      Promise.resolve(loadHighlights());
    } else if (sessionStatus === 'unauthenticated') {
      setIsBookmarked(false);
      setNotes([]);
      setHighlights([]);
      setNotesError('Sign in to save personal notes.');
      setHighlightError('Sign in to save highlights.');
      setBookmarkError('Sign in to save bookmarks.');
    }
  }, [pageNumber, loadBookmarks, loadNotes, loadHighlights, sessionStatus, isAuthenticated]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        return;
      }

      // Page navigation shortcuts
      if (event.key === 'ArrowLeft' && previousPage) {
        router.push(`/big-book/page/${previousPage}`);
      }
      if (event.key === 'ArrowRight' && nextPage) {
        router.push(`/big-book/page/${nextPage}`);
      }

      // Zoom shortcuts
      const zoomStep = 0.1;

      // Zoom in: '+' key or '=' key (which is typically Shift+=)
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        if (zoomLevel < 4) {
          setZoomLevel(Math.min(zoomLevel + zoomStep, 4));
        }
      }

      // Zoom out: '-' key
      if (event.key === '-') {
        event.preventDefault();
        if (zoomLevel > 0.5) {
          setZoomLevel(Math.max(zoomLevel - zoomStep, 0.5));
        }
      }

      // Reset zoom: '0' key
      if (event.key === '0') {
        event.preventDefault();
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 }); // Reset pan position too
      }

      // Pan with keyboard when zoomed in
      if (zoomLevel > 1) {
        const panStep = 30 / zoomLevel; // Adjust step size based on zoom level

        // Up
        if (event.key === 'w' || (event.ctrlKey && event.key === 'ArrowUp')) {
          event.preventDefault();
          setPanPosition(prev => ({
            x: prev.x,
            y: Math.max(prev.y + panStep, -maxPanDistance)
          }));
        }

        // Down
        if (event.key === 's' || (event.ctrlKey && event.key === 'ArrowDown')) {
          event.preventDefault();
          setPanPosition(prev => ({
            x: prev.x,
            y: Math.min(prev.y - panStep, maxPanDistance)
          }));
        }

        // Left
        if (event.key === 'a' || (event.ctrlKey && event.key === 'ArrowLeft')) {
          event.preventDefault();
          setPanPosition(prev => ({
            x: Math.max(prev.x + panStep, -maxPanDistance),
            y: prev.y
          }));
        }

        // Right
        if (event.key === 'd' || (event.ctrlKey && event.key === 'ArrowRight')) {
          event.preventDefault();
          setPanPosition(prev => ({
            x: Math.min(prev.x - panStep, maxPanDistance),
            y: prev.y
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previousPage, nextPage, router, zoomLevel, maxPanDistance]);

  const currentChapter = useMemo(() => {
    if (!Array.isArray(chapters) || !pageData) return null;
    return chapters.find(
      (chapter) => pageNumber >= chapter.startPage && pageNumber <= chapter.endPage,
    );
  }, [chapters, pageData, pageNumber]);

  // Extract page text for highlighting and selections
  const pageText = useMemo(() => {
    return pageData?.text || pageData?.fullText || '';
  }, [pageData]);

  // Calculate aspect ratio for proper content display
  const aspectRatio = useMemo(() => {
    if (!pageImage?.width || !pageImage?.height) return 1.3;
    return pageImage.height / pageImage.width;
  }, [pageImage]);

  // Use aspect ratio to determine image container size
  const imageContainerHeight = useMemo(() => {
    if (isDesktop) {
      // For larger screens, use a fixed height
      return '70vh';
    } else {
      // For mobile, calculate based on screen width and aspect ratio
      return `min(85vh, ${Math.min(aspectRatio * 100, 150)}vw)`;
    }
  }, [aspectRatio, isDesktop]);

  const handleNavigate = (target) => {
    if (target && target !== pageNumber) {
      router.push(`/big-book/page/${target}`);
      if (!isDesktop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      setBookmarkError('Sign in to save bookmarks.');
      return;
    }

    // For debugging - log session info
    console.log('Toggling bookmark, authenticated status:', isAuthenticated, 'Session status:', sessionStatus);
    console.log('Current page:', pageNumber, 'Is currently bookmarked:', isBookmarked);

    setBookmarkLoading(true);
    setBookmarkError(null);

    try {
      if (isBookmarked) {
        // Delete existing bookmark
        const params = new URLSearchParams({ pageNumber: pageNumber.toString() });
        console.log('Removing bookmark for page:', pageNumber);

        const response = await fetchSameOrigin(`${BOOKMARKS_PATH}?${params.toString()}`, {
          method: 'DELETE',
          // Note: credentials now included by default in fetchSameOrigin
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete bookmark response:', response.status, errorData);

          if (response.status === 401) {
            throw new Error('Authentication required. Please sign in again.');
          }

          throw new Error(`Failed to remove bookmark: ${errorData.error || response.statusText}`);
        }

        console.log('Successfully removed bookmark');
        setIsBookmarked(false);
      } else {
        // Create new bookmark
        console.log('Creating bookmark for page:', pageNumber);

        const response = await fetchSameOrigin(BOOKMARKS_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageNumber }),
          // Note: credentials now included by default in fetchSameOrigin
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Create bookmark response:', response.status, errorData);

          if (response.status === 401) {
            throw new Error('Authentication required. Please sign in again.');
          }

          throw new Error(`Failed to create bookmark: ${errorData.error || response.statusText}`);
        }

        console.log('Successfully created bookmark');
        setIsBookmarked(true);

        // Reload bookmarks to ensure we have the latest data
        await loadBookmarks();
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
      setBookmarkError(err.message || 'Failed to update bookmark.');

      // If unauthorized, clear bookmark state
      if (err.message?.includes('Authentication') || err.message?.includes('sign in')) {
        setIsBookmarked(false);
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  // This method is deprecated in favor of row-based highlighting
  const createHighlight = async () => {
    // If we get here from legacy code, notify user to use row selection instead
    setHighlightError('Please use the new row-based highlighting by clicking on text rows.');

    // Clear selection after highlighting
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }

    return;
  };

  const openNoteDialog = () => {
    if (!isAuthenticated) {
      setNotesError('Sign in to save personal notes.');
      setNoteDialogOpen(true);
      return;
    }

    const selected = getSelectedText();
    setNoteQuote(selected);
    setNoteDraft('');
    setNotesError(null);
    setNoteDialogOpen(true);
  };

  const submitNote = async () => {
    if (!isAuthenticated) {
      setNotesError('Sign in to save personal notes.');
      return;
    }
    if (!noteDraft.trim()) {
      setNotesError('Please enter a note before saving.');
      return;
    }
    setNoteSubmitting(true);
    setNotesError(null);
    try {
      const payload = {
        pageNumber,
        note: noteDraft.trim(),
      };

      const cleanedQuote = noteQuote?.trim();
      if (cleanedQuote) {
        payload.quote = cleanedQuote;
        const pageText = pageData?.text || '';
        const index = pageText.indexOf(cleanedQuote);
        if (index >= 0) {
          payload.selectionStart = index;
          payload.selectionEnd = index + cleanedQuote.length;
        }
      }

      const response = await fetchSameOrigin(NOTES_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save note.');
      }
      setNoteDialogOpen(false);
      setNoteDraft('');
      setNoteQuote('');
      await loadNotes();
    } catch (err) {
      console.error('Failed to save note:', err);
      setNotesError(err.message || 'Failed to save note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleAsk = async () => {
    if (!askQuestion.trim()) {
      setAskError('Please enter a question.');
      return;
    }
    setAskLoading(true);
    setAskError(null);
    try {
      const response = await fetchSameOrigin(ASK_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askQuestion.trim(),
          pageNumber,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to process your question.');
      }
      const data = await response.json();
      setAskAnswer(data.answer);
    } catch (err) {
      console.error('Ask endpoint failed:', err);
      setAskError(err.message || 'Unable to process your question right now.');
      setAskAnswer('');
    } finally {
      setAskLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, maxWidth: 480, textAlign: 'center' }} elevation={4}>
          <Typography variant="h5" gutterBottom>
            Unable to load this page
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadPage}
          >
            Try Again
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 1, sm: 2, md: 5 } }}>
      {/* Global styles for selection in highlight mode */}
      {highlightMode && (
        <Global
          styles={css`
            ::selection {
              background-color: ${highlightColor === 'yellow' ? 'rgba(255, 255, 0, 0.25)' :
                highlightColor === 'lightblue' ? 'rgba(173, 216, 230, 0.25)' :
                highlightColor === 'lightgreen' ? 'rgba(144, 238, 144, 0.25)' :
                'rgba(255, 192, 203, 0.25)'} !important;
              color: rgba(0, 0, 0, 0.9) !important;
              text-shadow: none;
            }
          `}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 6 },
          pb: { xs: 1, md: 3 },
        }}
      >
        <Stack direction="row" spacing={{ xs: 0.5, md: 1 }} alignItems="center">
          {!isTabletUp && (
            <IconButton
              onClick={() => setTocOpen(true)}
              aria-label="Open table of contents"
              size="small"
            >
              <MenuBookIcon fontSize="small" />
            </IconButton>
          )}
          <Typography
            variant={isTabletUp ? "h4" : "h5"}
            fontWeight={700}
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}
          >
            Big Book · Page {pageNumber}
          </Typography>
          {currentChapter && (
            <Chip
              label={isTabletUp ?
                `${currentChapter.title} (Pages ${currentChapter.startPage}-${currentChapter.endPage})` :
                `${currentChapter.title}`
              }
              size="small"
              color="primary"
              sx={{
                ml: 1,
                fontSize: { xs: '0.675rem', md: '0.75rem' },
                height: { xs: 22, md: 24 }
              }}
            />
          )}
        </Stack>

        <Stack direction="row" spacing={{ xs: 0.5, md: 1 }}>
          <Tooltip title="Search the Big Book">
            <IconButton
              color="primary"
              onClick={() => setSearchOpen(true)}
              size={isTabletUp ? "medium" : "small"}
            >
              <SearchIcon fontSize={isTabletUp ? "medium" : "small"} />
            </IconButton>
          </Tooltip>
          <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}>
            <span>
              <IconButton
                color={isBookmarked ? 'primary' : 'default'}
                onClick={handleBookmarkToggle}
                disabled={bookmarkLoading}
                size={isTabletUp ? "medium" : "small"}
              >
                {isBookmarked ?
                  <BookmarkIcon fontSize={isTabletUp ? "medium" : "small"} /> :
                  <BookmarkBorderIcon fontSize={isTabletUp ? "medium" : "small"} />
                }
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="View all bookmarks">
            <IconButton
              color="default"
              onClick={() => setBookmarksOpen(true)}
              size={isTabletUp ? "medium" : "small"}
            >
              <MenuBookIcon fontSize={isTabletUp ? "medium" : "small"} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add personal note">
            <span>
              <IconButton
                color="default"
                onClick={openNoteDialog}
                size={isTabletUp ? "medium" : "small"}
              >
                <AddCommentIcon fontSize={isTabletUp ? "medium" : "small"} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={highlightMode ? "Exit highlight mode" : "Highlight text"}>
            <span>
              <IconButton
                color={highlightMode ? "primary" : "default"}
                onClick={() => setHighlightMode(!highlightMode)}
                size={isTabletUp ? "medium" : "small"}
              >
                <BorderColorIcon fontSize={isTabletUp ? "medium" : "small"} />
              </IconButton>
            </span>
          </Tooltip>
          {aiEnabled && (
            <Tooltip title="Ask about this page">
              <IconButton
                color="default"
                onClick={() => setAskOpen(true)}
                size={isTabletUp ? "medium" : "small"}
              >
                <LightbulbIcon fontSize={isTabletUp ? "medium" : "small"} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          px: { xs: 1, sm: 2, md: 6 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'flex-start',
          gap: { xs: 2, sm: 3, md: 3 },
        }}
      >
        {isTabletUp && (
          <Box
            sx={{
              width: { md: 280, lg: 320 },
              flexShrink: 0,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 1,
                maxHeight: '75vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: { xs: 0, md: theme.spacing(6) },
              }}
            >
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Table of Contents
                </Typography>
              </Box>
              <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                <List disablePadding>
                  {chapters.map((chapter) => {
                    const active = pageNumber >= chapter.startPage && pageNumber <= chapter.endPage;
                    return (
                      <ListItem key={chapter.slug} disablePadding>
                        <ListItemButton
                          selected={active}
                          onClick={() => handleNavigate(chapter.startPage)}
                        >
                          <ListItemText
                            primary={chapter.title}
                            secondary={`Pages ${chapter.startPage} – ${chapter.endPage}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </Paper>
          </Box>
        )}

        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: { md: '100%', lg: 760 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1,
              p: { xs: 2, sm: 2.5, md: 4 },
              boxShadow: '0 20px 45px rgba(15, 97, 80, 0.12)',
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={{ xs: 1, sm: 2 }}
              mb={3}
            >
              <Button
                variant="outlined"
                size={isTabletUp ? "medium" : "small"}
                onClick={() => handleNavigate(previousPage)}
                disabled={!previousPage}
                sx={{
                  minWidth: { xs: '36px', md: 'auto' },
                  px: { xs: 1, sm: 1.5, md: 2 }
                }}
              >
                <ChevronLeftIcon fontSize={isTabletUp ? "medium" : "small"} />
                {isTabletUp && <Box component="span" sx={{ ml: 0.5 }}>Previous</Box>}
              </Button>
              <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
                <Chip
                  label={`Page ${pageNumber}`}
                  size={isTabletUp ? "medium" : "small"}
                  sx={{
                    fontWeight: 600,
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    height: { xs: 24, md: 32 }
                  }}
                />
                <Button
                  variant="outlined"
                  size={isTabletUp ? "medium" : "small"}
                  onClick={() => setTextDialogOpen(true)}
                  sx={{
                    minWidth: { xs: '36px', md: 'auto' },
                    px: { xs: 1, sm: 1.5, md: 2 }
                  }}
                >
                  <MenuBookIcon fontSize={isTabletUp ? "medium" : "small"} />
                  {isTabletUp && <Box component="span" sx={{ ml: 0.5 }}>View Text</Box>}
                </Button>
              </Stack>
              <Button
                variant="outlined"
                size={isTabletUp ? "medium" : "small"}
                onClick={() => handleNavigate(nextPage)}
                disabled={!nextPage}
                sx={{
                  minWidth: { xs: '36px', md: 'auto' },
                  px: { xs: 1, sm: 1.5, md: 2 }
                }}
              >
                {isTabletUp && <Box component="span" sx={{ mr: 0.5 }}>Next</Box>}
                <ChevronRightIcon fontSize={isTabletUp ? "medium" : "small"} />
              </Button>
            </Stack>

            {bookmarkError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {bookmarkError}
              </Alert>
            )}

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                position: 'relative',
                width: '100%',
                margin: '0 auto',
                height: imageContainerHeight, // Dynamic height based on aspect ratio
                overflow: 'hidden',
                border: '1px solid',
                borderColor: highlightMode ? 'primary.main' : 'divider',
                borderRadius: 1,
                boxShadow: highlightMode
                  ? '0 0 0 2px rgba(25, 118, 210, 0.25), 0 10px 24px rgba(26, 54, 93, 0.25)'
                  : '0 10px 24px rgba(26, 54, 93, 0.25)',
              }}
            >
              {/* Highlight mode indicator */}
              {highlightMode && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 12px',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'medium',
                    textAlign: 'center',
                    zIndex: 10,
                  }}
                >
                  Highlight Mode Active — Select text to highlight
                </Box>
              )}
              {/* Controls */}
              <ZoomControl zoomLevel={zoomLevel} onZoomChange={setZoomLevel} maxZoom={4.0} />
              <KeyboardHints zoomEnabled={true} />

              {/* Page Navigation Overlays - Hidden in highlight mode */}
              {!highlightMode && previousPage && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: '100%',
                    width: '15%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    zIndex: 7, // Lower than text selection layer (z-index: 8)
                    transition: 'opacity 0.2s',
                    opacity: 0,
                    pointerEvents: highlightMode ? 'none' : 'auto',
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.03)',
                    },
                  }}
                  onClick={() => handleNavigate(previousPage)}
                >
                  <IconButton
                    sx={{
                      ml: 1,
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'background.paper',
                      },
                    }}
                    size="medium"
                    aria-label="previous page"
                  >
                    <ChevronLeftIcon fontSize="medium" />
                  </IconButton>
                </Box>
              )}
              {!highlightMode && nextPage && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: '100%',
                    width: '15%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    zIndex: 7, // Lower than text selection layer (z-index: 8)
                    transition: 'opacity 0.2s',
                    opacity: 0,
                    pointerEvents: highlightMode ? 'none' : 'auto',
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.03)',
                    },
                  }}
                  onClick={() => handleNavigate(nextPage)}
                >
                  <IconButton
                    sx={{
                      mr: 1,
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'background.paper',
                      },
                    }}
                    size="medium"
                    aria-label="next page"
                  >
                    <ChevronRightIcon fontSize="medium" />
                  </IconButton>
                </Box>
              )}

              {/* Page indicator overlay at bottom - Hidden in highlight mode */}
              {!highlightMode && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 7, // Lower than text selection layer
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(4px)',
                    boxShadow: 1,
                    borderRadius: 4,
                    py: 0.5,
                    px: 1.5,
                    transition: 'opacity 0.3s',
                    pointerEvents: highlightMode ? 'none' : 'auto',
                    '&:hover': {
                      opacity: 1,
                    }
                  }}
                >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'primary.main',
                  }}
                >
                  Page {pageNumber}
                </Typography>
                {currentChapter && (
                  <Tooltip title={`${currentChapter.title} (Pages ${currentChapter.startPage}-${currentChapter.endPage})`}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        ml: 0.5,
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      · {currentChapter.title}
                    </Typography>
                  </Tooltip>
                )}
              </Box>
              )}

              {/* Container for the zoomable content */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0, // Fill the container
                  overflow: 'hidden', // Hide overflow
                }}
              >
                {pageImage?.url ? (
                  <>
                    {/* Zoomable and Pannable Content */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Transform container */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                          transformOrigin: 'center',
                          transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                          cursor: highlightMode ? 'text' : (zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'),
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={!highlightMode ? handleMouseDown : undefined}
                        onTouchStart={!highlightMode ? handleTouchStart : undefined}
                      >
                        {/* Highlight mode overlay */}
                        {highlightMode && (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              bgcolor: 'rgba(255, 255, 255, 0.6)',
                              zIndex: 5,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        {/* Image */}
                        <Box
                          component="img"
                          src={pageImage.url}
                          alt={`Big Book page ${pageNumber}`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => setImageLoaded(true)}
                          // Disable dragging when in highlight mode
                          draggable={!highlightMode}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            display: 'block',
                            userSelect: 'none',
                            pointerEvents: highlightMode ? 'none' : 'auto',
                          }}
                        />

                        {/* Text spans */}
                        {imageLoaded && (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              pointerEvents: highlightMode ? 'auto' : 'none',
                              userSelect: highlightMode ? 'text' : 'none',
                              cursor: highlightMode ? 'text' : 'default',
                              zIndex: 8,
                              touchAction: highlightMode ? 'none' : 'auto'
                            }}
                            onClick={highlightMode ? (e) => e.stopPropagation() : undefined}
                            onMouseUp={highlightMode ? handleMouseUp : undefined}
                          >
                            {/* Text spans for selection - grouped by rows */}
                            {(() => {
                              if (!pageImage.spans || !pageImage.width || !pageImage.height) return null;

                              // Group spans by their y position (rows)
                              const rowMap = new Map();

                              // Group spans into rows based on their vertical position (with small tolerance)
                              pageImage.spans.forEach((span, index) => {
                                if (!span.y) return;

                                // Round to nearest pixel to group spans in the same row
                                const rowPosition = Math.round(span.y);

                                if (!rowMap.has(rowPosition)) {
                                  rowMap.set(rowPosition, []);
                                }

                                rowMap.get(rowPosition).push({...span, index});
                              });

                              // Sort rows by vertical position
                              const sortedRows = Array.from(rowMap.entries())
                                .sort(([rowA], [rowB]) => rowA - rowB);

                              return sortedRows.map(([rowPosition, rowSpans], rowIndex) => {
                                // Find row boundaries
                                let minLeft = 100;
                                let maxRight = 0;
                                let minTop = 100;
                                let maxBottom = 0;
                                let rowText = '';

                                // Collect all text in this row
                                rowSpans.sort((a, b) => a.x - b.x).forEach(span => {
                                  const left = (span.x / pageImage.width) * 100;
                                  const top = (span.y / pageImage.height) * 100;
                                  const right = left + (span.w / pageImage.width) * 100;
                                  const bottom = top + (span.h / pageImage.height) * 100;

                                  minLeft = Math.min(minLeft, left);
                                  maxRight = Math.max(maxRight, right);
                                  minTop = Math.min(minTop, top);
                                  maxBottom = Math.max(maxBottom, bottom);

                                  rowText += span.text + ' ';
                                });

                                rowText = rowText.trim();

                                // Calculate row dimensions
                                const rowWidth = maxRight - minLeft;
                                const rowHeight = maxBottom - minTop;

                                return (
                                  <Box
                                    key={`row-${rowIndex}`}
                                    component="div"
                                    data-row-index={rowIndex}
                                    data-row-text={rowText}
                                    onClick={highlightMode ? (e) => handleRowClick(e, rowText, rowIndex) : undefined}
                                    onMouseOver={highlightMode ? (e) => handleRowMouseOver(e, rowText, rowIndex) : undefined}
                                    onTouchMove={highlightMode ? (e) => {
                                      if (selectionInProgress) {
                                        e.preventDefault();
                                        handleRowMouseOver(e, rowText, rowIndex);
                                      }
                                    } : undefined}
                                    sx={{
                                      position: 'absolute',
                                      left: `${minLeft}%`,
                                      top: `${minTop}%`,
                                      width: `${rowWidth}%`,
                                      height: `${rowHeight}%`,
                                      color: 'transparent',
                                      backgroundColor: selectedRows.has(rowIndex)
                                        ? `rgba(${highlightColor === 'yellow' ? '255, 255, 0' :
                                           highlightColor === 'lightblue' ? '173, 216, 230' :
                                           highlightColor === 'lightgreen' ? '144, 238, 144' :
                                           '255, 192, 203'}, 0.4)`
                                        : (highlightMode ? 'rgba(0, 0, 0, 0.03)' : 'transparent'),
                                      display: 'block',
                                      pointerEvents: highlightMode ? 'auto' : 'none',
                                      cursor: highlightMode ? 'pointer' : 'default',
                                      zIndex: 10,
                                      '&:hover': highlightMode ? {
                                        backgroundColor: selectedRows.has(rowIndex)
                                          ? `rgba(${highlightColor === 'yellow' ? '255, 255, 0' :
                                             highlightColor === 'lightblue' ? '173, 216, 230' :
                                             highlightColor === 'lightgreen' ? '144, 238, 144' :
                                             '255, 192, 203'}, 0.5)`
                                          : 'rgba(0, 100, 255, 0.15)',
                                      } : {},
                                    }}
                                  >
                                    {rowText}
                                  </Box>
                                );
                              });
                            })()}

                            {/* Highlights */}
                            {imageLoaded && highlights.map((highlight) => {
                              // Find the spans that contain the highlighted text
                              if (!pageImage.spans || !pageImage.width || !pageImage.height) return null;

                              // Find spans that might contain our highlight
                              const matchingSpans = pageImage.spans.filter(span => {
                                if (!span.text) return false;
                                const spanStart = pageText ? pageText.indexOf(span.text) : -1;
                                if (spanStart === -1) return false;

                                const spanEnd = spanStart + span.text.length;

                                // Check if this span overlaps with the highlight
                                return (
                                  (highlight.selectionStart >= spanStart && highlight.selectionStart < spanEnd) ||
                                  (highlight.selectionEnd > spanStart && highlight.selectionEnd <= spanEnd) ||
                                  (highlight.selectionStart <= spanStart && highlight.selectionEnd >= spanEnd)
                                );
                              });

                              return matchingSpans.map((span, spanIndex) => {
                                const left = (span.x / pageImage.width) * 100;
                                const top = (span.y / pageImage.height) * 100;
                                const width = (span.w / pageImage.width) * 100;
                                const height = (span.h / pageImage.height) * 100;

                                return (
                                  <Box
                                    key={`highlight-${highlight.id}-${spanIndex}`}
                                    sx={{
                                      position: 'absolute',
                                      left: `${left}%`,
                                      top: `${top}%`,
                                      width: `${width}%`,
                                      height: `${height}%`,
                                      backgroundColor:
                                        highlight.color === 'yellow' ? 'rgba(255, 255, 0, 0.2)' :
                                        highlight.color === 'lightblue' ? 'rgba(173, 216, 230, 0.2)' :
                                        highlight.color === 'lightgreen' ? 'rgba(144, 238, 144, 0.2)' :
                                        highlight.color === 'pink' ? 'rgba(255, 192, 203, 0.2)' :
                                        'rgba(255, 255, 0, 0.2)',
                                      pointerEvents: 'none',
                                      zIndex: 2,
                                      borderRadius: '2px',
                                      mixBlendMode: 'multiply',
                                    }}
                                  />
                                );
                              });
                            })}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </>
                ) : (
                  /* Fallback text content */
                  <Box
                    sx={{
                      p: 3,
                      typography: 'body1',
                      color: 'text.primary',
                      '& p': {
                        mb: 2,
                        lineHeight: 1.8,
                        fontSize: '1.05rem',
                      },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: pageData?.fullText
                        ? `<p>${pageData.fullText.replace(/\n\n/g, '</p><p>')}</p>`
                        : '<p>Content unavailable.</p>',
                    }}
                  />
                )}
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box
          sx={{
            width: '100%',
            flexShrink: 0,
            maxWidth: { xs: '100%', md: 280, lg: 320 },
          }}
        >
          <Stack spacing={3}>
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 1,
                p: { xs: 2, md: 3 }
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Notes on this page
              </Typography>
              {notesError && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {notesError}
                </Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                size={isTabletUp ? "medium" : "small"}
                startIcon={<AddCommentIcon fontSize={isTabletUp ? "medium" : "small"} />}
                onClick={openNoteDialog}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' }
                }}
              >
                Add Note
              </Button>
              <Stack spacing={2}>
                {notes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {session?.user
                      ? 'You have no notes on this page yet.'
                      : 'Sign in to save personal reflections for this page.'}
                  </Typography>
                ) : (
                  notes.map((note) => (
                    <Paper key={note.id} variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                      {note.quote && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1,
                            fontStyle: 'italic',
                            cursor: note.quote.length > 100 ? 'pointer' : 'default'
                          }}
                          onClick={() => {
                            if (note.quote.length > 100) {
                              setFullHighlightText(note.quote);
                              setFullHighlightOpen(true);
                            }
                          }}
                        >
                          "{truncateText(note.quote, 100)}"
                          {note.quote.length > 100 && (
                            <Tooltip title="Click to view full quote">
                              <span style={{
                                fontSize: '0.75em',
                                marginLeft: '2px',
                                verticalAlign: 'super',
                                color: theme.palette.primary.main
                              }}>
                                [more]
                              </span>
                            </Tooltip>
                          )}
                        </Typography>
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          cursor: note.note.length > 140 ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (note.note.length > 140) {
                            // Show full text in modal
                            setFullHighlightText(note.note);
                            setFullHighlightOpen(true);
                          }
                        }}
                      >
                        {truncateText(note.note, 140)}
                        {note.note.length > 140 && (
                          <Tooltip title="Click to view full note">
                            <span style={{
                              fontSize: '0.75em',
                              marginLeft: '2px',
                              verticalAlign: 'super',
                              color: theme.palette.primary.main
                            }}>
                              [read more]
                            </span>
                          </Tooltip>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Added {new Date(note.createdAt).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: 1,
                p: { xs: 2, md: 3 }
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Highlights
              </Typography>
              {highlightError && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {highlightError}
                </Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                size={isTabletUp ? "medium" : "small"}
                startIcon={<BorderColorIcon fontSize={isTabletUp ? "medium" : "small"} />}
                onClick={() => setHighlightMode(!highlightMode)}
                color={highlightMode ? "primary" : "default"}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' }
                }}
              >
                {highlightMode ? 'Exit Highlight Mode' : 'Highlight Text'}
              </Button>

              {/* Color selection */}
              {highlightMode && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Select highlight color:
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {['yellow', 'lightblue', 'lightgreen', 'pink'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => setHighlightColor(color)}
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: color,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: highlightColor === color ? '2px solid' : '1px solid',
                          borderColor: highlightColor === color ? 'primary.main' : 'divider'
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Stack spacing={2}>
                {highlights.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {session?.user
                      ? 'You have no highlights on this page yet.'
                      : 'Sign in to highlight text on this page.'}
                  </Typography>
                ) : (
                  highlights.map((highlight) => (
                    <Paper
                      key={highlight.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        p: 2,
                        borderLeft: '4px solid',
                        borderColor: highlight.color || 'yellow'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontStyle: 'italic',
                          cursor: highlight.text.length > 140 ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (highlight.text.length > 140) {
                            // Show full text in modal when text is truncated
                            setFullHighlightText(highlight.text);
                            setFullHighlightOpen(true);
                          }
                        }}
                      >
                        "{truncateText(highlight.text, 140)}"
                        {highlight.text.length > 140 && (
                          <Tooltip title="Click to view full text">
                            <span style={{
                              fontSize: '0.75em',
                              marginLeft: '2px',
                              verticalAlign: 'super',
                              color: theme.palette.primary.main
                            }}>
                              [read more]
                            </span>
                          </Tooltip>
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Added {new Date(highlight.createdAt).toLocaleString()}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            try {
                              setHighlightLoading(true);
                              const params = new URLSearchParams({ id: highlight.id });
                              const response = await fetchSameOrigin(
                                `${HIGHLIGHTS_PATH}?${params.toString()}`,
                                {
                                  method: 'DELETE',
                                  credentials: 'include',
                                }
                              );
                              if (!response.ok) {
                                throw new Error('Failed to delete highlight');
                              }
                              await loadHighlights();
                            } catch (err) {
                              console.error('Failed to delete highlight:', err);
                              setHighlightError(err.message || 'Failed to delete highlight');
                            } finally {
                              setHighlightLoading(false);
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: 1,
                p: { xs: 2, md: 3 }
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Quick Actions
              </Typography>
              <Stack spacing={{ xs: 1, md: 1.5 }} mt={2}>
                <Button
                  variant="outlined"
                  size={isTabletUp ? "medium" : "small"}
                  startIcon={<SearchIcon fontSize={isTabletUp ? "medium" : "small"} />}
                  onClick={() => setSearchOpen(true)}
                  sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                >
                  Search the Big Book
                </Button>
                <Button
                  variant="outlined"
                  size={isTabletUp ? "medium" : "small"}
                  startIcon={isBookmarked ?
                    <BookmarkIcon fontSize={isTabletUp ? "medium" : "small"} /> :
                    <BookmarkBorderIcon fontSize={isTabletUp ? "medium" : "small"} />
                  }
                  onClick={handleBookmarkToggle}
                  sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                >
                  {isBookmarked ? 'Remove Bookmark' : 'Bookmark this Page'}
                </Button>
                <Button
                  variant="outlined"
                  size={isTabletUp ? "medium" : "small"}
                  startIcon={<BorderColorIcon fontSize={isTabletUp ? "medium" : "small"} />}
                  onClick={() => setHighlightMode(!highlightMode)}
                  color={highlightMode ? "primary" : "default"}
                  sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                >
                  {highlightMode ? 'Exit Highlight Mode' : 'Highlight Text'}
                </Button>
                {aiEnabled && (
                  <Button
                    variant="outlined"
                    size={isTabletUp ? "medium" : "small"}
                    startIcon={<LightbulbIcon fontSize={isTabletUp ? "medium" : "small"} />}
                    onClick={() => setAskOpen(true)}
                    sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                  >
                    Ask about this Page
                  </Button>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Drawer
        anchor="left"
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Table of Contents</Typography>
            <IconButton edge="end" onClick={() => setTocOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <List>
            {chapters.map((chapter) => {
              const active = pageNumber >= chapter.startPage && pageNumber <= chapter.endPage;
              return (
                <ListItem key={chapter.slug} disablePadding>
                  <ListItemButton
                    selected={active}
                    onClick={() => {
                      handleNavigate(chapter.startPage);
                      setTocOpen(false);
                    }}
                  >
                    <ListItemText
                      primary={chapter.title}
                      secondary={`Pages ${chapter.startPage} – ${chapter.endPage}`}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <BigBookSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      <BookmarkList
        open={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        onNavigate={(pageNum) => handleNavigate(pageNum)}
      />

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add a personal note</DialogTitle>
        <DialogContent dividers>
          {noteQuote && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Saving quote: “{noteQuote.slice(0, 160)}{noteQuote.length > 160 ? '…' : ''}”
            </Alert>
          )}
          <TextField
            multiline
            minRows={4}
            label="Your note"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            fullWidth
          />
          {notesError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {notesError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitNote}
            disabled={noteSubmitting}
          >
            {noteSubmitting ? 'Saving…' : 'Save note'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={askOpen} onClose={() => setAskOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Ask about page {pageNumber}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Your question"
              multiline
              minRows={3}
              value={askQuestion}
              onChange={(event) => setAskQuestion(event.target.value)}
              placeholder="Example: What is this passage suggesting about surrender?"
              fullWidth
            />
            {askError && (
              <Alert severity="error">{askError}</Alert>
            )}
            {askAnswer && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Response
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {askAnswer}
                </Typography>
              </Paper>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAskOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={handleAsk}
            disabled={askLoading}
            startIcon={<LightbulbIcon />}
          >
            {askLoading ? 'Thinking…' : 'Ask'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={textDialogOpen}
        onClose={() => setTextDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Text for page {pageNumber}</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              typography: 'body1',
              color: 'text.primary',
              whiteSpace: 'pre-wrap',
              '& p': {
                mb: 2,
              },
            }}
            dangerouslySetInnerHTML={{
              __html: pageData?.fullText
                ? `<p>${pageData.fullText.replace(/\n\n/g, '</p><p>')}</p>`
                : '<p>Text not available.</p>',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for displaying full highlight text */}
      <Dialog
        open={fullHighlightOpen}
        onClose={() => setFullHighlightOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Full Text
          <IconButton
            aria-label="close"
            onClick={() => setFullHighlightOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body1"
            sx={{
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
            }}
          >
            "{fullHighlightText}"
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFullHighlightOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


