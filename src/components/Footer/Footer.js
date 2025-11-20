'use client';

import { Box, Container, Grid, Typography, Link as MuiLink, Divider, useTheme, useMediaQuery } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        mt: 'auto',
        backgroundColor: 'background.default',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Image
                  src="/logo.png"
                  alt="AA Companion Logo"
                  width={32}
                  height={32}
                  style={{ objectFit: 'contain' }}
                />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ ml: 1, fontWeight: 700, fontFamily: 'var(--font-poppins)' }}
                >
                  AA Companion
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                align={isMobile ? "center" : "left"}
                sx={{ mb: 2, maxWidth: 280 }}
              >
                A modern digital companion for the recovery community, providing daily reflections and tools for your journey.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom align={isMobile ? "center" : "left"}>
              Explore
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
              <MuiLink component={Link} href="/" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Home
              </MuiLink>
              <MuiLink component={Link} href="/today" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Daily Reflection
              </MuiLink>
              <MuiLink component={Link} href="/resources" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Resources
              </MuiLink>
              <MuiLink component={Link} href="/search" color="text.secondary" underline="hover">
                Search
              </MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom align={isMobile ? "center" : "left"}>
              Tools
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
              <MuiLink component={Link} href="/journal" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Journal
              </MuiLink>
              <MuiLink component={Link} href="/sobriety" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Sobriety Tracker
              </MuiLink>
              <MuiLink component={Link} href="/assistant" color="text.secondary" underline="hover">
                Recovery Assistant
              </MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom align={isMobile ? "center" : "left"}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
              <MuiLink component={Link} href="/legal/terms" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Terms of Service
              </MuiLink>
              <MuiLink component={Link} href="/legal/privacy" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Privacy Policy
              </MuiLink>
              <MuiLink component={Link} href="/legal/cookies" color="text.secondary" underline="hover" sx={{ mb: 1 }}>
                Cookie Policy
              </MuiLink>
              <MuiLink component={Link} href="/legal" color="text.secondary" underline="hover">
                All Legal Documents
              </MuiLink>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            align={isMobile ? "center" : "left"}
          >
            © {currentYear} AA Companion. All rights reserved.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align={isMobile ? "center" : "right"}
            sx={{ mt: { xs: 1, sm: 0 } }}
          >
            This application is not affiliated with Alcoholics Anonymous World Services, Inc.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}