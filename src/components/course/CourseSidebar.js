'use client';

import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Chip, Collapse } from '@mui/material';
import { useState } from 'react';
import Link from 'next/link';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * CourseSidebar - Navigation sidebar showing modules and lessons
 *
 * @param {Object} course - Course object
 * @param {Array} modules - Array of modules with status
 * @param {string} currentLessonId - Current lesson ID for highlighting
 * @param {Array} lessons - All lessons in the course
 * @param {Object} userProgress - User's progress data
 */
export default function CourseSidebar({ course, modules, currentLessonId, lessons, userProgress }) {
  const [expandedModules, setExpandedModules] = useState(
    modules.reduce((acc, mod) => ({ ...acc, [mod._id.toString()]: true }), {})
  );

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const isLessonCompleted = (lessonId) => {
    return userProgress?.completedLessons?.some(
      (cl) => cl.lessonId.toString() === lessonId.toString()
    );
  };

  const getModuleLessons = (moduleId) => {
    return lessons.filter((l) => l.moduleId.toString() === moduleId.toString()).sort((a, b) => a.order - b.order);
  };

  return (
    <Box
      sx={{
        width: { md: 320 },
        height: '100%',
        overflowY: 'auto',
        borderRight: '1px solid',
        borderColor: 'divider',
        background: 'background.paper',
      }}
    >
      <List sx={{ p: 0 }}>
        {modules.map((module) => {
          const moduleLessons = getModuleLessons(module._id);
          const isExpanded = expandedModules[module._id.toString()];

          return (
            <Box key={module._id.toString()}>
              {/* Module Header */}
              <ListItemButton
                onClick={() => toggleModule(module._id.toString())}
                sx={{
                  py: 2,
                  px: 3,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: module.locked ? 'action.hover' : 'background.paper',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      {module.title}
                    </Typography>
                    {module.locked && (
                      <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${module.completedLessonCount}/${module.totalLessonCount}`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.6875rem' }}
                      color={module.completedLessonCount === module.totalLessonCount ? 'success' : 'default'}
                    />
                  </Box>
                </Box>

                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>

              {/* Lessons */}
              <Collapse in={isExpanded && !module.locked} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {moduleLessons.map((lesson) => {
                    const completed = isLessonCompleted(lesson._id);
                    const isCurrent = currentLessonId === lesson._id.toString();

                    return (
                      <ListItemButton
                        key={lesson._id.toString()}
                        component={Link}
                        href={`/course/${course.slug}/learn/${module.slug}/${lesson.slug}`}
                        sx={{
                          pl: 5,
                          pr: 3,
                          py: 1.5,
                          borderLeft: isCurrent ? '3px solid' : '3px solid transparent',
                          borderLeftColor: isCurrent ? 'primary.main' : 'transparent',
                          backgroundColor: isCurrent ? 'action.selected' : 'transparent',
                          '&:hover': {
                            backgroundColor: isCurrent ? 'action.selected' : 'action.hover',
                          },
                        }}
                      >
                        <Box sx={{ mr: 1.5 }}>
                          {completed ? (
                            <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                          )}
                        </Box>

                        <ListItemText
                          primary={lesson.title}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: {
                              fontWeight: isCurrent ? 600 : 400,
                              color: isCurrent ? 'primary.main' : 'text.primary',
                            },
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>

              {/* Locked Module Message */}
              {module.locked && isExpanded && (
                <Box sx={{ px: 5, py: 2, backgroundColor: 'action.hover' }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                    This module will unlock as you progress
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
