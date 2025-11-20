'use client';

import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import CookieIcon from '@mui/icons-material/Cookie';
import PageHeader from '@/components/PageHeader';

export default function LegalPage() {
  const router = useRouter();

  const legalDocuments = [
    {
      title: 'Terms of Service',
      description: 'The rules and guidelines for using our platform',
      icon: <GavelIcon fontSize="large" sx={{ color: 'primary.main' }} />,
      path: '/legal/terms'
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your data',
      icon: <PrivacyTipIcon fontSize="large" sx={{ color: 'primary.main' }} />,
      path: '/legal/privacy'
    },
    {
      title: 'Cookie Policy',
      description: 'Information about how we use cookies and similar technologies',
      icon: <CookieIcon fontSize="large" sx={{ color: 'primary.main' }} />,
      path: '/legal/cookies'
    }
  ];

  return (
    <>
      <PageHeader
        title="Legal Information"
        icon={<GavelIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Important legal documents and policies"
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
            Our Legal Documents
          </Typography>
          <Typography variant="body1" paragraph>
            At AA Companion, we are committed to transparency and protecting your rights. The following documents outline
            our legal terms, privacy practices, and cookie policies. We encourage you to read these documents to understand
            how we operate and protect your information.
          </Typography>
          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            {legalDocuments.map((doc, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(-4px)',
                    }
                  }}
                >
                  <CardActionArea
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    onClick={() => router.push(doc.path)}
                  >
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 4 }}>
                      <Box sx={{ mb: 2 }}>
                        {doc.icon}
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
                        {doc.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {doc.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
            Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about our legal documents or policies, please contact us at:
          </Typography>
          <Box component="address" sx={{ fontStyle: 'normal' }}>
            <Typography variant="body1">
              Email: mike@aacompanion.com<br />
              AA Companion<br />
              <br />
              Newtown, PA 18940
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}