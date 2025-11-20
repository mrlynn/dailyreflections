'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { CIRCLE_DEFAULTS, CIRCLE_TYPES, CIRCLE_VISIBILITY } from '@/lib/circles/constants';

const circleTypes = CIRCLE_TYPES ?? ['general', 'sponsor-circle', 'step-group'];

export default function CreateCirclePage() {
  const circlesEnabled = useFeatureFlag('CIRCLES');
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('general');
  const [visibility, setVisibility] = useState(CIRCLE_VISIBILITY.PRIVATE);
  const [maxMembers, setMaxMembers] = useState(CIRCLE_DEFAULTS.MAX_MEMBERS);
  const [allowMultipleInvites, setAllowMultipleInvites] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);

  if (!circlesEnabled) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Circles Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Circle creation will be available soon. Thanks for your patience!
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto' }}>
        <Card>
          <CardHeader
            avatar={<GroupsIcon color="primary" />}
            title="Sign in to create a circle"
            subheader="You need to be signed in to start a new circle."
          />
          <CardContent>
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
      </Box>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          type,
          visibility,
          maxMembers: Number(maxMembers),
          allowMultipleInvites,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create circle');
      }

      const slug = result.circle?.slug;
      if (slug) {
        router.push(`/circles/${slug}`);
      } else {
        router.push('/circles');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
            Back
          </Button>
        </Stack>

        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Create a Circle
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
            Launch a trusted space for your recovery group. You can configure visibility, invite options, and member
            limits now—more controls arrive in future releases.
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderradius: 1 }}>
          <CardContent component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Circle name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                fullWidth
                helperText="Choose a clear name that members will recognize."
              />

              <TextField
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                fullWidth
                multiline
                minRows={3}
                helperText="Help members understand the purpose and tone of this circle."
              />

              <FormControl fullWidth>
                <InputLabel id="circle-type">Circle type</InputLabel>
                <Select
                  labelId="circle-type"
                  label="Circle type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  {circleTypes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option.replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="circle-visibility">Visibility</InputLabel>
                <Select
                  labelId="circle-visibility"
                  label="Visibility"
                  value={visibility}
                  onChange={(event) => {
                    const value = event.target.value;
                    setVisibility(value);
                    if (value === CIRCLE_VISIBILITY.PRIVATE) {
                      setAllowMultipleInvites(true);
                    }
                  }}
                >
                  <MenuItem value={CIRCLE_VISIBILITY.PRIVATE}>Invite only</MenuItem>
                  <MenuItem value={CIRCLE_VISIBILITY.PUBLIC}>Public (requires approval)</MenuItem>
                </Select>
                <FormHelperText>
                  Invite-only circles stay hidden. Public circles can be discovered and join requests reviewed by admins.
                </FormHelperText>
              </FormControl>

              <TextField
                type="number"
                label="Maximum members"
                value={maxMembers}
                onChange={(event) => setMaxMembers(event.target.value)}
                fullWidth
                inputProps={{ min: 2, max: CIRCLE_DEFAULTS.MAX_MEMBERS_LIMIT || 50 }}
                helperText={`Member cap keeps circles safe and manageable. Default is ${CIRCLE_DEFAULTS.MAX_MEMBERS}.`}
              />

              <FormControl fullWidth>
                <InputLabel id="circle-invites">Invite link mode</InputLabel>
                <Select
                  labelId="circle-invites"
                  label="Invite link mode"
                  value={allowMultipleInvites ? 'multi' : 'single'}
                  onChange={(event) => setAllowMultipleInvites(event.target.value === 'multi')}
                  disabled={visibility === CIRCLE_VISIBILITY.PRIVATE}
                >
                  <MenuItem value="multi">Multi-use invite links</MenuItem>
                  <MenuItem value="single">Single-use invite links</MenuItem>
                </Select>
                <FormHelperText>
                  Multi-use links allow multiple members to join; single-use links expire after the first use.
                </FormHelperText>
              </FormControl>

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" component={Link} href="/circles">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Circle'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

