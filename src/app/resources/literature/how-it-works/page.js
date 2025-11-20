'use client';

import React from 'react';
import { Typography, Paper, Box, Container, Divider, Button, Stack } from '@mui/material';
import PageHeader from '@/components/PageHeader';
import ArticleIcon from '@mui/icons-material/Article';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How It Works"
        icon={<ArticleIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="From pages 58-60 of the Big Book that outlines the core principles of AA recovery"
        breadcrumbs={[
          { label: 'Resources', href: '/resources' },
          { label: 'Literature', href: '/resources/literature' }
        ]}
      />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: '12px' }}>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
          Rarely have we seen a person fail who has thoroughly followed our path. Those who do not recover are people who cannot or will not completely give themselves to this simple program, usually men and women who are constitutionally incapable of being honest with themselves. There are such unfortunates. They are not at fault; they seem to have been born that way. They are naturally incapable of grasping and developing a manner of living which demands rigorous honesty. Their chances are less than average. There are those, too, who suffer from grave emotional and mental disorders, but many of them do recover if they have the capacity to be honest.
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
          Our stories disclose in a general way what we used to be like, what happened, and what we are like now. If you have decided you want what we have and are willing to go to any length to get it — then you are ready to take certain steps.
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
          At some of these we balked. We thought we could find an easier, softer way. But we could not. With all the earnestness at our command, we beg of you to be fearless and thorough from the very start. Some of us have tried to hold on to our old ideas and the result was nil until we let go absolutely.
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
          Remember that we deal with alcohol — cunning, baffling, powerful! Without help it is too much for us. But there is One who has all power — that One is God. May you find Him now!
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
          Half measures availed us nothing. We stood at the turning point. We asked His protection and care with complete abandon.
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 4, fontWeight: 500 }}>
          Here are the steps we took, which are suggested as a program of recovery:
        </Typography>

        <Box component="ol" sx={{ pl: { xs: 2, sm: 4 }, mb: 4 }}>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            We admitted we were powerless over alcohol — that our lives had become unmanageable.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Came to believe that a Power greater than ourselves could restore us to sanity.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Made a decision to turn our will and our lives over to the care of God as we understood Him.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Made a searching and fearless moral inventory of ourselves.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Were entirely ready to have God remove all these defects of character.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Humbly asked Him to remove our shortcomings.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Made a list of all persons we had harmed, and became willing to make amends to them all.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Made direct amends to such people wherever possible, except when to do so would injure them or others.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Continued to take personal inventory and when we were wrong promptly admitted it.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.
          </Typography>
        </Box>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
          Many of us exclaimed, "What an order! I can't go through with it." Do not be discouraged. No one among us has been able to maintain anything like perfect adherence to these principles. We are not saints. The point is, that we are willing to grow along spiritual lines. The principles we have set down are guides to progress. We claim spiritual progress rather than spiritual perfection.
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
          Our description of the alcoholic, the chapter to the agnostic, and our personal adventures before and after make clear three pertinent ideas:
        </Typography>

        <Box component="ul" sx={{ pl: { xs: 2, sm: 4 }, mb: 4 }}>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            (a) That we were alcoholic and could not manage our own lives.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            (b) That probably no human power could have relieved our alcoholism.
          </Typography>
          <Typography component="li" variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
            (c) That God could and would if He were sought.
          </Typography>
        </Box>

        {/* PDF and external link buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mt: 4, mb: 3 }}
        >
          <Button
            component="a"
            href="https://www.aa.org/sites/default/files/literature/assets/p-10_howitworks.pdf"
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size="large"
            startIcon={<PictureAsPdfIcon />}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Download Official PDF
          </Button>
          <Button
            component="a"
            href="https://www.aa.org/the-big-book"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="large"
            sx={{ textTransform: 'none' }}
          >
            Visit AA.org
          </Button>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Reprinted from pages 58-60 in the book Alcoholics Anonymous.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6, mt: 1 }}>
            Copyright © by Alcoholics Anonymous World Services, Inc. 1939, 1955, 1976, 2001.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6, mt: 1 }}>
            www.aa.org
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6, mt: 3, fontStyle: 'italic' }}>
            Limited excerpts from "Alcoholics Anonymous," pages 58-60, reprinted with permission of
            Alcoholics Anonymous World Services, Inc. ("AAWS"). Permission to reprint these excerpts
            does not mean that AAWS has reviewed or approved the contents of this publication, or
            that AAWS necessarily agrees with the views expressed herein. A.A. is a program of
            recovery from alcoholism only - use of these excerpts in connection with programs and
            activities which are patterned after A.A., but which address other problems, or in any
            other non-A.A. context, does not imply otherwise.
          </Typography>
        </Box>
      </Paper>
    </Container>
    </>
  );
}
