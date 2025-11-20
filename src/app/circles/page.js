'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import ExploreIcon from '@mui/icons-material/Explore';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { CIRCLE_DEFAULTS } from '@/lib/circles/constants';

const cardBaseSx = {
  borderRadius: 1,
  height: '100%',
  minHeight: 260,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: 4,
    borderColor: 'primary.light',
  },
};

const listCardContentSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  justifyContent: 'space-between',
};

const descriptionClampSx = {
  color: 'text.secondary',
  minHeight: 72,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
};

function VisibilityChip({ visibility }) {
  if (visibility === 'public') {
    return <Chip size="small" color="success" label="Public" icon={<PublicIcon fontSize="small" />} />;
  }
  return <Chip size="small" label="Invite only" icon={<LockIcon fontSize="small" />} />;
}

function MembershipChip({ membership }) {
  if (!membership) {
    return <Chip size="small" label="Not a member" />;
  }

  if (membership.status === 'pending') {
    return <Chip size="small" color="warning" label="Pending approval" icon={<HourglassTopIcon />} />;
  }

  if (membership.role === 'owner') {
    return <Chip size="small" color="primary" label="Owner" />;
  }

  if (membership.role === 'admin') {
    return <Chip size="small" color="info" label="Admin" />;
  }

  return <Chip size="small" color="success" label="Member" />;
}

