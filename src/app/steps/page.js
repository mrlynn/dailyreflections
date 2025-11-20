'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardHeader,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChatIcon from '@mui/icons-material/Chat';
import { alpha } from '@mui/material/styles';
import PageHeader from '@/components/PageHeader';

export default function StepsExplorerPage() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Use hardcoded data instead of API call
    try {
      setLoading(true);

      // Hardcoded 12 Steps data with group categories
      const stepsData = [
        {
          number: 1,
          title: "Honesty",
          text: "We admitted we were powerless over alcohol—that our lives had become unmanageable.",
          group: "Surrender and Foundation",
          groupDescription: "These steps are about honesty, humility, and trust.",
          image: "/images/step1.png"
        },
        {
          number: 2,
          title: "Hope",
          text: "Came to believe that a Power greater than ourselves could restore us to sanity.",
          group: "Surrender and Foundation",
          groupDescription: "These steps are about honesty, humility, and trust.",
          image: "/images/step2.png"
        },
        {
          number: 3,
          title: "Faith",
          text: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
          group: "Surrender and Foundation",
          groupDescription: "These steps are about honesty, humility, and trust.",
          image: "/images/step3.png"
        },
        {
          number: 4,
          title: "Courage",
          text: "Made a searching and fearless moral inventory of ourselves.",
          group: "Inventory and Change",
          groupDescription: "These are the housecleaning steps.",
          image: "/images/step4.png"
        },
        {
          number: 5,
          title: "Integrity",
          text: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
          group: "Inventory and Change",
          groupDescription: "These are the housecleaning steps.",
          image: "/images/step5.png"
        },
        {
          number: 6,
          title: "Willingness",
          text: "Were entirely ready to have God remove all these defects of character.",
          group: "Inventory and Change",
          groupDescription: "These are the housecleaning steps.",
          image: "/images/step6.png"
        },
        {
          number: 7,
          title: "Humility",
          text: "Humbly asked Him to remove our shortcomings.",
          group: "Inventory and Change",
          groupDescription: "These are the housecleaning steps.",
          image: "/images/step7.png"
        },
        {
          number: 8,
          title: "Brotherly Love",
          text: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
          group: "Making Amends",
          groupDescription: "These are the relationship steps.",
          image: "/images/step8.png"
        },
        {
          number: 9,
          title: "Justice",
          text: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
          group: "Making Amends",
          groupDescription: "These are the relationship steps.",
          image: "/images/step9.png"
        },
        {
          number: 10,
          title: "Perseverance",
          text: "Continued to take personal inventory and when we were wrong promptly admitted it.",
          group: "Daily Maintenance and Service",
          groupDescription: "These steps are how we live the program.",
          image: "/images/step10.png"
        },
        {
          number: 11,
          title: "Spirituality",
          text: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
          group: "Daily Maintenance and Service",
          groupDescription: "These steps are how we live the program.",
          image: "/images/step11.png"
        },
        {
          number: 12,
          title: "Service",
          text: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.",
          group: "Daily Maintenance and Service",
          groupDescription: "These steps are how we live the program.",
          image: "/images/step12.png"
        }
      ];

      setSteps(stepsData);
      setError(null);
    } catch (err) {
      console.error('Error loading steps:', err);
      setError('Failed to load the 12 Steps. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to get a color for each step card
  const getStepColor = (stepNumber) => {
    const colors = [
      '#4CAF50', // Green
      '#8BC34A', // Light Green
      '#CDDC39', // Lime
      '#FFEB3B', // Yellow
      '#FFC107', // Amber
      '#FF9800', // Orange
      '#FF5722', // Deep Orange
      '#F44336', // Red
      '#E91E63', // Pink
      '#9C27B0', // Purple
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
    ];
    return colors[(stepNumber - 1) % colors.length];
  };

  return (
    <>
      <PageHeader
        title="12 Steps Explorer"
        icon={<MenuBookIcon fontSize="inherit" />}
        subtitle="A detailed guide to understanding and working through the Twelve Steps of Alcoholics Anonymous"
        backgroundImage="/images/steps.png"
        backgroundOverlay="linear-gradient(135deg, rgba(253, 242, 233, 0.78) 0%, rgba(216, 229, 245, 0.6) 50%, rgba(17, 28, 33, 0.6) 100%)"
        backgroundImageStyles={{ filter: 'brightness(1.05)', transform: 'scale(1.04)' }}
        backgroundOverlayStyles={{ mixBlendMode: 'multiply' }}
        invertText
      />





      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
          <Chip label="Recovery Journey" color="primary" variant="outlined" />
          <Chip label="Spiritual Growth" color="primary" variant="outlined" />
          <Chip label="Personal Transformation" color="primary" variant="outlined" />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              The Steps as a Journey
            </Typography>

            <Box sx={{ mb: 6, p: 4, bgcolor: 'rgba(99,102,241,0.04)', borderRadius: 2, border: '1px solid rgba(99,102,241,0.1)' }}>
              <Typography variant="body1" paragraph>
                The 12 Steps aren't just a checklist to complete—they're more like a spiral staircase. You keep circling back, often from a new level of awareness each time.
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                1–3: Surrender and Foundation
              </Typography>
              <Typography variant="body1" paragraph>
                These steps are about honesty, humility, and trust:
                • Step 1: I admit I can't do this alone.
                • Step 2: I begin to believe something greater can help.
                • Step 3: I decide to let that Power into my life.
                They form the spiritual groundwork — a shift from self-reliance to openness.
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                4–7: Inventory and Change
              </Typography>
              <Typography variant="body1" paragraph>
                These are the housecleaning steps:
                • Step 4: I take an honest inventory — I face myself.
                • Step 5: I share that with someone I trust.
                • Steps 6–7: I become willing and ask for change.
                You'll return here many times. Each new season of life brings new patterns to uncover.
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                8–9: Making Amends
              </Typography>
              <Typography variant="body1" paragraph>
                These are the relationship steps:
                • Step 8: I list those I've harmed.
                • Step 9: I make direct amends wherever possible.
                You do these when ready, but they don't end. You continue to practice living in harmony with others.
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                10–12: Daily Maintenance and Service
              </Typography>
              <Typography variant="body1" paragraph>
                These steps are how we live the program:
                • Step 10: I keep an ongoing inventory — daily honesty.
                • Step 11: I seek conscious contact through prayer and meditation.
                • Step 12: I carry the message and practice these principles in all areas of life.
                They're about maintaining spiritual fitness. You don't graduate from them — they become the rhythm of sober living.
              </Typography>

              <Typography variant="body1" sx={{ fontWeight: 600, fontStyle: 'italic', mt: 3 }}>
                You work the Steps to recover, and you live the Steps to stay recovered. The Steps start as an event, but they become a way of life.
              </Typography>
            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
              Select a Step to Explore
            </Typography>

            {/* Group steps by category */}
            {['Surrender and Foundation', 'Inventory and Change', 'Making Amends', 'Daily Maintenance and Service'].map((groupName) => {
              const groupSteps = steps.filter(step => step.group === groupName);

              if (groupSteps.length === 0) return null;

              return (
                <Box key={groupName} sx={{ mb: 6 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    pb: 1,
                    borderBottom: '1px solid rgba(99,102,241,0.2)'
                  }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                      {groupName}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                      ({groupSteps[0].groupDescription})
                    </Typography>
                  </Box>

                  <Grid container spacing={3} sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: groupSteps.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
                      md: groupSteps.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
                    },
                    gap: 3
                  }}>
                    {groupSteps.map((step) => (
                      <Card
                        key={step.number}
                        elevation={2}
                        sx={{
                          height: 360,
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                          borderTop: '4px solid',
                          borderColor: getStepColor(step.number),
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <CardActionArea
                          component={Link}
                          href={`/steps/${step.number}`}
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch'
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              height: 160,
                              overflow: 'hidden'
                            }}
                          >
                            {step.image && (
                              <Image
                                src={step.image}
                                alt={`Step ${step.number} illustration`}
                                fill
                                sizes="(max-width: 1200px) 100vw, 33vw"
                                style={{
                                  objectFit: 'cover'
                                }}
                                priority={step.number <= 3}
                              />
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(180deg, ${alpha(getStepColor(step.number), 0.25)} 0%, ${alpha(getStepColor(step.number), 0.9)} 100%)`,
                                color: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                p: 2
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '1.25rem',
                                    mr: 2,
                                    bgcolor: 'rgba(255,255,255,0.18)'
                                  }}
                                >
                                  {step.number}
                                </Box>
                                <Box>
                                  <Typography
                                    variant="subtitle1"
                                    component="div"
                                    sx={{ fontWeight: 700, lineHeight: 1.2 }}
                                  >
                                    Step {step.number}: {step.title}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1.2 }}
                                  >
                                    {step.group}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>

                          <CardContent sx={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden', // Prevent overflow
                            p: 2
                          }}>
                            <Typography
                              variant="body1"
                              color="text.secondary"
                              sx={{
                                mb: 2,
                                fontStyle: 'italic',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              "{step.text}"
                            </Typography>

                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mt: 'auto',
                              pt: 1
                            }}>
                              <Typography
                                variant="body2"
                                color="primary"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  ml: 'auto'
                                }}
                              >
                                Explore Step {step.number}
                                <ArrowForwardIcon sx={{ ml: 0.5, fontSize: '1rem' }} />
                              </Typography>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Grid>
                </Box>
              );
            })}

            {steps.length === 0 && !loading && !error && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No steps found. Please try refreshing the page.
              </Alert>
            )}

            <Box sx={{ mt: 6, p: 4, bgcolor: 'rgba(99,102,241,0.04)', borderRadius: 2, border: '1px solid rgba(99,102,241,0.1)' }}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                About the 12 Steps
              </Typography>
              <Typography variant="body1" paragraph>
                The Twelve Steps of Alcoholics Anonymous are a set of principles that outline a course of action for recovery from addiction, compulsion, or behavioral problems. Originally proposed by AA as a method of recovery from alcoholism, the Twelve Steps have been adapted widely by fellowships of people recovering from various addictions and dependencies.
              </Typography>
              <Typography variant="body1" paragraph>
                These steps are designed to be worked sequentially as a program of recovery. Each step builds on the previous ones, creating a spiritual and emotional framework for healing and personal growth.
              </Typography>
              <Typography variant="body1">
                This explorer provides a detailed look at each step, including the core text, interpretations, key points to understand, and resources for further study. Many steps also include references to daily reflections that specifically address that step.
              </Typography>
            </Box>

            <Box sx={{ mt: 6, p: 4, bgcolor: '#5DA6A7', borderRadius: 2, color: 'white', textAlign: 'center' }}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                Need Help with the Steps?
              </Typography>
              <Typography variant="body1" paragraph>
                Working through the steps can be challenging. Connect with a volunteer who can share their experience and guidance.
              </Typography>
              <Button
                component={Link}
                href="/chat"
                variant="contained"
                size="large"
                startIcon={<ChatIcon />}
                sx={{
                  bgcolor: 'white',
                  color: '#5DA6A7',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    color: '#4A8F90'
                  },
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Talk to a Volunteer
              </Button>
            </Box>
          </>
        )}
      </Container>
    </>
  );
}