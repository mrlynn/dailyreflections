'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import TriviaQuestion from './TriviaQuestion';
import LeaderboardComponent from './LeaderboardComponent';
import { sampleTriviaQuestions, triviaCategories } from '../../lib/sampleTriviaQuestions';

/**
 * TriviaGame Component
 *
 * Manages the trivia game state, question selection, and score tracking
 */
export default function TriviaGame() {
  // Game state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('random');
  const [loading, setLoading] = useState(false);

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submittingScore, setSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [userRank, setUserRank] = useState(null);

  // Game timing
  const startTimeRef = useRef(null);
  const [timeSpent, setTimeSpent] = useState(0);

  // Initialize or update questions when category changes
  useEffect(() => {
    if (gameStarted) {
      loadQuestions(selectedCategory);
    }
  }, [selectedCategory, gameStarted]);

  // Load questions based on selected category
  const loadQuestions = (category) => {
    setLoading(true);

    // In a real implementation, this would fetch from API
    // For now, filter from sample questions
    let filteredQuestions = [...sampleTriviaQuestions];

    if (category !== 'random') {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);

      // If no questions in this category, use all questions
      if (filteredQuestions.length === 0) {
        filteredQuestions = [...sampleTriviaQuestions];
      }
    }

    // Shuffle questions
    filteredQuestions.sort(() => Math.random() - 0.5);

    // Limit to 5 questions for the demo
    const gameQuestions = filteredQuestions.slice(0, 5);
    setQuestions(gameQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameFinished(false);
    setLoading(false);
  };

  // Start new game
  const startGame = () => {
    setGameStarted(true);
    loadQuestions(selectedCategory);
    startTimeRef.current = new Date();
  };

  // Handle moving to next question
  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;

    // Check if game is finished
    if (nextIndex >= questions.length) {
      // Calculate time spent
      if (startTimeRef.current) {
        const endTime = new Date();
        const timeInSeconds = Math.floor((endTime - startTimeRef.current) / 1000);
        setTimeSpent(timeInSeconds);
      }

      setGameFinished(true);
      // Show name dialog for score submission
      setShowNameDialog(true);
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  // Calculate average difficulty of questions
  const calculateAverageDifficulty = () => {
    if (!questions || questions.length === 0) return 3; // Default medium

    const sum = questions.reduce((total, q) => total + (q.difficulty || 3), 0);
    return Math.round(sum / questions.length);
  };

  // Submit score to leaderboard
  const submitScore = async () => {
    if (!playerName.trim()) {
      return; // Don't submit if name is empty
    }

    setSubmittingScore(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/trivia/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: playerName,
          score,
          category: selectedCategory,
          totalQuestions: questions.length,
          difficulty: calculateAverageDifficulty(),
          timeSpent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit score');
      }

      const data = await response.json();

      // Save user score and rank for the leaderboard display
      setUserScore({
        _id: data.scoreId,
        displayName: playerName,
        score,
        totalQuestions: questions.length,
        date: new Date().toISOString()
      });

      setUserRank(data.rank);

      // Close name dialog and show leaderboard
      setShowNameDialog(false);
      setShowLeaderboard(true);

    } catch (error) {
      console.error('Error submitting score:', error);
      setSubmitError('Failed to submit score. Please try again.');
    } finally {
      setSubmittingScore(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
    if (gameStarted) {
      loadQuestions(newValue);
    }
  };

  // Handle correct answer (update score)
  const handleCorrectAnswer = () => {
    setScore(score + 1);
  };

  // Render start screen
  const renderStartScreen = () => (
    <Card variant="outlined" sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AA Literature Trivia
        </Typography>
        <Typography variant="body1" paragraph>
          Test your knowledge of AA literature including the Big Book,
          Twelve Steps and Twelve Traditions, and AA history.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="trivia categories"
          >
            {triviaCategories.map(category => (
              <Tab
                key={category.id}
                label={category.name}
                value={category.id}
              />
            ))}
          </Tabs>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {triviaCategories.find(c => c.id === selectedCategory)?.description}
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={startGame}
          color="primary"
        >
          Start Trivia
        </Button>
      </CardContent>
    </Card>
  );

  // Render finish screen
  const renderFinishScreen = () => (
    <Card variant="outlined" sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Game Finished!
        </Typography>
        <Typography variant="h5" component="p" sx={{ my: 3 }}>
          Your Score: {score} / {questions.length}
        </Typography>
        <Typography variant="body1" paragraph>
          {score === questions.length
            ? "Perfect score! You really know your AA literature!"
            : score >= questions.length / 2
              ? "Good job! Keep studying your AA literature!"
              : "Keep learning! The more you study AA literature, the better you'll do next time!"}
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedCategory('random');
              startGame();
            }}
          >
            Play Again (Random)
          </Button>
          <Button
            variant="contained"
            onClick={() => setGameStarted(false)}
          >
            Choose Category
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowLeaderboard(true)}
          >
            View Leaderboard
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  // Name input dialog
  const renderNameDialog = () => (
    <Dialog open={showNameDialog} onClose={() => setShowNameDialog(false)}>
      <DialogTitle>Save Your Score</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Congratulations on completing the AA Literature Trivia!
        </Typography>
        <Typography variant="body1" paragraph>
          Your score: {score} / {questions.length}
        </Typography>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Enter your name"
          type="text"
          fullWidth
          variant="outlined"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={submittingScore}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowNameDialog(false)}>Skip</Button>
        <Button
          onClick={submitScore}
          disabled={!playerName.trim() || submittingScore}
          variant="contained"
        >
          {submittingScore ? 'Submitting...' : 'Submit Score'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render loading state
  const renderLoading = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  // Render game in progress
  const renderGameInProgress = () => {
    if (loading || questions.length === 0) {
      return renderLoading();
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h6">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <Typography variant="h6">
            Score: {score}
          </Typography>
        </Box>

        <TriviaQuestion
          question={currentQuestion.question}
          options={currentQuestion.options}
          correctAnswer={currentQuestion.correctAnswer}
          explanation={currentQuestion.explanation}
          sourceReference={currentQuestion.sourceReference}
          category={currentQuestion.category}
          difficulty={currentQuestion.difficulty}
          onNext={handleNextQuestion}
          onCorrectAnswer={handleCorrectAnswer}
        />
      </Container>
    );
  };

  // Render leaderboard
  const renderLeaderboard = () => (
    <Box sx={{ position: 'relative' }}>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setShowLeaderboard(false)}
        sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
      >
        Close
      </Button>
      <LeaderboardComponent
        initialCategory={selectedCategory}
        userScore={userScore}
        userRank={userRank}
      />
    </Box>
  );

  // Main render logic
  return (
    <>
      {!gameStarted && renderStartScreen()}
      {gameStarted && !gameFinished && renderGameInProgress()}
      {gameFinished && !showLeaderboard && renderFinishScreen()}
      {showLeaderboard && renderLeaderboard()}
      {renderNameDialog()}
    </>
  );
}