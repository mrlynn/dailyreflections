'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Box
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { calculateDaysSober } from '@/utils/sobrietyUtils';

export default function SobrietyBadge() {
  const [sobrietyDate, setSobrietyDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(0);
  const router = useRouter();

  // Fetch sobriety date
  useEffect(() => {
    const fetchSobrietyDate = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/sobriety');

        if (response.ok) {
          const data = await response.json();
          setSobrietyDate(data.sobrietyDate);

          if (data.sobrietyDate) {
            setDays(calculateDaysSober(data.sobrietyDate));
          }
        }
      } catch (error) {
        console.error('Error fetching sobriety data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSobrietyDate();
  }, []);

  const handleClick = () => {
    router.push('/sobriety');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mx: 0.5 }}>
        <CircularProgress size={18} color="inherit" sx={{ opacity: 0.7 }} />
      </Box>
    );
  }

  // Don't render if no sobriety date is set
  if (!sobrietyDate) {
    return null;
  }

  // Determine badge color based on days sober
  let badgeColor = 'primary';
  if (days >= 365) {
    badgeColor = 'success'; // 1 year+
  } else if (days >= 180) {
    badgeColor = 'info'; // 6 months+
  } else if (days >= 90) {
    badgeColor = 'warning'; // 90 days+
  }

  return (
    <Tooltip title={`${days} day${days !== 1 ? 's' : ''} sober - Click to view milestones`}>
      <IconButton
        onClick={handleClick}
        size="small"
        color="inherit"
        sx={{
          mr: { xs: 0, sm: 1 },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      >
        <Badge
          badgeContent={days}
          color={badgeColor}
          max={999}
          overlap="circular"
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <EmojiEventsIcon sx={{ color: 'white' }} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}