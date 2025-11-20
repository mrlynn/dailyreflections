'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoIcon from '@mui/icons-material/Info';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ArticleIcon from '@mui/icons-material/Article';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import KeyIcon from '@mui/icons-material/Key';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PageHeader from '@/components/PageHeader';
import { alpha } from '@mui/material/styles';

export default function StepDetailPage() {
  const [stepNumber, setStepNumber] = useState(0);
  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Use the useParams hook to safely get params in Next.js 16
  const params = useParams();

  // Handle params correctly using the useParams hook
  useEffect(() => {
    if (params && params.number) {
      const num = parseInt(params.number, 10);
      if (!isNaN(num) && num >= 1 && num <= 12) {
        setStepNumber(num);
      } else {
        setError('Invalid step number. Steps must be between 1 and 12.');
      }
    }
  }, [params]);

  // Step data hardcoded to avoid API call issues
  const stepsData = [
    {
      number: 1,
      title: "Honesty",
      text: "We admitted we were powerless over alcohol—that our lives had become unmanageable.",
      longForm: "We admitted we were powerless over alcohol—that our lives had become unmanageable.",
      group: "Surrender and Foundation",
      groupDescription: "These steps are about honesty, humility, and trust.",
      image: "/images/step1.png",
      interpretations: [
        "Step 1 is about honesty. We finally see and admit that we cannot control our drinking or drug use, and that it's causing serious problems in our lives.",
        "This step is the foundation of recovery, recognizing that willpower alone is not enough to overcome addiction."
      ],
      keyPoints: [
        "Admitting powerlessness over alcohol/addiction",
        "Acknowledging that life has become unmanageable",
        "Breaking through denial",
        "Surrender as the beginning of recovery",
        "The paradox: strength through admitting weakness"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 1: Bill's Story" },
        { title: "AA Big Book", chapter: "Chapter 2: There Is A Solution" },
        { title: "AA Big Book", chapter: "Chapter 3: More About Alcoholism" },
        { title: "12 Steps and 12 Traditions", chapter: "Step One" }
      ],
      reflectionReferences: []
    },
    {
      number: 2,
      title: "Hope",
      text: "Came to believe that a Power greater than ourselves could restore us to sanity.",
      longForm: "Came to believe that a Power greater than ourselves could restore us to sanity.",
      group: "Surrender and Foundation",
      groupDescription: "These steps are about honesty, humility, and trust.",
      image: "/images/step2.png",
      interpretations: [
        "Step 2 is about finding hope. We start to believe that something greater than ourselves—whether it's a traditional concept of God, the AA group, or another higher power—can help us recover.",
        "This step introduces the spiritual element of recovery, suggesting that we need help beyond our own capabilities."
      ],
      keyPoints: [
        "Finding hope for recovery",
        "Open-mindedness to spiritual help",
        "Understanding 'insanity' as continued self-destructive behavior",
        "The concept of a Higher Power being personal to each individual",
        "Beginning to trust in something beyond oneself"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 4: We Agnostics" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Two" }
      ],
      reflectionReferences: []
    },
    {
      number: 3,
      title: "Faith",
      text: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
      longForm: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
      group: "Surrender and Foundation",
      groupDescription: "These steps are about honesty, humility, and trust.",
      image: "/images/step3.png",
      interpretations: [
        "Step 3 is about making a decision to trust a higher power. We choose to put our recovery and our lives in the care of our higher power, however we understand it.",
        "This step involves surrendering control and trusting in the recovery process and spiritual principles."
      ],
      keyPoints: [
        "Making a decision to trust",
        "Surrendering self-will",
        "The phrase 'God as we understood Him' emphasizing personal spiritual choice",
        "The Third Step Prayer",
        "Moving from intellectual understanding to active commitment"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 5: How It Works" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Three" }
      ],
      reflectionReferences: []
    },
    {
      number: 4,
      title: "Courage",
      text: "Made a searching and fearless moral inventory of ourselves.",
      longForm: "Made a searching and fearless moral inventory of ourselves.",
      group: "Inventory and Change",
      groupDescription: "These are the housecleaning steps.",
      image: "/images/step4.png",
      interpretations: [
        "Step 4 is about self-examination. We take a thorough look at our behaviors, thoughts, and emotions, especially focusing on resentments, fears, and harms done.",
        "This step requires courage to honestly examine our character defects and patterns that have contributed to our addiction."
      ],
      keyPoints: [
        "Thorough self-examination",
        "Identifying patterns in behavior and thinking",
        "Understanding the role of resentment in addiction",
        "Recognizing character defects",
        "The importance of being thorough and honest"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 5: How It Works" },
        { title: "AA Big Book", chapter: "Step 4 Inventory Guide (Appendix)" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Four" }
      ],
      reflectionReferences: []
    },
    {
      number: 5,
      title: "Integrity",
      text: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
      longForm: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
      group: "Inventory and Change",
      groupDescription: "These are the housecleaning steps.",
      image: "/images/step5.png",
      interpretations: [
        "Step 5 is about confession. We share our inventory with our higher power, ourselves, and another person, usually a sponsor.",
        "This step helps break the isolation of addiction and begin the process of healing through honesty and vulnerability."
      ],
      keyPoints: [
        "Breaking the isolation of secrets",
        "Experiencing acceptance and forgiveness",
        "Seeing patterns more clearly through verbalization",
        "Sharing with someone who understands the process",
        "The relief that comes from complete honesty"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Five" }
      ],
      reflectionReferences: []
    },
    {
      number: 6,
      title: "Willingness",
      text: "Were entirely ready to have God remove all these defects of character.",
      longForm: "Were entirely ready to have God remove all these defects of character.",
      group: "Inventory and Change",
      groupDescription: "These are the housecleaning steps.",
      image: "/images/step6.png",
      interpretations: [
        "Step 6 is about willingness to change. After identifying our character defects in Steps 4 and 5, we become ready to let them go.",
        "This step involves becoming willing to change and grow, recognizing that our character defects no longer serve us in recovery."
      ],
      keyPoints: [
        "Willingness to change",
        "Recognizing character defects that hurt ourselves and others",
        "The difference between intellectual willingness and emotional readiness",
        "Understanding that this is a process, not perfection",
        "Becoming ready to let go of old patterns"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Six" }
      ],
      reflectionReferences: []
    },
    {
      number: 7,
      title: "Humility",
      text: "Humbly asked Him to remove our shortcomings.",
      longForm: "Humbly asked Him to remove our shortcomings.",
      group: "Inventory and Change",
      groupDescription: "These are the housecleaning steps.",
      image: "/images/step7.png",
      interpretations: [
        "Step 7 is about humility. We ask our higher power to help remove our character defects.",
        "This step acknowledges that we need help beyond our own efforts to truly change our deep-seated patterns."
      ],
      keyPoints: [
        "The central importance of humility in recovery",
        "Asking for help to change",
        "The Seventh Step Prayer",
        "Understanding that removal of defects happens gradually",
        "Transformation through surrender and acceptance"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Seven" }
      ],
      reflectionReferences: []
    },
    {
      number: 8,
      title: "Brotherly Love",
      text: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
      longForm: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
      group: "Making Amends",
      groupDescription: "These are the relationship steps.",
      image: "/images/step8.png",
      interpretations: [
        "Step 8 is about preparing for amends. We list all the people we've harmed and become willing to make amends to them.",
        "This step helps us take responsibility for our past actions and prepares us for the direct amends in Step 9."
      ],
      keyPoints: [
        "Taking responsibility for past actions",
        "Recognizing the full extent of harm done to others",
        "Becoming willing to make amends, even to those who have harmed us",
        "Developing empathy for those we've hurt",
        "Preparing mentally and emotionally for the amends process"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Eight" }
      ],
      reflectionReferences: []
    },
    {
      number: 9,
      title: "Justice",
      text: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
      longForm: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
      group: "Making Amends",
      groupDescription: "These are the relationship steps.",
      image: "/images/step9.png",
      interpretations: [
        "Step 9 is about making amends. We directly address the harms we've caused others, except when doing so would cause more harm.",
        "This step allows us to clear away the wreckage of our past and rebuild relationships based on honesty and responsibility."
      ],
      keyPoints: [
        "Making direct amends whenever possible",
        "Different types of amends: direct, living, and indirect",
        "The wisdom in 'except when to do so would injure them or others'",
        "The timing and approach of making amends",
        "The freedom that comes from taking responsibility"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Nine" }
      ],
      reflectionReferences: []
    },
    {
      number: 10,
      title: "Perseverance",
      text: "Continued to take personal inventory and when we were wrong promptly admitted it.",
      longForm: "Continued to take personal inventory and when we were wrong promptly admitted it.",
      group: "Daily Maintenance and Service",
      groupDescription: "These steps are how we live the program.",
      image: "/images/step10.png",
      interpretations: [
        "Step 10 is about maintaining awareness. We continue to watch for problematic behaviors and attitudes, and promptly address them.",
        "This step establishes an ongoing practice of self-examination and accountability that supports long-term recovery."
      ],
      keyPoints: [
        "Daily self-examination",
        "Promptly admitting wrongs",
        "The concept of the 'spot-check inventory'",
        "Making amends quickly to maintain serenity",
        "Building the habit of continuous self-awareness"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 6: Into Action" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Ten" }
      ],
      reflectionReferences: []
    },
    {
      number: 11,
      title: "Spirituality",
      text: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
      longForm: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
      group: "Daily Maintenance and Service",
      groupDescription: "These steps are how we live the program.",
      image: "/images/step11.png",
      interpretations: [
        "Step 11 is about spiritual connection. We develop practices like prayer and meditation to strengthen our relationship with our higher power.",
        "This step focuses on seeking guidance and strength for recovery, rather than trying to control outcomes."
      ],
      keyPoints: [
        "Developing a spiritual practice",
        "The complementary roles of prayer and meditation",
        "Seeking guidance rather than specific outcomes",
        "Creating conscious contact with one's higher power",
        "The practical aspects of spiritual growth"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 11: A Vision For You" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Eleven" }
      ],
      reflectionReferences: []
    },
    {
      number: 12,
      title: "Service",
      text: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.",
      longForm: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.",
      group: "Daily Maintenance and Service",
      groupDescription: "These steps are how we live the program.",
      image: "/images/step12.png",
      interpretations: [
        "Step 12 is about helping others and living the principles. Having experienced the benefits of the program, we help others who still suffer and apply these principles in all aspects of our lives.",
        "This step completes the cycle of recovery, from being helped to helping others, and extends recovery principles beyond addiction into daily living."
      ],
      keyPoints: [
        "The nature of spiritual awakening",
        "Carrying the message to others who still suffer",
        "Service as essential to maintaining recovery",
        "Applying program principles to all life areas",
        "Living a life of continued growth and service"
      ],
      resources: [
        { title: "AA Big Book", chapter: "Chapter 7: Working With Others" },
        { title: "AA Big Book", chapter: "Chapter 11: A Vision For You" },
        { title: "12 Steps and 12 Traditions", chapter: "Step Twelve" }
      ],
      reflectionReferences: []
    }
  ];

  useEffect(() => {
    if (stepNumber >= 1 && stepNumber <= 12) {
      setLoading(true);
      // Find the step in our hardcoded data
      const foundStep = stepsData.find(s => s.number === stepNumber);
      if (foundStep) {
        setStep(foundStep);
        setError(null);
      } else {
        setError(`Step ${stepNumber} data not found`);
      }
      setLoading(false);
    } else {
      setError('Invalid step number. Steps must be between 1 and 12.');
      setLoading(false);
    }
  }, [stepNumber]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Function to navigate to the previous or next step
  const navigateStep = (direction) => {
    let nextStep = stepNumber;

    if (direction === 'prev' && stepNumber > 1) {
      nextStep = stepNumber - 1;
    } else if (direction === 'next' && stepNumber < 12) {
      nextStep = stepNumber + 1;
    }

    if (nextStep !== stepNumber) {
      router.push(`/steps/${nextStep}`);
    }
  };

  // Format dateKey (MM-DD) to readable format (Month Day)
  const formatDateKey = (dateKey) => {
    if (!dateKey) return '';

    const [month, day] = dateKey.split('-').map(Number);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return `${monthNames[month - 1]} ${day}`;
  };

  // Get color for the step
  const getStepColor = (num) => {
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
    return colors[(num - 1) % colors.length];
  };

  if (loading || error || !step) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const headerOverlay = step
    ? `linear-gradient(135deg, ${alpha(getStepColor(step.number), 0.82)} 0%, rgba(17,25,30,0.75) 100%)`
    : undefined;
  const useLightText = Boolean(step?.image);

  return (
    <>
      <PageHeader
        title={`Step ${step.number}: ${step.title}`}
        icon={
          <Box
            sx={{
              bgcolor: getStepColor(step.number),
              color: 'white',
              width: { xs: '2.5rem', md: '3rem' },
              height: { xs: '2.5rem', md: '3rem' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 'bold'
            }}
          >
            {step.number}
          </Box>
        }
        subtitle={`"${step.text}"`}
        breadcrumbs={[
          { label: '12 Steps Explorer', href: '/steps' }
        ]}
        backgroundImage={step.image}
        backgroundOverlay={headerOverlay}
        invertText={useLightText}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigateStep('prev')}
                disabled={stepNumber === 1}
              >
                Previous Step
              </Button>
              <Button
                component={Link}
                href="/steps"
                variant="outlined"
              >
                All Steps
              </Button>
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigateStep('next')}
                disabled={stepNumber === 12}
              >
                Next Step
              </Button>
            </Box>

            {/* Tabs for different sections */}
            <Paper sx={{ mb: 4, borderRadius: 2 }} elevation={2}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabIndex}
                  onChange={handleTabChange}
                  variant={isMobile ? "scrollable" : "fullWidth"}
                  scrollButtons="auto"
                  aria-label="step details tabs"
                >
                  <Tab icon={<InfoIcon />} label="Overview" id="tab-0" aria-controls="tabpanel-0" />
                  <Tab icon={<LightbulbIcon />} label="Interpretations" id="tab-1" aria-controls="tabpanel-1" />
                  <Tab icon={<KeyIcon />} label="Key Points" id="tab-2" aria-controls="tabpanel-2" />
                  <Tab icon={<LibraryBooksIcon />} label="Resources" id="tab-3" aria-controls="tabpanel-3" />
                  <Tab icon={<CalendarMonthIcon />} label="Daily Reflections" id="tab-4" aria-controls="tabpanel-4" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box p={3}>
                {/* Overview Tab */}
                <Box role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0">
                  {tabIndex === 0 && (
                    <>
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        Step {step.number}: {step.title}
                      </Typography>

                      {/* Steps as a Journey - Group Context */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          mb: 4,
                          bgcolor: 'rgba(99,102,241,0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(99,102,241,0.15)'
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: getStepColor(step.number) }}>
                          {step.group}
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {step.groupDescription} This step is part of the {step.group.toLowerCase()} phase of recovery.
                        </Typography>
                        <Typography variant="body1">
                          The Steps aren't just a checklist to complete—they're more like a spiral staircase. You'll keep circling back to this step throughout your recovery, often with a new level of awareness each time.
                        </Typography>
                      </Paper>

                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          mb: 4,
                          bgcolor: 'rgba(99,102,241,0.05)',
                          borderLeft: 4,
                          borderColor: getStepColor(step.number),
                          borderRadius: 2
                        }}
                      >
                        <Box sx={{ display: 'flex' }}>
                          <FormatQuoteIcon
                            sx={{
                              fontSize: 40,
                              color: 'text.secondary',
                              mr: 2,
                              transform: 'rotate(180deg)'
                            }}
                          />
                          <Typography
                            variant="h6"
                            component="blockquote"
                            sx={{
                              fontStyle: 'italic',
                              lineHeight: 1.6,
                              fontWeight: 400,
                            }}
                          >
                            {step.text}
                          </Typography>
                        </Box>
                      </Paper>

                      {step.longForm && step.longForm !== step.text && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Long Form
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {step.longForm}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
                        About this Step
                      </Typography>

                      <Typography variant="body1" paragraph>
                        Step {step.number} is known as the step of <strong>{step.title}</strong>. It is a critical part of the recovery process that helps individuals {step.number <= 3 ? 'begin their recovery journey' : step.number <= 9 ? 'actively work on their recovery' : 'maintain their recovery'}.
                      </Typography>

                      <Typography variant="body1" paragraph>
                        {step.interpretations && step.interpretations[0]}
                      </Typography>

                      <Box sx={{ mt: 4 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Where this step fits in the recovery process:
                        </Typography>

                        <Box sx={{ position: 'relative', width: '100%', height: '60px', mb: 3 }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '10px',
                              bgcolor: 'grey.300',
                              borderRadius: '5px'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              height: '10px',
                              width: `${(step.number / 12) * 100}%`,
                              bgcolor: getStepColor(step.number),
                              borderRadius: '5px'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '20px',
                              left: `${(step.number / 12) * 100}%`,
                              transform: 'translateX(-50%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center'
                            }}
                          >
                            <Box
                              sx={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                bgcolor: getStepColor(step.number),
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}
                            >
                              {step.number}
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Start
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Completion
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>

                {/* Interpretations Tab */}
                <Box role="tabpanel" hidden={tabIndex !== 1} id="tabpanel-1" aria-labelledby="tab-1">
                  {tabIndex === 1 && (
                    <>
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        Interpretations of Step {step.number}
                      </Typography>

                      <Typography variant="body1" paragraph>
                        There are various ways to understand and work with this step. Here are some common interpretations:
                      </Typography>

                      <List>
                        {step.interpretations.map((interpretation, index) => (
                          <ListItem key={index} alignItems="flex-start" sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                            <ListItemIcon sx={{ mt: 0 }}>
                              <LightbulbIcon sx={{ color: getStepColor(step.number) }} />
                            </ListItemIcon>
                            <ListItemText primary={interpretation} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>

                {/* Key Points Tab */}
                <Box role="tabpanel" hidden={tabIndex !== 2} id="tabpanel-2" aria-labelledby="tab-2">
                  {tabIndex === 2 && (
                    <>
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        Key Points of Step {step.number}
                      </Typography>

                      <Typography variant="body1" paragraph>
                        When working through this step, keep these important points in mind:
                      </Typography>

                      <Grid container spacing={2}>
                        {step.keyPoints.map((point, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <Card sx={{
                              height: '100%',
                              display: 'flex',
                              bgcolor: 'background.paper',
                              borderLeft: 3,
                              borderColor: getStepColor(step.number)
                            }}>
                              <CardContent>
                                <Typography variant="body1">{point}</Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </Box>

                {/* Resources Tab */}
                <Box role="tabpanel" hidden={tabIndex !== 3} id="tabpanel-3" aria-labelledby="tab-3">
                  {tabIndex === 3 && (
                    <>
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        Resources for Step {step.number}
                      </Typography>

                      <Typography variant="body1" paragraph>
                        These resources provide deeper insights into working Step {step.number}:
                      </Typography>

                      <List>
                        {step.resources.map((resource, index) => (
                          <ListItem key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                            <ListItemIcon>
                              <LibraryBooksIcon sx={{ color: getStepColor(step.number) }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={resource.title}
                              secondary={resource.chapter}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>

                {/* Daily Reflections Tab */}
                <Box role="tabpanel" hidden={tabIndex !== 4} id="tabpanel-4" aria-labelledby="tab-4">
                  {tabIndex === 4 && (
                    <>
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        Daily Reflections about Step {step.number}
                      </Typography>

                      {step.reflectionReferences && step.reflectionReferences.length > 0 ? (
                        <>
                          <Typography variant="body1" paragraph>
                            These daily reflections specifically address Step {step.number}:
                          </Typography>

                          <Grid container spacing={3}>
                            {step.reflectionReferences.map((reflection, index) => {
                              const dateKey = `${String(reflection.month).padStart(2, '0')}-${String(reflection.day).padStart(2, '0')}`;
                              return (
                                <Grid item xs={12} md={6} key={index}>
                                  <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 600 }}>
                                          {reflection.title}
                                        </Typography>
                                        <Chip
                                          icon={<CalendarMonthIcon />}
                                          label={formatDateKey(dateKey)}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                        />
                                      </Box>
                                      <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                                        {reflection.quote?.substring(0, 100)}...
                                      </Typography>
                                      <Button
                                        component={Link}
                                        href={`/${dateKey}`}
                                        variant="outlined"
                                        size="small"
                                        endIcon={<ArrowForwardIcon />}
                                      >
                                        Read Reflection
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </>
                      ) : (
                        <Alert severity="info">
                          No specific daily reflections found for Step {step.number}.
                        </Alert>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Additional Information */}
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={1}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Suggested Ways to Work Step {step.number}
              </Typography>
              <Typography variant="body1" paragraph>
                Working through Step {step.number} is a personal journey. Here are some suggested approaches:
              </Typography>
              <List>
                {step.number === 1 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Write down specific examples of how alcohol has made your life unmanageable" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Discuss with your sponsor times when you tried to control your drinking but couldn't" />
                    </ListItem>
                  </>
                )}
                {step.number === 2 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Reflect on what 'Higher Power' means to you personally" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Consider examples of when you've seen recovery work for others" />
                    </ListItem>
                  </>
                )}
                {step.number === 3 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Practice the Third Step Prayer daily" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Discuss with your sponsor what 'turning it over' means in practical terms" />
                    </ListItem>
                  </>
                )}
                {step.number === 4 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span>Use the 4th Step Inventory tool in this app</span>
                            <Button
                              component={Link}
                              href="/step4"
                              variant="contained"
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            >
                              Open 4th Step Tool
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Follow the columns approach outlined in the Big Book" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span>Manage multiple inventories or continue an existing one</span>
                            <Button
                              component={Link}
                              href="/step4/manage"
                              variant="outlined"
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              Manage Inventories
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                  </>
                )}
                {step.number === 5 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Choose a trusted sponsor or spiritual advisor to share your inventory with" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Set aside uninterrupted time in a private location" />
                    </ListItem>
                  </>
                )}
                {step.number === 6 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Make a list of character defects from your 4th Step inventory" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Reflect on how each defect has affected your life and recovery" />
                    </ListItem>
                  </>
                )}
                {step.number === 7 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Practice the Seventh Step Prayer daily" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Focus on developing humility in daily situations" />
                    </ListItem>
                  </>
                )}
                {step.number === 8 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span>Create a comprehensive list of people harmed, using your 4th Step as a starting point</span>
                            <Button
                              component={Link}
                              href="/step4"
                              variant="contained"
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            >
                              Review 4th Step Harms
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span>For each person, note specifically how you harmed them and how you might make amends</span>
                            <Button
                              component={Link}
                              href="/journal/new"
                              variant="outlined"
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              Use Journal for List
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                  </>
                )}
                {step.number === 9 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Discuss with your sponsor the best approach for each amend" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Consider direct, living, and indirect amends as appropriate for each situation" />
                    </ListItem>
                  </>
                )}
                {step.number === 10 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Develop a daily practice of examining your behavior" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span>Use the Journal feature in this app for your daily inventory</span>
                            <Button
                              component={Link}
                              href="/journal"
                              variant="contained"
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            >
                              Open Journal
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span>Create a new journal entry for today's inventory</span>
                            <Button
                              component={Link}
                              href="/journal/new"
                              variant="outlined"
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              New Entry
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                  </>
                )}
                {step.number === 11 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Set aside time each morning and evening for prayer/meditation" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Try different meditation techniques to see what works best for you" />
                    </ListItem>
                  </>
                )}
                {step.number === 12 && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Volunteer for service positions in your home group" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Look for opportunities to share your experience with newcomers" />
                    </ListItem>
                  </>
                )}
              </List>
            </Paper>

            {/* Step Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant={stepNumber === 1 ? "outlined" : "contained"}
                color={stepNumber === 1 ? "inherit" : "primary"}
                startIcon={<ArrowBackIcon />}
                onClick={() => navigateStep('prev')}
                disabled={stepNumber === 1}
              >
                Previous: Step {stepNumber - 1}
              </Button>
              <Button
                component={Link}
                href="/steps"
                variant="outlined"
              >
                All Steps
              </Button>
              <Button
                variant={stepNumber === 12 ? "outlined" : "contained"}
                color={stepNumber === 12 ? "inherit" : "primary"}
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigateStep('next')}
                disabled={stepNumber === 12}
              >
                Next: Step {stepNumber + 1}
              </Button>
            </Box>
          </>
        )}
      </Container>
    </>
  );
}