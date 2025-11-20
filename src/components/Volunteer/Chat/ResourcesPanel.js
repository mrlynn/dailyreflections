'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  CircularProgress,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpIcon from '@mui/icons-material/Help';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import InfoIcon from '@mui/icons-material/Info';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

/**
 * TabPanel component for organizing resources content
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`resources-tabpanel-${index}`}
      aria-labelledby={`resources-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * ResourceItem component for displaying individual resources
 */
function ResourceItem({ resource, onInsert }) {
  const [isFavorite, setIsFavorite] = useState(resource.isFavorite || false);

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // In a real implementation, save this to user preferences
  };

  const handleInsert = () => {
    if (onInsert) {
      onInsert(resource.content);
    }
  };

  return (
    <Paper
      elevation={1}
      sx={{
        mb: 1,
        px: 1,
        py: 0.75,
        '&:hover': {
          boxShadow: 2,
          bgcolor: 'action.hover'
        },
        cursor: 'pointer',
        borderLeft: '2px solid',
        borderColor: 'primary.light'
      }}
      onClick={handleInsert}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" component="div" sx={{
          fontWeight: 500,
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '70%'
        }}>
          {resource.title}
        </Typography>
        <Box>
          <IconButton
            size="small"
            onClick={handleToggleFavorite}
            color={isFavorite ? "primary" : "default"}
            sx={{ p: 0.5 }}
          >
            {isFavorite ? <StarIcon sx={{ fontSize: 16 }} /> : <StarBorderIcon sx={{ fontSize: 16 }} />}
          </IconButton>
          <IconButton size="small" onClick={handleInsert} sx={{ p: 0.5 }}>
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          display: '-webkit-box',
          overflow: 'hidden',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          fontSize: '0.8rem',
          lineHeight: 1.4
        }}
      >
        {resource.content}
      </Typography>

      {resource.tags && resource.tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          {resource.tags.slice(0, 3).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 18, '& .MuiChip-label': { px: 0.8, py: 0 } }}
            />
          ))}
          {resource.tags.length > 3 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              +{resource.tags.length - 3} more
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}

/**
 * ResourcesPanel component for providing volunteers with helpful resources
 * @param {Object} props
 * @param {function} props.onInsertMessage - Callback function to insert a message into the chat input
 * @param {Object} props.chatContext - Context about the current chat (user info, topic, etc.)
 */
