'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import PageHeader from '@/components/PageHeader';

export default function PrivacyPolicyPage() {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const lastUpdated = "November 5, 2025";

  return (
    <>
      <PageHeader
        title="Privacy Policy"
        icon={<PrivacyTipIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="How we collect, use, and protect your information"
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
              This Privacy Policy explains how AA Companion ("we," "our," or "us") collects, uses, and discloses your information
              when you use our website, mobile application, and services (collectively, the "Services"). Your privacy is important
              to us, and we are committed to protecting your personal information.
            </Typography>
            <Typography variant="body1">
              By using our Services, you agree to the collection and use of information in accordance with this Privacy Policy.
              If you do not agree with our policies and practices, please do not use our Services.
            </Typography>
          </Box>

          <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>1. Information We Collect</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                1.1 Personal Information
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We may collect the following types of personal information:
              </Typography>
              <Typography component="ul" sx={{ pl: 4, mb: 3 }}>
                <li>Contact information (such as name and email address)</li>
                <li>Account credentials (such as username and password)</li>
                <li>Profile information (such as display name and preferences)</li>
                <li>User-generated content (such as comments, journal entries, and reflections)</li>
                <li>Information about your recovery journey (such as sobriety date, if provided)</li>
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                1.2 Usage Information
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We automatically collect certain information about your device and how you interact with our Services, including:
              </Typography>
              <Typography component="ul" sx={{ pl: 4 }}>
                <li>Device information (such as IP address, browser type, and operating system)</li>
                <li>Usage patterns (such as pages visited and features used)</li>
                <li>Time spent on our Services</li>
                <li>Referring websites</li>
                <li>Cookies and similar tracking technologies (as described in our Cookie Policy)</li>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>2. How We Use Your Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We use your information for the following purposes:
              </Typography>
              <Typography component="ul" sx={{ pl: 4 }}>
                <li>To provide and maintain our Services</li>
                <li>To personalize your experience</li>
                <li>To communicate with you about your account or transactions</li>
                <li>To send important notices and updates</li>
                <li>To improve our Services</li>
                <li>To respond to your inquiries and provide support</li>
                <li>To monitor and analyze usage patterns and trends</li>
                <li>To protect the security and integrity of our Services</li>
                <li>To comply with legal obligations</li>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>3. Information Sharing and Disclosure</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ mb: 3 }}>
                We take your privacy seriously and are committed to maintaining the confidentiality of your personal information.
                We do not sell your personal information to third parties. However, we may share your information in the following circumstances:
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                3.1 Service Providers
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We may share your information with third-party service providers who perform services on our behalf, such as hosting, data analysis,
                payment processing, and customer service. These service providers are contractually obligated to use your information only for the
                purpose of providing the services we request.
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                3.2 Legal Requirements
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We may disclose your information if required to do so by law or in response to valid requests by public authorities
                (e.g., a court or government agency).
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                3.3 Protection of Rights
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We may disclose your information when we believe in good faith that disclosure is necessary to protect our rights,
                protect your safety or the safety of others, investigate fraud, or respond to a government request.
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                3.4 Business Transfers
              </Typography>
              <Typography variant="body1">
                If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred
                as part of that transaction. We will notify you via email and/or a prominent notice on our website of any change in ownership
                or uses of your information.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>4. Data Security</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We implement appropriate technical and organizational measures to protect your personal information against accidental or
                unlawful destruction, loss, alteration, unauthorized disclosure, or access. These measures include:
              </Typography>
              <Typography component="ul" sx={{ pl: 4 }}>
                <li>Encryption of sensitive data</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication procedures</li>
                <li>Secure data storage practices</li>
                <li>Employee training on data security</li>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                However, please note that no method of transmission over the Internet or electronic storage is 100% secure.
                While we strive to protect your personal information, we cannot guarantee its absolute security.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>5. Your Privacy Rights</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Depending on your location, you may have certain rights regarding your personal information, which may include:
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                5.1 Access and Portability
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have the right to access your personal information and to receive a copy of the personal information we hold about you
                in a structured, commonly used, and machine-readable format.
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                5.2 Correction
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have the right to request that we correct inaccurate or incomplete personal information about you.
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                5.3 Deletion
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have the right to request the deletion of your personal information in certain circumstances, such as when it is no longer
                necessary for the purposes for which it was collected.
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                5.4 Restriction and Objection
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have the right to request that we restrict the processing of your personal information and to object to the processing
                of your personal information in certain circumstances.
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                5.5 Consent Withdrawal
              </Typography>
              <Typography variant="body1">
                If we process your personal information based on your consent, you have the right to withdraw your consent at any time.
                This will not affect the lawfulness of processing based on consent before its withdrawal.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel6'} onChange={handleChange('panel6')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>6. Cookies and Similar Technologies</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We use cookies and similar tracking technologies to track activity on our Services and to hold certain information.
                Cookies are files with a small amount of data that may include an anonymous unique identifier.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not
                accept cookies, you may not be able to use some portions of our Services.
              </Typography>
              <Typography variant="body1">
                For more information about our use of cookies and how to manage them, please see our{' '}
                <MuiLink component={Link} href="/legal/cookies">
                  Cookie Policy
                </MuiLink>
                .
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel7'} onChange={handleChange('panel7')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>7. Children's Privacy</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                Our Services are not directed to children under 13 years of age, and we do not knowingly collect personal information
                from children under 13. If we learn that we have collected personal information from a child under 13 without verification
                of parental consent, we will take steps to delete that information.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel8'} onChange={handleChange('panel8')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>8. Changes to This Privacy Policy</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy
                on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
                Changes to this Privacy Policy are effective when they are posted on this page.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel9'} onChange={handleChange('panel9')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600}>9. Contact Us</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                <Box component="address" sx={{ mt: 2, fontStyle: 'normal' }}>
                  Email: privacy@aacompanion.com<br />
                  AA Companion<br />
                  Newtown, PA 18940
                </Box>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              By using our Services, you acknowledge that you have read and understood this Privacy Policy.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}