'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Grid
} from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PageHeader from '@/components/PageHeader';

export default function CookiePolicyPage() {
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false
  });
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Load saved cookie preferences on component mount
  useEffect(() => {
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        if (parsedConsent.preferences) {
          setCookiePreferences(prevPreferences => ({
            ...prevPreferences,
            ...parsedConsent.preferences
          }));
          setSaved(true);
        }
      } catch (e) {
        // If parsing fails, keep default settings
        console.error('Error parsing saved cookie consent:', e);
      }
    }
  }, []);

  const handleChange = (event) => {
    setCookiePreferences({
      ...cookiePreferences,
      [event.target.name]: event.target.checked
    });
    setSaved(false);
  };

  const handleExpandChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: cookiePreferences
    }));
    setSaved(true);
    setShowSnackbar(true);
  };

  const handleAllowAll = () => {
    const allEnabled = {
      necessary: true,
      analytics: true,
      marketing: true
    };

    setCookiePreferences(allEnabled);
    localStorage.setItem('cookieConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: allEnabled
    }));

    setSaved(true);
    setShowSnackbar(true);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = {
      necessary: true,
      analytics: false,
      marketing: false
    };

    setCookiePreferences(essentialOnly);
    localStorage.setItem('cookieConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: essentialOnly
    }));

    setSaved(true);
    setShowSnackbar(true);
  };

  return (
    <>
      <PageHeader
        title="Cookie Policy"
        icon={<CookieIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Information about how we use cookies and similar technologies"
        breadcrumbs={[
          { label: 'Legal', href: '/legal' }
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', mb: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Our Cookie Policy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Last Updated: November 5, 2025
              </Typography>

              <Typography variant="body1" paragraph>
                This Cookie Policy explains how AA Companion ("we", "us", and "our") uses cookies and similar technologies
                to recognize you when you visit our website. It explains what these technologies are and why we use them,
                as well as your rights to control our use of them.
              </Typography>

              <Accordion expanded={expanded === 'panel1'} onChange={handleExpandChange('panel1')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" fontWeight={600}>What are cookies?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    Cookies are small text files that are placed on your computer or mobile device when you visit a website.
                    They are widely used in order to make websites work, or work more efficiently, as well as to provide
                    information to the owners of the site.
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Cookies allow a website to recognize your device. They are uniquely assigned to your device and can only
                    be read by a web server in the domain that issued the cookie to you.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'panel2'} onChange={handleExpandChange('panel2')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" fontWeight={600}>Why do we use cookies?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    We use cookies for several reasons. Some cookies are required for technical reasons in order for our
                    website to operate. We refer to these as "essential" or "strictly necessary" cookies.
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Other cookies enable us to track and target the interests of our users to enhance the experience on our website.
                    These are referred to as "analytics" or "performance" cookies.
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Third parties serve cookies through our website for advertising, analytics and other purposes.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'panel3'} onChange={handleExpandChange('panel3')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" fontWeight={600}>Types of cookies we use</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Essential Cookies
                  </Typography>
                  <Typography variant="body1" paragraph>
                    These cookies are strictly necessary to provide you with services available through our website and to use
                    some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver
                    the website, you cannot refuse them.
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Analytics Cookies
                  </Typography>
                  <Typography variant="body1" paragraph>
                    These cookies collect information that is used either in aggregate form to help us understand how our website
                    is being used or how effective our marketing campaigns are, or to help us customize our website for you.
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Marketing Cookies
                  </Typography>
                  <Typography variant="body1">
                    These cookies are used to make advertising messages more relevant to you. They perform functions like preventing
                    the same ad from continuously reappearing, ensuring that ads are properly displayed, and in some cases selecting
                    advertisements that are based on your interests.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'panel4'} onChange={handleExpandChange('panel4')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" fontWeight={600}>How can you control cookies?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences
                    by using the controls provided in the Cookie Preferences section below.
                  </Typography>
                  <Typography variant="body1" paragraph>
                    You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies,
                    you may still use our website, though your access to some functionality and areas of our website may be restricted.
                  </Typography>
                  <Typography variant="body1">
                    Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies,
                    including how to see what cookies have been set, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', position: 'sticky', top: 80 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Cookie Preferences
              </Typography>

              {saved && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Your cookie preferences have been saved
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your cookie preferences below. Essential cookies cannot be disabled as they are necessary for the website to function properly.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cookiePreferences.necessary}
                      disabled={true} // Always required
                      name="necessary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2">Essential Cookies</Typography>
                      <Typography variant="caption" color="text.secondary">Required for the website to function</Typography>
                    </Box>
                  }
                  sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={cookiePreferences.analytics}
                      onChange={handleChange}
                      name="analytics"
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2">Analytics Cookies</Typography>
                      <Typography variant="caption" color="text.secondary">Help us improve our website by collecting anonymous information</Typography>
                    </Box>
                  }
                  sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={cookiePreferences.marketing}
                      onChange={handleChange}
                      name="marketing"
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2">Marketing Cookies</Typography>
                      <Typography variant="caption" color="text.secondary">Used to deliver advertisements more relevant to you</Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', alignItems: 'flex-start' }}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSavePreferences}
                  fullWidth
                >
                  Save Preferences
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleAllowAll}
                  fullWidth
                >
                  Allow All
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleRejectNonEssential}
                  fullWidth
                  sx={{ borderColor: 'rgba(0, 0, 0, 0.23)', color: 'text.primary' }}
                >
                  Essential Only
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          message="Your cookie preferences have been saved"
        />
      </Container>
    </>
  );
}