export default function ResourcesPanel({ onInsertMessage, chatContext }) {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState({
    quickResponses: [],
    bigBookQuotes: [],
    resources: [],
    links: [],
  });

  // Fetch resources on component mount
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, fetch from an API
        // For now, using mock data
        const mockResources = {
          quickResponses: [
            {
              id: 'qr1',
              title: 'Welcome Message',
              content: 'Hello, thank you for reaching out. I\'m a volunteer here to support you. How can I help today?',
              tags: ['greeting', 'welcome']
            },
            {
              id: 'qr2',
              title: 'Step Work Guidance',
              content: 'Working the steps with a sponsor is a fundamental part of recovery. Have you connected with a sponsor yet?',
              tags: ['steps', 'sponsor']
            },
            {
              id: 'qr3',
              title: 'Meeting Recommendation',
              content: 'Attending meetings regularly can be very helpful. Would you like me to help you find meetings in your area?',
              tags: ['meetings', 'support']
            },
            {
              id: 'qr4',
              title: 'One Day at a Time',
              content: 'Remember to take things one day at a time. Sometimes even one hour or one minute at a time if needed.',
              tags: ['encouragement', 'slogan']
            },
            {
              id: 'qr5',
              title: 'Crisis Resources',
              content: 'If you\'re feeling in crisis, please consider calling the National Helpline at 1-800-662-HELP (4357). They\'re available 24/7.',
              tags: ['crisis', 'emergency', 'help']
            }
          ],
          bigBookQuotes: [
            {
              id: 'bb1',
              title: 'How It Works',
              content: 'Rarely have we seen a person fail who has thoroughly followed our path. Those who do not recover are people who cannot or will not completely give themselves to this simple program.',
              tags: ['how it works', 'chapter 5'],
              page: 58
            },
            {
              id: 'bb2',
              title: 'Acceptance',
              content: 'And acceptance is the answer to all my problems today. When I am disturbed, it is because I find some person, place, thing, or situation — some fact of my life — unacceptable to me, and I can find no serenity until I accept that person, place, thing, or situation as being exactly the way it is supposed to be at this moment.',
              tags: ['acceptance', 'serenity'],
              page: 417
            },
            {
              id: 'bb3',
              title: 'Powerlessness',
              content: 'We admitted we were powerless over alcohol — that our lives had become unmanageable.',
              tags: ['step 1', 'powerlessness'],
              page: 59
            }
          ],
          resources: [
            {
              id: 'r1',
              title: 'Newcomer Packet',
              content: 'Resources for newcomers including meeting lists, literature recommendations, and contact information for local groups.',
              tags: ['newcomer', 'information']
            },
            {
              id: 'r2',
              title: 'Step Work Guides',
              content: 'Detailed guides for working each of the 12 steps with reflection questions and exercises.',
              tags: ['steps', 'workbook']
            }
          ],
          links: [
            {
              id: 'l1',
              title: 'Find Local Meetings',
              content: 'https://www.aa.org/find-aa',
              tags: ['meetings', 'local']
            },
            {
              id: 'l2',
              title: 'Online Literature',
              content: 'https://www.aa.org/the-big-book',
              tags: ['literature', 'big book']
            }
          ]
        };

        setResources(mockResources);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInsertMessage = (content) => {
    if (onInsertMessage) {
      onInsertMessage(content);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter resources based on search query
  const filterResources = (items) => {
    if (!searchQuery) return items;

    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          placeholder="Search resources..."
          size="small"
          fullWidth
          margin="dense"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            sx: { fontSize: '0.875rem' }
          }}
          sx={{ mb: 0.5 }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '36px' }}
        >
          <Tab
            icon={<FormatQuoteIcon fontSize="small" />}
            label="Responses"
            sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
          />
          <Tab
            icon={<MenuBookIcon fontSize="small" />}
            label="Big Book"
            sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
          />
          <Tab
            icon={<HelpIcon fontSize="small" />}
            label="Resources"
            sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
          />
          <Tab
            icon={<LinkIcon fontSize="small" />}
            label="Links"
            sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
          />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                  <Typography variant="subtitle1">Quick Responses</Typography>
                  <Button startIcon={<AddIcon />} size="small">
                    Add New
                  </Button>
                </Box>
                {filterResources(resources.quickResponses).length > 0 ? (
                  filterResources(resources.quickResponses).map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      onInsert={() => handleInsertMessage(resource.content)}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No quick responses found
                  </Typography>
                )}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Big Book Quotes</Typography>
                {filterResources(resources.bigBookQuotes).length > 0 ? (
                  filterResources(resources.bigBookQuotes).map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      onInsert={() => handleInsertMessage(`"${resource.content}" - Big Book, p. ${resource.page}`)}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No quotes found
                  </Typography>
                )}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Recovery Resources</Typography>
                {filterResources(resources.resources).length > 0 ? (
                  filterResources(resources.resources).map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      onInsert={() => handleInsertMessage(resource.content)}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No resources found
                  </Typography>
                )}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Helpful Links</Typography>
                {filterResources(resources.links).length > 0 ? (
                  filterResources(resources.links).map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      onInsert={() => handleInsertMessage(`${resource.title}: ${resource.content}`)}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No links found
                  </Typography>
                )}
              </Box>
            )}
          </TabPanel>
        </Box>
      </Box>

      {/* Context-aware suggestions based on chat - More compact */}
      <Box sx={{ py: 0.5, px: 1, borderTop: 1, borderColor: 'divider' }}>
        <Accordion
          elevation={0}
          sx={{
            bgcolor: 'background.default',
            '&.MuiAccordion-root:before': { display: 'none' },
            '& .MuiAccordionSummary-root': { minHeight: '32px' }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize="small" />}
            sx={{ p: 0, minHeight: '32px' }}
          >
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
              <InfoIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 16 }} />
              Suggested Resources
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, pb: 0, px: 0.5 }}>
            <List dense disablePadding sx={{ mt: 0.5 }}>
              <ListItem
                onClick={() => handleInsertMessage(resources.quickResponses[2]?.content || '')}
                sx={{
                  cursor: 'pointer',
                  py: 0.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <FavoriteIcon sx={{ fontSize: 16 }} color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Meeting Recommendation"
                  secondary="Suggest local meetings"
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
              <ListItem
                onClick={() => handleInsertMessage(resources.bigBookQuotes[0]?.content || '')}
                sx={{
                  cursor: 'pointer',
                  py: 0.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <MenuBookIcon sx={{ fontSize: 16 }} color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="How It Works"
                  secondary="Big Book quote"
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Paper>
  );
}