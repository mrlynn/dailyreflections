'use client';

import { Box, Typography, Breadcrumbs, Button, Stack } from '@mui/material';
import { Container } from '@mui/material';
import Link from 'next/link';
// Note: We need to use different names for Next.js Link and MUI Link components
// to avoid naming conflicts. The 'import X as Y' syntax is NOT supported in JavaScript.
import MuiLink from '@mui/material/Link';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

/**
 * Unified PageHeader Component
 * 
 * Provides consistent navigation and header styling across all feature pages
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {React.ReactNode} props.icon - Icon component to display next to title
 * @param {string} props.subtitle - Optional subtitle or quote
 * @param {Array} props.breadcrumbs - Array of breadcrumb items [{label, href}]
 * @param {React.ReactNode} props.actions - Optional action buttons (e.g., Save, Back)
 * @param {boolean} props.showBackButton - Whether to show back button (default: true)
 * @param {string} props.backHref - Where to navigate on back (default: '/')
 */
export default function PageHeader({
  title,
  icon,
  subtitle,
  breadcrumbs = [],
  actions,
  showBackButton = true,
  backHref = '/',
  backgroundImage,
  backgroundOverlay = 'linear-gradient(135deg, rgba(93,166,167,0.65) 0%, rgba(26,43,52,0.65) 100%)',
  backgroundImageStyles = {},
  backgroundOverlayStyles = {},
  invertText = false,
  fullWidth = false,
}) {
  const router = useRouter();

  // Default breadcrumbs: Home / Page Title
  const defaultBreadcrumbs = [
    { label: 'Home', href: '/' },
    ...breadcrumbs,
    { label: title, href: null } // Current page, not a link
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 4, md: 5 },
        pt: { xs: 6, md: 7 },
        borderBottom: '1px solid rgba(225,232,234,0.6)',
        background: backgroundImage
          ? 'transparent'
          : 'linear-gradient(135deg, rgba(93,166,167,0.08) 0%, rgba(228,185,91,0.03) 100%)',
      }}
    >
      {backgroundImage && (
        <>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.85)',
              transform: 'scale(1.02)',
              ...backgroundImageStyles,
            }}
            aria-hidden
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: backgroundOverlay,
              ...backgroundOverlayStyles,
            }}
            aria-hidden
          />
        </>
      )}

      <Container maxWidth={fullWidth ? false : "lg"} sx={{ position: 'relative', zIndex: 1, px: fullWidth ? { xs: 2, md: 4 } : undefined }}>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb" separator="›">
            {defaultBreadcrumbs.map((crumb, index) => {
              if (crumb.href === null) {
                // Current page - not a link
                return (
                  <Typography
                    key={index}
                    color={invertText ? 'common.white' : 'text.primary'}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {crumb.label}
                  </Typography>
                );
              }
              return (
                <MuiLink
                  key={index}
                  component={Link}
                  href={crumb.href}
                  color={invertText ? 'rgba(255,255,255,0.85)' : 'inherit'}
                  underline="hover"
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: invertText ? 'rgba(255,255,255,0.75)' : 'text.secondary',
                    '&:hover': {
                      color: invertText ? 'common.white' : 'primary.main',
                    }
                  }}
                >
                  {index === 0 && <HomeIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />}
                  {crumb.label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        </Box>

        {/* Page Title and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Title with Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: subtitle ? 2 : 0 }}>
              {icon && (
                <Box
                  sx={{
                    mr: 2,
                    color: invertText ? 'common.white' : 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '2rem', md: '2.5rem' }
                  }}
                >
                  {icon}
                </Box>
              )}
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontFamily: 'var(--font-poppins)',
                  color: invertText ? 'common.white' : 'text.primary',
                  fontSize: { xs: '1.75rem', md: '2.125rem' },
                }}
              >
                {title}
              </Typography>
            </Box>

            {/* Subtitle */}
            {subtitle && (
              <Typography
                variant="h6"
                component="div"
                sx={{
                  color: invertText ? 'rgba(255,255,255,0.85)' : 'text.secondary',
                  fontWeight: 400,
                  fontStyle: typeof subtitle === 'string' && subtitle.includes('"') ? 'italic' : 'normal',
                  lineHeight: 1.6,
                  maxWidth: '800px',
                  mt: 1,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
            {showBackButton && (
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(backHref)}
                sx={{
                borderColor: invertText ? 'rgba(255,255,255,0.7)' : 'rgba(93,166,167,0.3)',
                color: invertText ? 'common.white' : 'text.primary',
                  '&:hover': {
                  borderColor: invertText ? 'common.white' : 'primary.main',
                  backgroundColor: invertText ? 'rgba(255,255,255,0.12)' : 'rgba(93,166,167,0.08)',
                  },
                }}
              >
                Back
              </Button>
            )}
            {actions}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

