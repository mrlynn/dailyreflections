'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SchoolIcon from '@mui/icons-material/School';
import HandshakeIcon from '@mui/icons-material/Handshake';
import BuildIcon from '@mui/icons-material/Build';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import TodayIcon from '@mui/icons-material/Today';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from '@mui/material/Link';
import Image from 'next/image';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`about-tabpanel-${index}`}
      aria-labelledby={`about-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(79,70,229,0.02) 100%)',
          py: { xs: 4, md: 5 },
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
        }}
      >
        <Container maxWidth="lg">
          {/* Back button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{ color: 'text.secondary' }}
              size="small"
            >
              Back
            </Button>
          </Box>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 700,
              mb: 2,
              textAlign: 'center',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            About Daily Reflections
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontFamily: 'var(--font-poppins)',
              fontWeight: 500,
              color: 'text.secondary',
              textAlign: 'center',
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            A modern digital companion for the recovery community
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Tabs Navigation */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            mb: 3
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            aria-label="About page tabs"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
            }}
          >
            <Tab icon={<InfoIcon />} label="Overview" iconPosition="start" />
            <Tab icon={<BuildIcon />} label="Tech Stack" iconPosition="start" />
            <Tab icon={<FeaturedPlayListIcon />} label="Features" iconPosition="start" />
            <Tab icon={<PeopleIcon />} label="Creator" iconPosition="start" />
            <Tab icon={<HandshakeIcon />} label="Acknowledgements" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              mb: 4
            }}
          >
            <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
              Project Story
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              The Daily Reflections project was created by Michael Lynn as a compassionate digital resource for the recovery community. Recognizing the importance of daily reflection in the journey of recovery, this project aims to make AA literature more accessible and interactive for those seeking support.
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              Inspired by the power of community and the transformative impact of shared experiences, this application combines traditional recovery wisdom with modern technology to foster connection, learning, and growth.
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              What started as a personal project to digitize daily reflections evolved into a comprehensive platform that not only provides daily readings but also enables community interaction and leverages artificial intelligence to help users explore recovery literature more deeply.
            </Typography>

            <Box sx={{ my: 4 }}>
              <Divider sx={{ mb: 4 }} />
              <Typography variant="h5" component="h3" sx={{ mb: 3, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
                Mission & Vision
              </Typography>

              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Mission:</strong> To provide accessible, interactive daily reflections that support individuals in their recovery journey through community connection and modern technology.
              </Typography>

              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Vision:</strong> To create a digital space where recovery principles are explored, shared, and integrated into daily life, empowering individuals to maintain sobriety and discover new depths in their recovery journey.
              </Typography>
            </Box>
          </Paper>
        </TabPanel>

        {/* Tech Stack Tab */}
        <TabPanel value={activeTab} index={1}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
              Technology Behind the Project
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)', display: 'flex', alignItems: 'center' }}>
                    <CodeIcon sx={{ mr: 1 }} /> Frontend
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Next.js" secondary="React framework for server-side rendering and static site generation" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Material UI" secondary="Component library for consistent design system" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="NextAuth.js" secondary="Authentication with various providers" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="React Context API" secondary="State management across components" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)', display: 'flex', alignItems: 'center' }}>
                    <StorageIcon sx={{ mr: 1 }} /> Backend
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="MongoDB" secondary="NoSQL database for flexible document storage" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="MongoDB Atlas" secondary="Cloud database service with vector search" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Next.js API Routes" secondary="Serverless functions for backend operations" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Node.js" secondary="JavaScript runtime environment" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)', display: 'flex', alignItems: 'center' }}>
                    <SmartToyIcon sx={{ mr: 1 }} /> AI & NLP
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="OpenAI API" secondary="Large language models for intelligent responses" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Vector Embeddings" secondary="Semantic search capabilities for literature" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="RAG System" secondary="Retrieval-Augmented Generation for grounding responses" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Content Moderation" secondary="AI-powered moderation for community safety" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)', display: 'flex', alignItems: 'center' }}>
                    <CloudIcon sx={{ mr: 1 }} /> Infrastructure
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Vercel" secondary="Hosting, deployment and edge functions" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={
                          <Link 
                            href="https://github.com/mrlynn/dailyreflections" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            GitHub
                            <OpenInNewIcon sx={{ fontSize: '0.875rem' }} />
                          </Link>
                        } 
                        secondary="Version control and CI/CD integration" 
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="MongoDB Atlas" secondary="Database as a service" />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary="Content Delivery Network" secondary="Fast global content distribution" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
                    Development Practices
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Chip label="Responsive Design" sx={{ m: 0.5 }} />
                      <Chip label="Mobile First Approach" sx={{ m: 0.5 }} />
                      <Chip label="Progressive Web App" sx={{ m: 0.5 }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Chip label="Serverless Architecture" sx={{ m: 0.5 }} />
                      <Chip label="API-First Development" sx={{ m: 0.5 }} />
                      <Chip label="Continuous Deployment" sx={{ m: 0.5 }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Chip label="Semantic Search" sx={{ m: 0.5 }} />
                      <Chip label="Security Best Practices" sx={{ m: 0.5 }} />
                      <Chip label="Accessibility (a11y)" sx={{ m: 0.5 }} />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Features Tab */}
        <TabPanel value={activeTab} index={2}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
              Key Features
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ mt: 0.5 }}>
                      <AutoStoriesIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Daily Reflections"
                      secondary="Access daily recovery reflections for each day of the year with the ability to navigate between dates. Each reflection includes the original text, references to AA literature, and community discussions."
                    />
                  </ListItem>

                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ mt: 0.5 }}>
                      <ForumIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Community Comments"
                      secondary="Share your thoughts, insights and experiences on each daily reflection. Engage with others in the community through threaded discussions, likes, and respectful dialogue."
                    />
                  </ListItem>

                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ mt: 0.5 }}>
                      <SmartToyIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="AI-Powered Chatbot"
                      secondary="Ask questions about recovery literature with intelligent, contextual responses grounded in AA texts. The chatbot provides helpful guidance while respecting the principles of recovery and avoiding clinical advice."
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <List>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ mt: 0.5 }}>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Literature Exploration"
                      secondary="Discover connections between daily reflections and the AA Big Book through semantic search and cross-references. Find related passages, stories, and principles that deepen your understanding of recovery concepts."
                    />
                  </ListItem>

                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ mt: 0.5 }}>
                      <PeopleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="User Accounts"
                      secondary="Create a personal account to save preferences, track favorite reflections, and participate in the community. Secure authentication ensures privacy while allowing personalized experiences."
                    />
                  </ListItem>

                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ mt: 0.5 }}>
                      <TodayIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sobriety Tracking"
                      secondary="Set your sobriety date and track your progress with milestone celebrations and personal insights. The tracker helps you visualize your journey and acknowledge your achievements."
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
                    Coming Soon
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper elevation={0} sx={{ p: 2, border: '1px dashed rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={600}>Step Work Guides</Typography>
                        <Typography variant="body2">Interactive guides to help work through the 12 Steps with journaling prompts and progress tracking.</Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Paper elevation={0} sx={{ p: 2, border: '1px dashed rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={600}>Meeting Finder Integration</Typography>
                        <Typography variant="body2">Find local and online recovery meetings with detailed information, directions, and community reviews.</Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Paper elevation={0} sx={{ p: 2, border: '1px dashed rgba(0, 0, 0, 0.12)', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={600}>Mobile App</Typography>
                        <Typography variant="body2">Native mobile application for iOS and Android with offline capabilities and notification reminders.</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Creator Tab */}
        <TabPanel value={activeTab} index={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography variant="h4" component="h2" sx={{ mb: 4, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
              About the Creator
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 0 } }}>
                  <Box
                    component="div"
                    sx={{
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      mx: 'auto',
                      mb: 2,
                      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <Image src="/mike-avatar-circle.png" alt="Michael Lynn" width={180} height={250} style={{ borderRadius: '50%' }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    Michael Lynn
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Developer & Recovery Advocate
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Chip label="Software Engineer" size="small" sx={{ m: 0.5 }} />
                    <Chip label="Recovery Community" size="small" sx={{ m: 0.5 }} />
                    <Chip label="Open Source" size="small" sx={{ m: 0.5 }} />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Michael Lynn created this project to combine his technical expertise with his passion for supporting the recovery community. With years of experience in software development and a deep understanding of recovery principles, Michael built this platform to bring daily reflections into the digital age.
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  The project represents his commitment to using technology for positive social impact, specifically in making recovery resources more accessible, interactive, and community-oriented.
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  As someone who has witnessed the transformative power of reflection and community in recovery, Michael designed Daily Reflections to be more than just a digital version of a book—it's an evolving ecosystem that brings together traditional wisdom and modern technological capabilities.
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  Michael continues to develop this project with input from the recovery community, ensuring it remains true to the principles of AA while leveraging technology to enhance accessibility and engagement.
                </Typography>

                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Get in Touch
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Michael welcomes feedback, suggestions, and collaboration opportunities from the recovery community and technical contributors alike. Feel free to reach out through the project's GitHub repository or contact form.
                  </Typography>
                  <Button
                    component="a"
                    href="https://github.com/mrlynn/dailyreflections"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    startIcon={<GitHubIcon />}
                    endIcon={<OpenInNewIcon />}
                    sx={{ mt: 1 }}
                  >
                    View on GitHub
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Acknowledgements Tab */}
        <TabPanel value={activeTab} index={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
              Acknowledgements
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              This project stands on the shoulders of the recovery community and the countless individuals who have shared their experience, strength, and hope throughout the years.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Gratitude
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Special thanks to Alcoholics Anonymous for providing the literature and principles that form the foundation of this application. All AA literature is used with deep respect for its original context and purpose.
              </Typography>

              <Typography variant="body1" sx={{ mb: 2 }}>
                We are grateful to the open source community for the countless tools, libraries, and frameworks that make this project possible. From React and Next.js to MongoDB and Material UI, this application builds upon the work of many talented developers.
              </Typography>

              <Typography variant="body1">
                Most importantly, we acknowledge the recovery community members who have provided feedback, suggestions, and encouragement throughout the development process. Your insights continue to shape and improve this resource.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Disclaimer
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The Daily Reflections project is not affiliated with Alcoholics Anonymous World Services, Inc. AA and Alcoholics Anonymous are registered trademarks of Alcoholics Anonymous World Services, Inc.
              </Typography>

              <Typography variant="body1" sx={{ mb: 2 }}>
                This application is not intended to replace participation in AA meetings, working with a sponsor, or any other aspects of the AA program. It is designed as a supplementary resource to support individuals in their recovery journey.
              </Typography>

              <Typography variant="body1">
                While we strive to ensure the accuracy of all content, this application should not be considered an official source of AA literature or guidance. Always refer to official AA publications for authoritative information.
              </Typography>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Open Source Contributors
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This project welcomes contributions. Visit our GitHub repository to learn how you can help improve this resource for the recovery community.
              </Typography>
              <Button
                component="a"
                href="https://github.com/mrlynn/dailyreflections"
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                startIcon={<GitHubIcon />}
                endIcon={<OpenInNewIcon />}
                sx={{ mt: 1 }}
              >
                Contribute on GitHub
              </Button>
            </Box>
          </Paper>
        </TabPanel>
      </Container>
    </>
  );
}