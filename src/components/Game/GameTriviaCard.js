'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';

/**
 * GameTriviaCard Component
 *
 * A persistent trivia card that appears within a game (like Bingo).
 * Shows AA-related trivia questions that all players can answer.
 * First correct answer wins bonus points.
 */
export default function GameTriviaCard({
  currentQuestion,
  timeRemaining,
  hasAnswered,
  lastResult,
  winner,
  nextQuestionIn,
  leaderboard,
  myScore,
  onAnswer,
  isConnected,
  isLoading,
  error,
}) {
  const theme = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected answer when new question arrives
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(null);
    }
  }, [currentQuestion?.questionId]);

  // Handle answer selection and submission
  const handleAnswerClick = async (index) => {
    if (hasAnswered || isSubmitting || !currentQuestion) return;

    setSelectedAnswer(index);
    setIsSubmitting(true);

    try {
      await onAnswer(index);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get button color based on answer state
  const getAnswerButtonColor = (index) => {
    if (!hasAnswered) {
      return selectedAnswer === index ? 'primary' : 'inherit';
    }

    // After answering, show correct/incorrect
    if (lastResult) {
      if (index === lastResult.correctAnswer) {
        return 'success';
      }
      if (selectedAnswer === index && !lastResult.correct) {
        return 'error';
      }
    }

    return 'inherit';
  };

  // Get button variant based on state
  const getAnswerButtonVariant = (index) => {
    if (selectedAnswer === index) {
      return 'contained';
    }
    return 'outlined';
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  // Render waiting state (between questions)
  const renderWaitingState = () => (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <QuizIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2, opacity: 0.7 }} />
      <Typography variant="h6" gutterBottom>
        Trivia Coming Soon!
      </Typography>
      {nextQuestionIn !== null && nextQuestionIn > 0 ? (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Next question in
          </Typography>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            {formatTime(nextQuestionIn)}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Stay tuned for the next AA trivia question...
        </Typography>
      )}
    </Box>
  );

  // Render the question
  const renderQuestion = () => (
    <Box>
      {/* Timer bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Chip
            icon={<TimerIcon />}
            label={formatTime(timeRemaining || 0)}
            size="small"
            color={timeRemaining && timeRemaining <= 10 ? 'error' : 'primary'}
          />
          {currentQuestion?.category && (
            <Chip
              label={currentQuestion.category.replace('-', ' ')}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={((timeRemaining || 0) / 30) * 100}
          color={timeRemaining && timeRemaining <= 10 ? 'error' : 'primary'}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>

      {/* Question text */}
      <Typography variant="body1" sx={{ fontWeight: 500, mb: 2, lineHeight: 1.5 }}>
        {currentQuestion?.question}
      </Typography>

      {/* Answer options */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {currentQuestion?.options?.map((option, index) => (
          <Button
            key={index}
            variant={getAnswerButtonVariant(index)}
            color={getAnswerButtonColor(index)}
            onClick={() => handleAnswerClick(index)}
            disabled={hasAnswered || isSubmitting || timeRemaining === 0}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              py: 1.5,
              px: 2,
              textTransform: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              '&:hover': {
                transform: hasAnswered ? 'none' : 'translateX(4px)',
              },
            }}
            startIcon={
              hasAnswered && lastResult ? (
                index === lastResult.correctAnswer ? (
                  <CheckCircleIcon color="success" />
                ) : selectedAnswer === index ? (
                  <CancelIcon color="error" />
                ) : null
              ) : (
                <Typography
                  component="span"
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </Typography>
              )
            }
          >
            {option}
          </Button>
        ))}
      </Box>

      {/* Winner announcement */}
      {winner && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            borderRadius: 2,
            border: `1px solid ${theme.palette.success.main}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon color="success" />
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
              {winner.userName} answered first! ({(winner.responseTime / 1000).toFixed(1)}s)
            </Typography>
          </Box>
        </Box>
      )}

      {/* Result feedback */}
      {hasAnswered && lastResult && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: lastResult.correct
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              color={lastResult.correct ? 'success.main' : 'error.main'}
              sx={{ fontWeight: 500, mb: 0.5 }}
            >
              {lastResult.correct
                ? `Correct! +${lastResult.pointsEarned} points${lastResult.isFirstCorrect ? ' (First!)' : ''}`
                : 'Incorrect'}
            </Typography>
            {lastResult.explanation && (
              <Typography variant="caption" color="text.secondary">
                {lastResult.explanation}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );

  // Render leaderboard
  const renderLeaderboard = () => (
    <Collapse in={showLeaderboard}>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon fontSize="small" color="primary" />
        Trivia Leaderboard
      </Typography>
      <List dense disablePadding>
        {leaderboard.slice(0, 5).map((player, index) => (
          <ListItem
            key={player.userId}
            sx={{
              py: 0.5,
              px: 1,
              bgcolor: index === 0 ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
              borderRadius: 1,
            }}
          >
            <ListItemAvatar sx={{ minWidth: 36 }}>
              {index === 0 ? (
                <StarIcon color="warning" />
              ) : (
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'action.hover' }}>
                  {index + 1}
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              primary={player.userName}
              primaryTypographyProps={{ variant: 'body2', fontWeight: index === 0 ? 600 : 400 }}
            />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {player.score}
            </Typography>
          </ListItem>
        ))}
        {leaderboard.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
            No scores yet. Be the first!
          </Typography>
        )}
      </List>
    </Collapse>
  );

  // Loading state
  if (isLoading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading trivia...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card elevation={2} sx={{ borderRadius: 2, borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
        <CardContent>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 2,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
        border: currentQuestion ? `2px solid ${theme.palette.primary.main}` : 'none',
        transition: 'border 0.3s ease',
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AA Trivia
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* My score */}
            <Tooltip title="Your trivia score">
              <Chip
                icon={<PersonIcon />}
                label={myScore}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Tooltip>
            {/* Connection indicator */}
            <Tooltip title={isConnected ? 'Connected' : 'Connecting...'}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isConnected ? 'success.main' : 'warning.main',
                }}
              />
            </Tooltip>
            {/* Leaderboard toggle */}
            <IconButton
              size="small"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              sx={{ ml: 0.5 }}
            >
              {showLeaderboard ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Main content */}
        {currentQuestion ? renderQuestion() : renderWaitingState()}

        {/* Leaderboard */}
        {renderLeaderboard()}
      </CardContent>
    </Card>
  );
}
