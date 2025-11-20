'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Stack, Fade, Chip } from '@mui/material';

/**
 * TriviaQuestion Component
 *
 * Displays a single trivia question with multiple choice options
 * Handles answer selection and provides feedback
 */
export default function TriviaQuestion({
  question,
  options,
  correctAnswer,
  explanation,
  sourceReference,
  category,
  difficulty,
  onNext = null,
  onCorrectAnswer = null
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [question]);

  const handleAnswer = (index) => {
    const correct = index === correctAnswer;
    setSelectedAnswer(index);
    setShowFeedback(true);
    setIsCorrect(correct);

    // Call onCorrectAnswer if answer is correct and the callback exists
    if (correct && onCorrectAnswer) {
      onCorrectAnswer();
    }
  };

  const getDifficultyLabel = (level) => {
    const labels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    return labels[level - 1] || 'Medium';
  };

  // Render component
  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        borderRadius: 2,
        maxWidth: '800px',
        mx: 'auto',
        mb: 4,
      }}
    >
      {/* Question header with category and difficulty */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={category.charAt(0).toUpperCase() + category.slice(1)}
          color="primary"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip
          label={getDifficultyLabel(difficulty)}
          color={difficulty > 3 ? "error" : difficulty > 1 ? "warning" : "success"}
          variant="outlined"
        />
      </Box>

      {/* Question text */}
      <Typography variant="h5" component="h2" gutterBottom>
        {question}
      </Typography>

      {/* Answer options */}
      <Stack spacing={2} sx={{ mt: 4 }}>
        {options.map((option, index) => (
          <Button
            key={index}
            variant={selectedAnswer === index ? "contained" : "outlined"}
            fullWidth
            size="large"
            onClick={() => handleAnswer(index)}
            disabled={showFeedback}
            color={
              showFeedback
                ? index === correctAnswer
                  ? "success"
                  : index === selectedAnswer
                  ? "error"
                  : "primary"
                : "primary"
            }
            sx={{
              py: 1.5,
              justifyContent: "flex-start",
              textAlign: "left",
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            {option}
          </Button>
        ))}
      </Stack>

      {/* Feedback section */}
      {showFeedback && (
        <Fade in={showFeedback}>
          <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #ddd' }}>
            <Typography
              variant="h6"
              color={isCorrect ? "success.main" : "error.main"}
              gutterBottom
            >
              {isCorrect ? "Correct!" : "Incorrect"}
            </Typography>

            <Typography variant="body1" paragraph>
              {explanation}
            </Typography>

            {sourceReference && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Source: {sourceReference.source}, Page {sourceReference.page}
                </Typography>
                {sourceReference.text && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    "{sourceReference.text}"
                  </Typography>
                )}
              </Box>
            )}

            {onNext && (
              <Button
                variant="contained"
                color="primary"
                onClick={onNext}
                sx={{ mt: 3 }}
              >
                Next Question
              </Button>
            )}
          </Box>
        </Fade>
      )}
    </Paper>
  );
}