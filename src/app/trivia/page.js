'use client';

import { Container } from '@mui/material';
import TriviaGame from '@/components/Trivia/TriviaGame';
import PageHeader from '@/components/PageHeader';
import QuizIcon from '@mui/icons-material/Quiz';

/**
 * Trivia Page
 *
 * Provides a fun and educational way for users to test their knowledge
 * of AA literature through an interactive trivia game
 */
export default function TriviaPage() {
  return (
    <>
      <PageHeader
        title="AA Literature Trivia"
        icon={<QuizIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Test your knowledge of Alcoholics Anonymous literature, including the Big Book, Twelve Steps and Twelve Traditions, and AA history."
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* The TriviaGame component manages the game state and renders the appropriate view */}
        <TriviaGame />
      </Container>
    </>
  );
}