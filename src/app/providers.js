'use client';

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { SessionProvider } from 'next-auth/react';
import theme from "@/theme";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            backgroundColor: 'background.default',
          }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </SessionProvider>
  );
}

