import { createTheme } from '@mui/material/styles';

/**
 * Sophisticated Design System for Recovery Resources
 * Designed for: Elegance, Depth, Timeless Appeal, Professional Sophistication
 *
 * Color Psychology:
 * - Primary Charcoal (#2C3E50): Sophisticated, timeless, professional depth
 * - Secondary Steel Blue (#475569): Rich depth, modern elegance, trust
 * - Accent Amber (#D97706): Warm sophistication, premium feel, energy
 * - Neutral Warm Grays: Refined, not stark, sophisticated base
 */
const theme = createTheme({
  palette: {
    // Primary - Sophisticated Charcoal (Deep, Timeless)
    primary: {
      main: '#2C3E50',      // Deep Charcoal - sophisticated and professional
      light: '#3A4F66',    // Medium Charcoal - lighter variant
      dark: '#1A252F',     // Very Dark Charcoal - depth and contrast
      contrastText: '#FFFFFF',
    },
    // Secondary - Rich Steel Blue (Elegant Depth)
    secondary: {
      main: '#475569',      // Steel Blue - rich depth without purple tones
      light: '#64748B',     // Slate Blue - lighter, more approachable
      dark: '#334155',      // Deep Steel - darker, more sophisticated
      contrastText: '#FFFFFF',
    },
    // Accent Colors - Refined & Sophisticated
    info: {
      main: '#0F766E',      // Deep Teal - sophisticated communication
      light: '#14B8A6',     // Medium Teal - lighter variant
      dark: '#0D9488',      // Darker Teal - deep sophistication
    },
    success: {
      main: '#059669',      // Deep Emerald - refined success
      light: '#10B981',     // Medium Emerald
      dark: '#047857',      // Dark Emerald - sophisticated green
    },
    warning: {
      main: '#D97706',      // Rich Amber - warm sophistication
      light: '#F59E0B',     // Golden Amber - lighter, warmer
      dark: '#B45309',      // Deep Amber - rich depth
    },
    error: {
      main: '#DC2626',      // Deep Red - sophisticated alert
      light: '#EF4444',     // Medium Red
      dark: '#B91C1C',      // Deep Red - refined urgency
    },
    // Backgrounds - Refined Warm Neutrals
    background: {
      default: '#F8F9FA',   // Soft Warm Gray - sophisticated off-white
      paper: '#FFFFFF',     // Pure White for cards (maintains clarity)
    },
    // Text - Refined Contrast
    text: {
      primary: '#1E293B',   // Deep Slate - excellent readability
      secondary: '#475569', // Medium Steel - balanced, sophisticated
      disabled: '#94A3B8',  // Light Slate - subtle but readable
    },
    // Dividers & Borders
    divider: '#E2E8F0',     // Soft Border - refined separation
  },
  typography: {
    // Heading font: Poppins (sans-serif) - Contemporary, geometric, startup-focused
    // Body font: Inter (sans-serif) - Modern, clean, highly readable tech favorite
    fontFamily: 'var(--font-inter), "Inter", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: 'var(--font-poppins), "Poppins", "SF Pro Display", sans-serif',
      fontSize: '2.75rem',     // 44px
      fontWeight: 700,
      lineHeight: 1.15,
      color: '#23262F',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'var(--font-poppins), "Poppins", "SF Pro Display", sans-serif',
      fontSize: '2.25rem',     // 36px
      fontWeight: 700,
      lineHeight: 1.2,
      color: '#23262F',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: 'var(--font-poppins), "Poppins", "SF Pro Display", sans-serif',
      fontSize: '1.875rem',    // 30px
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#23262F',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: 'var(--font-poppins), "Poppins", "SF Pro Display", sans-serif',
      fontSize: '1.5rem',      // 24px
      fontWeight: 600,
      lineHeight: 1.35,
      color: '#23262F',
    },
    h5: {
      fontFamily: 'var(--font-poppins), "Poppins", "SF Pro Display", sans-serif',
      fontSize: '1.25rem',     // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#23262F',
    },
    h6: {
      fontFamily: 'var(--font-poppins), "Poppins", "SF Pro Display", sans-serif',
      fontSize: '1.125rem',    // 18px
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#23262F',
    },
    // Body text: Inter with optimal readability (tech company standard)
    body1: {
      fontFamily: 'var(--font-inter), "Inter", "SF Pro Text", "Roboto", sans-serif',
      fontSize: '1rem',        // 16px for better readability
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#23262F',
      letterSpacing: '-0.01em',
    },
    body2: {
      fontFamily: 'var(--font-inter), "Inter", "SF Pro Text", "Roboto", sans-serif',
      fontSize: '0.9375rem',   // 15px
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#23262F',
      letterSpacing: '-0.01em',
    },
    button: {
      fontFamily: 'var(--font-inter), "Inter", "SF Pro Text", "Roboto", sans-serif',
      fontSize: '0.9375rem',   // 15px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    caption: {
      fontFamily: 'var(--font-inter), "Inter", "SF Pro Text", "Roboto", sans-serif',
      fontSize: '0.8125rem',   // 13px
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#606473',
      letterSpacing: '-0.01em',
    },
    overline: {
      fontFamily: 'var(--font-inter), "Inter", "SF Pro Text", "Roboto", sans-serif',
      fontSize: '0.75rem',     // 12px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    subtitle1: {
      fontFamily: 'var(--font-inter), "Inter", "SF Pro Text", "Roboto", sans-serif',
      fontSize: '1.0625rem',   // 17px
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#23262F',
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontFamily: 'var(--font-inter), "Inter", "SF Pro Text", "Roboto", sans-serif',
      fontSize: '0.9375rem',   // 15px
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#23262F',
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 16,       // More artistic, contemporary radius
  },
  shadows: [
    'none',
    '0 1px 2px rgba(15, 23, 42, 0.04)',     // Subtle elevation
    '0 3px 8px rgba(15, 23, 42, 0.08)',     // Cards
    '0 4px 16px rgba(15, 23, 42, 0.08)',    // Floating elements
    '0 8px 24px rgba(15, 23, 42, 0.1)',     // Modals/dialogs
    '0 12px 32px rgba(15, 23, 42, 0.12)',
    '0 16px 40px rgba(15, 23, 42, 0.14)',
    // Extend shadows for consistency with MUI
    '0 20px 48px rgba(15, 23, 42, 0.16)',
    '0 24px 56px rgba(15, 23, 42, 0.18)',
    '0 28px 64px rgba(15, 23, 42, 0.2)',
    '0 32px 72px rgba(15, 23, 42, 0.22)',
    '0 36px 80px rgba(15, 23, 42, 0.24)',
    '0 40px 88px rgba(15, 23, 42, 0.26)',
    '0 44px 96px rgba(15, 23, 42, 0.28)',
    '0 48px 104px rgba(15, 23, 42, 0.3)',
    '0 52px 112px rgba(15, 23, 42, 0.32)',
    '0 56px 120px rgba(15, 23, 42, 0.34)',
    '0 60px 128px rgba(15, 23, 42, 0.36)',
    '0 64px 136px rgba(15, 23, 42, 0.38)',
    '0 68px 144px rgba(15, 23, 42, 0.4)',
    '0 72px 152px rgba(15, 23, 42, 0.42)',
    '0 76px 160px rgba(15, 23, 42, 0.44)',
    '0 80px 168px rgba(15, 23, 42, 0.46)',
    '0 84px 176px rgba(15, 23, 42, 0.48)',
    '0 88px 184px rgba(15, 23, 42, 0.5)',
  ],
  components: {
    // Cards - Modern Startup Style
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.1)',
          backgroundColor: '#FFFFFF',
          transition: 'all 0.2s ease-out',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          '&:hover': {
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.07)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '28px',
          '&:last-child': {
            paddingBottom: '28px',
          },
        },
      },
    },
    // Buttons - Modern Startup Style
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
          fontSize: '0.9375rem',
          letterSpacing: '0.01em',
          transition: 'all 0.2s ease-out',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(44, 62, 80, 0.15)',
          },
        },
        contained: {
          backgroundColor: '#2C3E50',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#1A252F',
            boxShadow: '0 6px 16px rgba(44, 62, 80, 0.25)',
          },
        },
        containedSecondary: {
          backgroundColor: '#475569',
          '&:hover': {
            backgroundColor: '#334155',
            boxShadow: '0 6px 16px rgba(71, 85, 105, 0.25)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: '#2C3E50',
          color: '#2C3E50',
          '&:hover': {
            borderColor: '#1A252F',
            backgroundColor: 'rgba(44, 62, 80, 0.04)',
            borderWidth: '1.5px',
          },
        },
        outlinedSecondary: {
          borderWidth: '1.5px',
          borderColor: '#475569',
          color: '#475569',
          '&:hover': {
            borderColor: '#334155',
            backgroundColor: 'rgba(71, 85, 105, 0.04)',
            borderWidth: '1.5px',
          },
        },
        text: {
          color: '#2C3E50',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: 'rgba(44, 62, 80, 0.04)',
          },
        },
      },
    },
    // Paper - Modern, elevated
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,248,250,1) 100%)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
        },
      },
    },
    // Text Fields - Artistic, professional
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderWidth: '2px',
              borderColor: '#E2E4EB',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover fieldset': {
              borderColor: '#475569',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2C3E50',
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(44, 62, 80, 0.1)',
            },
          },
          '& .MuiOutlinedInput-input': {
            fontFamily: '"Mulish", sans-serif',
            padding: '16px',
          },
          '& .MuiInputLabel-root': {
            fontFamily: '"Mulish", sans-serif',
            color: '#606473',
            fontSize: '0.9375rem',
            '&.Mui-focused': {
              color: '#2C3E50',
            },
          },
          '& .MuiInputHelperText-root': {
            fontFamily: '"Mulish", sans-serif',
            fontSize: '0.8125rem',
            marginTop: '4px',
          },
        },
      },
    },
    // App Bar - Full width, modern startup style
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          boxShadow: '0 1px 0 rgba(226, 232, 240, 0.8)',
          borderRadius: 0,
          width: '100%',
        },
        colorPrimary: {
          backgroundColor: '#2C3E50',
          color: '#FFFFFF',
          backgroundImage: 'linear-gradient(90deg, #2C3E50 0%, #1A252F 100%)',
          borderRadius: 0,
          boxShadow: '0 1px 3px rgba(44, 62, 80, 0.12)',
        },
      },
    },
    // Toolbar - More spacious
    MuiToolbar: {
      styleOverrides: {
        regular: {
          minHeight: '72px',
          '@media (min-width: 0px) and (orientation: landscape)': {
            minHeight: '64px',
          },
          '@media (min-width: 600px)': {
            minHeight: '72px',
          },
        },
      },
    },
    // Typography - Professional adjustments
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#23262F',
        },
        h1: {
          marginBottom: '0.5em',
        },
        h2: {
          marginBottom: '0.5em',
        },
        paragraph: {
          marginBottom: '1.5em',
        },
      },
    },
    // Dividers - Refined separation
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E2E4EB',
        },
        middle: {
          borderColor: 'rgba(226, 228, 235, 0.8)',
          width: '90%',
          margin: '0 auto',
        },
      },
    },
    // Alerts - Modern Startup Style
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontFamily: 'var(--font-inter), "Inter", sans-serif',
          padding: '12px 16px',
          alignItems: 'center',
        },
        standardInfo: {
          backgroundColor: 'rgba(15, 118, 110, 0.08)',
          color: '#0D9488',
          border: '1px solid rgba(15, 118, 110, 0.15)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(5, 150, 105, 0.08)',
          color: '#047857',
          border: '1px solid rgba(5, 150, 105, 0.15)',
        },
        standardWarning: {
          backgroundColor: 'rgba(217, 119, 6, 0.08)',
          color: '#B45309',
          border: '1px solid rgba(217, 119, 6, 0.15)',
        },
        standardError: {
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          color: '#B91C1C',
          border: '1px solid rgba(220, 38, 38, 0.15)',
        },
        icon: {
          opacity: 0.9,
        },
      },
    },
    // Dialog - More artistic
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.16)',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FA 100%)',
        },
      },
    },
    // List - Refined
    MuiList: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginBottom: '4px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(44, 62, 80, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(44, 62, 80, 0.12)',
            },
          },
        },
      },
    },
    // Menu - More artistic
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FA 100%)',
        },
      },
    },
    // Badge - Professional
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontFamily: '"Mulish", sans-serif',
          fontWeight: 700,
          fontSize: '0.75rem',
          padding: '0 6px',
          minWidth: '20px',
          height: '20px',
        },
      },
    },
    // Drawer - Modern
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FA 100%)',
        },
      },
    },
  },
});

export default theme;

