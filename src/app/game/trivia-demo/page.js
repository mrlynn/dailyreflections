'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Card,
  CardContent,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import GameTriviaCard from '@/components/Game/GameTriviaCard';
import { useGameTrivia } from '@/hooks/useGameTrivia';
import PageHeader from '@/components/PageHeader';
import QuizIcon from '@mui/icons-material/Quiz';

/**
 * Game Trivia Demo Page
 *
 * A demo page to test the real-time trivia card functionality.
 * In production, this would be integrated into the Bingo game.
 */
export default function TriviaDemo() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessionId] = useState('demo-session-' + Date.now().toString(36));
  const [error, setError] = useState(null);
  const [adminMessage, setAdminMessage] = useState(null);

  // Use the game trivia hook
  const {
    isConnected,
    isLoading,
    error: triviaError,
    currentQuestion,
    timeRemaining,
    hasAnswered,
    lastResult,
    winner,
    nextQuestionIn,
    leaderboard,
    myScore,
    submitAnswer,
    refreshState,
  } = useGameTrivia(
    sessionId,
    session?.user ? { id: session.user.id, name: session.user.displayName || session.user.name } : null
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/game/trivia-demo');
    }
  }, [status, router]);

  // Admin: Push a new question
  const handlePushQuestion = async () => {
    try {
      setAdminMessage(null);
      const response = await fetch(`/api/game/trivia/${sessionId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pushQuestion' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to push question');
      }

      setAdminMessage('Question pushed successfully!');
      setTimeout(() => setAdminMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Admin: End current question
  const handleEndQuestion = async () => {
    try {
      setAdminMessage(null);
      const response = await fetch(`/api/game/trivia/${sessionId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'endQuestion' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to end question');
      }

      setAdminMessage('Question ended');
      setTimeout(() => setAdminMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Admin: Reset scores
  const handleResetScores = async () => {
    try {
      setAdminMessage(null);
      const response = await fetch(`/api/game/trivia/${sessionId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetScores' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset scores');
      }

      setAdminMessage('Scores reset!');
      setTimeout(() => setAdminMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const isAdmin = session?.user?.isAdmin || session?.user?.role === 'admin';

  return (
    <>
      <PageHeader
        title="Game Trivia Demo"
        icon={<QuizIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Test the real-time multiplayer trivia card"
        backgroundImage="/images/trivia-bg.png"
        invertText={true}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Error/Success Messages */}
        {(error || triviaError) && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error || triviaError}
          </Alert>
        )}

        {adminMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {adminMessage}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Trivia Card */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Trivia Card Preview
            </Typography>
            <GameTriviaCard
              currentQuestion={currentQuestion}
              timeRemaining={timeRemaining}
              hasAnswered={hasAnswered}
              lastResult={lastResult}
              winner={winner}
              nextQuestionIn={nextQuestionIn}
              leaderboard={leaderboard}
              myScore={myScore}
              onAnswer={submitAnswer}
              isConnected={isConnected}
              isLoading={isLoading}
              error={triviaError}
            />

            {/* Integration Info */}
            <Paper sx={{ mt: 3, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This trivia card can be embedded in any game (like Bingo). All players in the same
                game session see the same questions simultaneously.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>First Correct Answer Wins:</strong> The first player to answer correctly
                gets bonus points. Everyone else still gets points for correct answers.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Real-Time Updates:</strong> When someone answers correctly first, all
                players are notified immediately via Ably websockets.
              </Typography>
            </Paper>
          </Grid>

          {/* Admin Controls (for testing) */}
          <Grid item xs={12} md={4}>
            {isAdmin ? (
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" />
                    Admin Controls
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={handlePushQuestion}
                      fullWidth
                    >
                      Push New Question
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleEndQuestion}
                      disabled={!currentQuestion}
                      fullWidth
                    >
                      End Current Question
                    </Button>

                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={handleResetScores}
                      fullWidth
                    >
                      Reset All Scores
                    </Button>

                    <Button
                      variant="text"
                      startIcon={<RefreshIcon />}
                      onClick={refreshState}
                      fullWidth
                    >
                      Refresh State
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="caption" color="text.secondary" display="block">
                    Session ID: {sessionId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Connection: {isConnected ? 'Connected' : 'Disconnected'}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">
                Admin controls are only visible to administrators. The trivia card on the left
                shows what regular players see.
              </Alert>
            )}

            {/* Instructions */}
            <Paper sx={{ mt: 3, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Testing Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Open this page in multiple browser tabs/windows
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2. Use admin controls to push a question
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. Answer in different tabs to see real-time updates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                4. First correct answer wins bonus points!
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
