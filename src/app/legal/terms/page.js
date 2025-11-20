'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Link from 'next/link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelIcon from '@mui/icons-material/Gavel';
import PageHeader from '@/components/PageHeader';

export default function TermsOfServicePage() {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const lastUpdated = "November 5, 2025";

  return (
    <>
      <PageHeader
        title="Terms of Service"
        icon={<GavelIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Please read our Terms of Service carefully"
        breadcrumbs={[
          { label: 'Legal', href: '/legal' }
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Last Updated: {lastUpdated}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Welcome to AA Companion ("we," "our," or "us"). By accessing or using our website, mobile application,
              and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, please do not use our Services.
            </Typography>
          </Box>

          <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>1. Acceptance of Terms</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms.
                We may modify these Terms at any time, and your continued use of our Services following any changes constitutes your acceptance
                of the modified Terms.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>2. Eligibility</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                You must be at least 13 years old to use our Services. If you are under 18, you represent that you have your parent
                or guardian's permission to use the Services. Please have them read these Terms with you.
              </Typography>
              <Typography variant="body1">
                If you are accepting these Terms on behalf of a company or other legal entity, you represent that you have the
                authority to bind such entity to these Terms.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>3. User Accounts</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                To access certain features of our Services, you may need to create an account. You are responsible for maintaining
                the confidentiality of your account credentials and for all activities that occur under your account.
              </Typography>
              <Typography variant="body1" paragraph>
                You agree to provide accurate and complete information when creating an account and to update your information
                to keep it accurate and complete. You are solely responsible for any activity that occurs through your account.
              </Typography>
              <Typography variant="body1">
                We reserve the right to disable any user account at any time, including if you have failed to comply with any provision
                of these Terms or if activities occur on your account which, in our sole discretion, would or might cause damage
                to or impair the Services or infringe or violate any third party's rights.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>4. Privacy</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Our Privacy Policy, available at {' '}
                <MuiLink component={Link} href="/legal/privacy">
                  /legal/privacy
                </MuiLink>
                , describes how we collect, use, and share your personal information. By using our Services, you consent to our
                collection, use, and sharing of information as described in our Privacy Policy.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>5. User Content</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Our Services may allow you to post, link, store, share and otherwise make available certain information, text,
                graphics, videos, or other material ("User Content"). You are responsible for the User Content that you post,
                including its legality, reliability, and appropriateness.
              </Typography>
              <Typography variant="body1" paragraph>
                By posting User Content, you grant us the right to use, modify, publicly perform, publicly display, reproduce,
                and distribute such content on and through our Services. You retain any and all of your rights to any User Content
                you submit, post or display on or through the Services and you are responsible for protecting those rights.
              </Typography>
              <Typography variant="body1">
                We reserve the right to remove any User Content from our Services at any time, for any reason, without prior
                notice or liability.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel6'} onChange={handleChange('panel6')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>6. Prohibited Conduct</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                You agree not to use our Services:
              </Typography>
              <Typography component="ul" sx={{ pl: 4 }}>
                <li>In any way that violates any applicable federal, state, local or international law or regulation</li>
                <li>To transmit any material that is defamatory, offensive, or otherwise objectionable</li>
                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
                <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Services</li>
                <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of our Services</li>
                <li>To use our Services in any manner that could disable, overburden, damage, or impair the site or interfere with any other party's use of the Services</li>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel7'} onChange={handleChange('panel7')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>7. Intellectual Property</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Our Services and their entire contents, features, and functionality (including but not limited to all information,
                software, text, displays, images, video and audio, and the design, selection and arrangement thereof), are owned by us,
                our licensors or other providers of such material and are protected by United States and international copyright,
                trademark, patent, trade secret and other intellectual property or proprietary rights laws.
              </Typography>
              <Typography variant="body1">
                These Terms permit you to use our Services for your personal, non-commercial use only. You must not reproduce,
                distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store or
                transmit any of the material on our Services, except as generally and ordinarily permitted through the Services according to these Terms.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel8'} onChange={handleChange('panel8')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>8. Disclaimer of Warranties</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                NEITHER THE COMPANY NOR ANY PERSON ASSOCIATED WITH THE COMPANY MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE
                COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY OR AVAILABILITY OF THE SERVICES.
              </Typography>
              <Typography variant="body1" paragraph>
                THE FOREGOING DOES NOT AFFECT ANY WARRANTIES WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel9'} onChange={handleChange('panel9')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>9. Limitation of Liability</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE COMPANY, ITS AFFILIATES OR THEIR LICENSORS,
                SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL
                THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICES, ANY WEBSITES LINKED TO IT,
                ANY CONTENT ON THE SERVICES OR SUCH OTHER WEBSITES OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES OR SUCH OTHER WEBSITES.
              </Typography>
              <Typography variant="body1">
                THE FOREGOING DOES NOT AFFECT ANY LIABILITY WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel10'} onChange={handleChange('panel10')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>10. Governing Law</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                These Terms and your use of the Services shall be governed by and construed in accordance with the laws of the
                United States of America and the state of California, without giving effect to any choice or conflict of law
                provision or rule.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel11'} onChange={handleChange('panel11')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>11. Changes to Terms</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                We may revise and update these Terms from time to time in our sole discretion. All changes are effective
                immediately when we post them, and apply to all access to and use of the Services thereafter. Your continued
                use of the Services following the posting of revised Terms means that you accept and agree to the changes.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel12'} onChange={handleChange('panel12')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>12. Contact Us</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                If you have any questions about these Terms, please contact us at:
                <Box component="address" sx={{ mt: 2, fontStyle: 'normal' }}>
                  Email: mike@aacompanion.com<br />
                  AA Companion<br />
                  Newtown, PA 18940
                </Box>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              By using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}