function CirclesList({ title, description, circles, emptyState, ctaLabel, onCta }) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      {circles.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <GroupsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {emptyState.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {emptyState.description}
            </Typography>
            {ctaLabel && (
              <Button variant="contained" onClick={onCta} startIcon={<AddIcon />}>
                {ctaLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
            },
          }}
        >
          {circles.map((circle) => (
            <Card key={circle.id} variant="outlined" sx={cardBaseSx}>
              <CardHeader
                sx={{ pb: 0 }}
                title={
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {circle.name}
                    </Typography>
                    <VisibilityChip visibility={circle.visibility} />
                  </Stack>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    {circle.type?.replace('-', ' ') || 'general'}
                  </Typography>
                }
              />

              <CardContent sx={listCardContentSx}>
                <Typography variant="body2" sx={descriptionClampSx}>
                  {circle.description || 'No description provided yet.'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    color="success"
                    label={`${circle.memberCount ?? 0}/${circle.maxMembers ?? CIRCLE_DEFAULTS.MAX_MEMBERS} members`}
                  />
                  {circle.membership && <MembershipChip membership={circle.membership} />}
                  {circle.visibility === 'public' && !circle.membership && (
                    <Chip size="small" color="info" label="Open to requests" />
                  )}
                </Stack>
              </CardContent>

              <CardActions
                sx={{
                  justifyContent: 'space-between',
                  px: 3,
                  py: 2,
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  mt: 'auto',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Updated {new Date(circle.updatedAt || circle.createdAt || Date.now()).toLocaleDateString()}
                </Typography>
                <Button size="small" component={Link} href={`/circles/${circle.slug}`} variant="outlined">
                  View circle
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}

export default function CirclesPage() {
  const circlesEnabled = useFeatureFlag('CIRCLES');
  const { data: session, status } = useSession();
  const router = useRouter();

  const [myCircles, setMyCircles] = useState([]);
  const [publicCircles, setPublicCircles] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [errorMine, setErrorMine] = useState(null);
  const [errorPublic, setErrorPublic] = useState(null);

  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingPublic(true);
        const response = await fetch('/api/circles/public');
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || 'Failed to load public circles');
        }
        const result = await response.json();
        if (!cancelled) {
          setPublicCircles(Array.isArray(result.circles) ? result.circles : []);
          setErrorPublic(null);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorPublic(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingPublic(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [circlesEnabled]);

  useEffect(() => {
    if (!isAuthenticated || !circlesEnabled) {
      setLoadingMine(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingMine(true);
        const response = await fetch('/api/circles', {
          credentials: 'include',
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || 'Failed to load your circles');
        }
        const result = await response.json();
        if (!cancelled) {
          setMyCircles(Array.isArray(result.circles) ? result.circles : []);
          setErrorMine(null);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMine(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingMine(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [circlesEnabled, isAuthenticated]);

  const pendingCount = useMemo(
    () => myCircles.filter((circle) => circle.membership?.status === 'pending').length,
    [myCircles],
  );

  if (!circlesEnabled) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 600 }}>
          Circles Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Private recovery circles are in development. Check back soon to create and join trusted groups.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Stack spacing={5}>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={cardBaseSx}>
              <CardHeader
                avatar={<GroupsIcon color="primary" />}
                title="Create a circle"
                subheader="Start a private or public space for the people you sponsor, your home group, or your trusted friends."
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Customize visibility, invite members, and keep conversations protected by default.
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3, mt: 'auto' }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/circles/create')}
                >
                  Create Circle
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={cardBaseSx}>
              <CardHeader
                avatar={<LoginIcon color="primary" />}
                title="Have an invite?"
                subheader="Enter an invite code to join a private circle that a friend or sponsor shared with you."
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Invite codes are single-use or multi-use depending on how the circle owner configured them.
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3, mt: 'auto' }}>
                <Button fullWidth variant="outlined" onClick={() => router.push('/circles/join')}>
                  Join with Invite Code
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={cardBaseSx}>
              <CardHeader
                avatar={<ExploreIcon color="primary" />}
                title="Discover circles"
                subheader="Browse public circles focused on gratitude, step work, and recovery topics."
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Request to join right from the directory. Owners can review and approve your request.
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3, mt: 'auto' }}>
                <Button fullWidth variant="text" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                  Browse Public Circles
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {errorMine && (
          <Card variant="outlined" sx={{ borderColor: 'error.light', borderRadius: 1 }}>
            <CardContent>
              <Typography color="error" variant="subtitle1" sx={{ mb: 1 }}>
                {errorMine}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Complete onboarding to unlock circles. If you already finished, refresh the page.
              </Typography>
              <Button variant="outlined" size="small" component={Link} href="/onboarding">
                Finish Setup
              </Button>
            </CardContent>
          </Card>
        )}

        {isAuthenticated ? (
          loadingMine ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <CirclesList
              title="My Circles"
              description="Circles you own or belong to appear here. Pending requests are highlighted for quick follow-up."
              circles={myCircles}
              emptyState={{
                title: 'You’re not part of any circles yet',
                description:
                  'Ask a trusted friend or sponsor for an invite, or create one to gather your group in a safe space.',
              }}
              ctaLabel="Create Circle"
              onCta={() => router.push('/circles/create')}
            />
          )
        ) : (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 1,
                borderStyle: 'dashed',
                borderColor: 'divider',
              }}
            >
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Sign in to see your circles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Circles you belong to will be listed here once you sign in.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button component={Link} href="/login" variant="contained">
                  Sign In
                </Button>
                <Button component={Link} href="/register" variant="outlined">
                  Create Account
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {pendingCount > 0 && (
          <Chip
            color="warning"
            icon={<HourglassTopIcon />}
            label={`You have ${pendingCount} circle join request${pendingCount === 1 ? '' : 's'} awaiting approval`}
          />
        )}

        {errorPublic && (
          <Card variant="outlined" sx={{ borderColor: 'error.light', borderRadius: 1 }}>
            <CardContent>
              <Typography color="error" variant="subtitle1">
                {errorPublic}
              </Typography>
            </CardContent>
          </Card>
        )}

        {loadingPublic ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <CirclesList
            title="Discover Public Circles"
            description="Browse circles that are open to requests. Owners will review and approve your membership."
            circles={publicCircles}
            emptyState={{
              title: 'No public circles yet',
              description:
                'Be the first to create a public circle for gratitude shares, step studies, or daily reflections.',
            }}
          />
        )}
      </Stack>
    </Box>
  );
}

