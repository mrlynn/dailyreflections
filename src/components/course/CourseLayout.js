'use client';

import { Box, Container, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import CourseProgressBar from './CourseProgressBar';
import CourseSidebar from './CourseSidebar';

/**
 * CourseLayout - Main layout wrapper for course pages
 *
 * @param {Object} course - Course object
 * @param {Array} modules - Array of modules with status
 * @param {Object} userProgress - User's progress data
 * @param {number} progress - Progress percentage
 * @param {string} currentLessonId - Current lesson ID for highlighting
 * @param {Array} lessons - All lessons in the course
 * @param {ReactNode} children - Page content
 */
export default function CourseLayout({
  course,
  modules = [],
  userProgress,
  progress = 0,
  currentLessonId,
  lessons = [],
  children,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Progress Bar */}
      <CourseProgressBar progress={progress} course={course} />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <CourseSidebar
            course={course}
            modules={modules}
            currentLessonId={currentLessonId}
            lessons={lessons}
            userProgress={userProgress}
          />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={toggleSidebar}
            sx={{
              '& .MuiDrawer-paper': {
                width: 320,
                maxWidth: '80vw',
              },
            }}
          >
            <CourseSidebar
              course={course}
              modules={modules}
              currentLessonId={currentLessonId}
              lessons={lessons}
              userProgress={userProgress}
            />
          </Drawer>
        )}

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'background.default',
          }}
        >
          {/* Mobile Menu Button */}
          {isMobile && (
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                p: 2,
                backgroundColor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <IconButton onClick={toggleSidebar} size="large">
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          {/* Page Content */}
          <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
