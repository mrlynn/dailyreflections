'use client';

import { Container, Box, Typography, Paper, Button, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from '@/components/PageHeader';

export default function PromisesPage() {
  return (
    <>
      <PageHeader
        title="The Promises"
        icon={<FormatQuoteIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="The 9th Step Promises from the Big Book of Alcoholics Anonymous (pages 83-84)"
        backgroundImage="/images/tracker.png"
        backgroundImageStyles={{
          backgroundPosition: '50% 25%',
          backgroundSize: 'cover',
          opacity: 0.95,
        }}
        backgroundOverlay="linear-gradient(135deg, rgba(228,185,91,0.75) 0%, rgba(93,166,167,0.8) 100%)"
        invertText={true}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Home
          </MuiLink>
          <MuiLink component={Link} href="/resources" underline="hover">
            Resources
          </MuiLink>
          <MuiLink component={Link} href="/resources?type=literature" underline="hover">
            Literature
          </MuiLink>
          <Typography color="text.primary">The Promises</Typography>
        </Breadcrumbs>

        <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            The Promises
          </Typography>

          <Typography variant="body1" paragraph>
            If we are painstaking about this phase of our development, we will be amazed before we are half way through.
          </Typography>

          <Typography variant="body1" paragraph>
            We are going to know a new freedom and a new happiness.
          </Typography>

          <Typography variant="body1" paragraph>
            We will not regret the past nor wish to shut the door on it.
          </Typography>

          <Typography variant="body1" paragraph>
            We will comprehend the word serenity and we will know peace.
          </Typography>

          <Typography variant="body1" paragraph>
            No matter how far down the scale we have gone, we will see how our experience can benefit others.
          </Typography>

          <Typography variant="body1" paragraph>
            That feeling of uselessness and self-pity will disappear.
          </Typography>

          <Typography variant="body1" paragraph>
            We will lose interest in selfish things and gain interest in our fellows.
          </Typography>

          <Typography variant="body1" paragraph>
            Self-seeking will slip away.
          </Typography>

          <Typography variant="body1" paragraph>
            Our whole attitude and outlook upon life will change.
          </Typography>

          <Typography variant="body1" paragraph>
            Fear of people and of economic insecurity will leave us.
          </Typography>

          <Typography variant="body1" paragraph>
            We will intuitively know how to handle situations which used to baffle us.
          </Typography>

          <Typography variant="body1" paragraph>
            We will suddenly realize that God is doing for us what we could not do for ourselves.
          </Typography>

          <Typography variant="body1" paragraph>
            Are these extravagant promises? We think not. They are being fulfilled among us—sometimes quickly, sometimes slowly. They will always materialize if we work for them.
          </Typography>

          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
            From the Big Book of Alcoholics Anonymous, pages 83-84
          </Typography>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              component="a"
              href="/pdf/The_AA_Promises.pdf"
              target="_blank"
              startIcon={<DownloadIcon />}
              sx={{ mr: 2 }}
            >
              View PDF
            </Button>
          </Box>
        </Paper>

        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            The Promises appear on pages 83-84 of the Big Book of Alcoholics Anonymous, in the chapter "Into Action" which discusses Step Nine. These promises describe the changes that occur in a person's life when they work through the 12 Steps, particularly as they complete making amends to those they have harmed.
          </Typography>
        </Paper>
      </Container>
    </>
  );
}