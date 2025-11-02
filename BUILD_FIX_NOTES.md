# Build Fix Notes

## Issue Encountered

When running `npm run build`, the build failed with the following error:

```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
{keys: ..., values: ..., up: function i, down: ..., between: ..., only: ..., not: ..., unit: ...}
```

## Root Cause

The MUI `createTheme()` function returns a theme object that contains functions (breakpoint functions, spacing functions, etc.). When Next.js tried to serialize this for the server component (`layout.js`), it failed because functions cannot be serialized across the server/client boundary.

## Solution

Split the layout into two components:

1. **Server Component** (`layout.js`): Handles metadata, fonts, and HTML structure
2. **Client Component** (`providers.js`): Wraps children with MUI ThemeProvider

### Implementation

**Before** (`layout.js` - broken):
```javascript
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/theme";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>  {/* Error: theme has functions */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**After** (`layout.js` - working):
```javascript
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**New file** (`providers.js`):
```javascript
'use client';

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import theme from "@/theme";

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}
```

## Additional Fix

Also fixed Next.js workspace warning by adding `outputFileTracingRoot` to `next.config.mjs`:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
```

## Result

✅ Build now completes successfully  
✅ No warnings or errors  
✅ All routes compile correctly  
✅ Static pages generated properly  

## Key Takeaway

When using MUI with Next.js App Router:
- **Server Components** can't receive complex objects with functions
- **Client Components** (`'use client'`) can safely use MUI ThemeProvider
- Split providers into a separate client component
- Keep layout metadata and structure in server component

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [MUI Next.js Integration](https://mui.com/material-ui/guides/nextjs/)
- [Server/Client Component Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

