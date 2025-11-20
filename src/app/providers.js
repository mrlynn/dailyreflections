'use client';

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { SessionProvider } from 'next-auth/react';
import { SnackbarProvider } from 'notistack';
import { OnboardingProvider } from '@/components/Onboarding/OnboardingProvider';
import GuestSessionProvider from '@/components/GuestSessionProvider';
import PrivacyLockProvider from '@/components/Privacy/PrivacyLockProvider';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AblyProvider } from '@/lib/ablyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import theme from "@/theme";

function ConditionalAblyProvider({ children }) {
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');
  
  if (isRealtimeChatEnabled) {
    return <AblyProvider>{children}</AblyProvider>;
  }
  
  return <>{children}</>;
}

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <GuestSessionProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              autoHideDuration={5000}
            >
              <OnboardingProvider>
                <PrivacyLockProvider>
                  <ConditionalAblyProvider>
                    <Box
                      sx={{
                        minHeight: '100vh',
                        backgroundColor: 'background.default',
                      }}
                    >
                      {children}
                    </Box>
                  </ConditionalAblyProvider>
                </PrivacyLockProvider>
              </OnboardingProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </GuestSessionProvider>
    </SessionProvider>
  );
}
