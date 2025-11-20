'use client';

import { Container } from '@mui/material';
import TriviaGame from '@/components/Trivia/TriviaGame';
import PageHeader from '@/components/PageHeader';
import QuizIcon from '@mui/icons-material/Quiz';

/**
 * TriviaContent component
 *
 * Client component that renders the trivia page content
 */
export default function TriviaContent() {
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