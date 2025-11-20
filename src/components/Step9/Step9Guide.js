'use client';

import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import HelpIcon from '@mui/icons-material/Help';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function Step9Guide() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Guide to Step 9
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Understanding and working through the 9th Step of Alcoholics Anonymous.
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <FormatQuoteIcon
            sx={{
              fontSize: 40,
              mr: 2,
              transform: 'rotate(180deg)'
            }}
          />
          <Box>
            <Typography
              variant="h6"
              component="blockquote"
              sx={{
                fontStyle: 'italic',
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              "Made direct amends to such people wherever possible, except when to do so would injure them or others."
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              — Step 9, Alcoholics Anonymous
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Understanding Step 9
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Step 9 is where we put our willingness from Step 8 into action. After making our list of all persons
            we had harmed, we now take the crucial step of making direct amends to these people wherever possible,
            except when doing so would cause more harm than good.
          </Typography>

          <Typography paragraph>
            This step is about repairing relationships, cleaning up the past, and living according to new principles
            of honesty and responsibility. It's not just about saying "I'm sorry," but about making things right to
            the best of our ability.
          </Typography>

          <Typography paragraph>
            The phrase "except when to do so would injure them or others" is an important qualifier. It reminds us
            that the goal is healing, not causing further damage. Sometimes the most appropriate amends might be
            living differently or making indirect amends when direct contact would be harmful.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Big Book References
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <BookmarkIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Alcoholics Anonymous (Big Book)"
                secondary="Pages 76-84 (Chapter 6: 'Into Action')"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <BookmarkIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Twelve Steps and Twelve Traditions"
                secondary="Step Nine chapter"
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderLeft: 4, borderColor: 'primary.main', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              "Good judgment, a careful sense of timing, courage, and prudence—these are the qualities we shall need when we take Step Nine."
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              — Twelve Steps and Twelve Traditions, Step Nine
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Types of Amends
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            There are several different ways to make amends, depending on the situation:
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Direct Amends
                  </Typography>
                  <Typography variant="body2">
                    Face-to-face meetings where you take responsibility for your actions,
                    express regret, and make restitution where appropriate. These are usually
                    the most effective form of amends when possible.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Indirect Amends
                  </Typography>
                  <Typography variant="body2">
                    When direct contact is not possible or would cause harm, you can make
                    indirect amends by changing your behavior, helping others in similar
                    situations, or contributing to causes that person cared about.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Living Amends
                  </Typography>
                  <Typography variant="body2">
                    A commitment to live differently moving forward. This involves
                    changing behaviors and attitudes that caused harm in the first place.
                    Living amends are an ongoing process, not a one-time event.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Financial Amends
                  </Typography>
                  <Typography variant="body2">
                    Paying back money that was stolen, borrowed, or otherwise owed.
                    This might involve setting up a repayment plan and sticking to it
                    even if it takes time to complete.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Tips for Working Step 9
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Consult with your sponsor first"
                secondary="Before making any amends, discuss your plans with your sponsor to ensure your approach is appropriate."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Prioritize your amends list"
                secondary="Start with easier amends to build confidence, but don't indefinitely postpone the more difficult ones."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Focus on your part only"
                secondary="Amends are about your actions, not the other person's. Avoid blaming or discussing what they did wrong."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Be specific about the harm done"
                secondary="Clearly state what you did wrong without vague generalizations."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Make restitution when possible"
                secondary="If you stole or owe money, pay it back. If you damaged property, repair or replace it."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Accept the response you receive"
                secondary="Some people may not be ready to forgive you. Respect their feelings and don't expect or demand forgiveness."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Common Questions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              <HelpIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              What if the person doesn't want to see or talk to me?
            </Typography>
            <Typography variant="body2" sx={{ pl: 4 }}>
              Respect their boundaries. You can write a letter instead, or make indirect amends.
              The important thing is that you're willing to make things right, even if the other
              person isn't ready or willing to engage with you.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              <HelpIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              How do I make amends to someone who has passed away?
            </Typography>
            <Typography variant="body2" sx={{ pl: 4 }}>
              You can write a letter and read it at their gravesite, make donations to causes they cared about,
              or help their family members. Living amends—changing the behaviors that would have harmed this
              person—are particularly important in these cases.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              <HelpIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Should I make amends if it could result in legal consequences?
            </Typography>
            <Typography variant="body2" sx={{ pl: 4 }}>
              This is complex and should be discussed thoroughly with your sponsor and possibly a legal professional.
              Sometimes making indirect amends or waiting until you can make direct amends without severe
              consequences is the most prudent approach. The goal is to clean up your side of the street without
              creating new problems.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Alert
        severity="warning"
        icon={<ErrorOutlineIcon />}
        sx={{ mb: 3 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          When NOT to Make Direct Amends
        </Typography>
        <Typography variant="body2">
          • When doing so would injure the person or others<br />
          • When contacting someone would violate legal restrictions (e.g., restraining orders)<br />
          • When the person is actively harmful or abusive<br />
          • When it would reveal information that would hurt innocent third parties<br />
          • When your only motive is to relieve your guilt without regard for the other person
        </Typography>
      </Alert>

      <Paper sx={{ p: 3, bgcolor: 'info.light', color: 'info.contrastText', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FormatQuoteIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            A Promise from the Big Book
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ pl: 4, fontStyle: 'italic' }}>
          "If we are painstaking about this phase of our development, we will be amazed before we are half way through.
          We are going to know a new freedom and a new happiness. We will not regret the past nor wish to shut the door on it.
          We will comprehend the word serenity and we will know peace."
        </Typography>
      </Paper>
    </Box>
  );
}