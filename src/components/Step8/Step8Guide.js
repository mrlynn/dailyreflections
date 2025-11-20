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
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import HelpIcon from '@mui/icons-material/Help';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import WarningIcon from '@mui/icons-material/Warning';

export default function Step8Guide() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Guide to Step 8
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Understanding and working through the 8th Step of Alcoholics Anonymous.
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
              "Made a list of all persons we had harmed, and became willing to make amends to them all."
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              — Step 8, Alcoholics Anonymous
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Understanding Step 8
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Step 8 is about preparing to clean up the past. After taking our personal inventory in Step 4
            and acknowledging our wrongs in Step 5, we're now ready to list all the people we've harmed
            and become willing to make amends to them.
          </Typography>

          <Typography paragraph>
            This step has two distinct parts:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Making a list of all persons we've harmed"
                secondary="This includes both obvious and less obvious harms we've caused, directly or indirectly."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Becoming willing to make amends to them all"
                secondary="Willingness doesn't mean we'll make all amends immediately, but that we're open to making things right when appropriate."
              />
            </ListItem>
          </List>
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
                secondary="Pages 76-83 (Chapter 6: 'Into Action')"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <BookmarkIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Twelve Steps and Twelve Traditions"
                secondary="Step Eight chapter"
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderLeft: 4, borderColor: 'primary.main', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              "This is the beginning of the end of isolation from our fellows and from God."
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              — Twelve Steps and Twelve Traditions, Step Eight
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Tips for Working Step 8
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Start with your 4th Step inventory"
                secondary="Your list of resentments, fears, and sexual conduct from Step 4 is a good starting point for identifying people you've harmed."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Be thorough and honest"
                secondary="Include everyone you've harmed, even in small ways, and even if you feel they also harmed you."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Don't filter the list yet"
                secondary="Step 8 is about listing ALL persons harmed and becoming willing. In Step 9, you'll decide which amends are appropriate to actually make."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Include yourself on the list"
                secondary="Many alcoholics and addicts have also harmed themselves physically, financially, emotionally, and spiritually."
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Pray for willingness"
                secondary="If you're struggling to become willing to make amends to certain people, pray for the willingness to come."
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
              What if someone harmed me more than I harmed them?
            </Typography>
            <Typography variant="body2" sx={{ pl: 4 }}>
              Step 8 focuses on our part, regardless of what others may have done to us.
              Their actions are their responsibility; we're focusing on cleaning up our side of the street.
              Remember that resentment harms us more than it harms others.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              <HelpIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              How detailed should my list be?
            </Typography>
            <Typography variant="body2" sx={{ pl: 4 }}>
              For each person, note who they are, how you harmed them, and your current willingness level.
              It's also helpful to note the nature of the harm (financial, emotional, physical, etc.) as this
              will help with planning the appropriate amends in Step 9.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              <HelpIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              What if I can't become willing?
            </Typography>
            <Typography variant="body2" sx={{ pl: 4 }}>
              Willingness often comes gradually. Start by becoming "willing to become willing."
              Discuss your struggles with your sponsor, and consider what's blocking your willingness.
              Prayer and meditation can help overcome reluctance.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Paper sx={{ p: 3, bgcolor: 'warning.light', color: 'warning.contrastText', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <WarningIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Important Note
          </Typography>
        </Box>
        <Typography variant="body2">
          Step 8 is preparation for Step 9, where you'll make direct amends. Don't rush to make amends
          without completing this step fully and discussing your plan with your sponsor. Some amends
          require careful planning and timing to avoid causing further harm.
        </Typography>
      </Paper>
    </Box>
  );
}