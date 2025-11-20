"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  Search as SearchIcon,
  BookmarkBorder as BookmarkIcon,
  BookmarkAdded as BookmarkAddedIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  CalendarToday as CalendarIcon,
  Shuffle as ShuffleIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import PageHeader from '@/components/PageHeader';

/**
 * AA Topics Brainstorming page
 * Allows users to generate meeting topic ideas based on AA literature using AI
 */
export default function TopicsPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [copied, setCopied] = useState(null);

  const isSharingEnabled = useFeatureFlag('TOPICS', 'SHARING');
  const isFavoritesEnabled = useFeatureFlag('TOPICS', 'FAVORITES');

  // Sample topic ideas for placeholders
  const topicIdeas = [
    'gratitude',
    'acceptance',
    'powerlessness',
    'step 3',
    'higher power',
    'resentments',
    'amends',
    'serenity',
    'character defects'
  ];

  // Random topic ideas for "Surprise Me" feature
  const randomTopicQueries = [
    'gratitude',
    'acceptance',
    'powerlessness',
    'step 1',
    'step 2',
    'step 3',
    'step 4',
    'step 5',
    'step 6',
    'step 7',
    'step 8',
    'step 9',
    'step 10',
    'step 11',
    'step 12',
    'higher power',
    'resentments',
    'fear',
    'amends',
    'serenity',
    'character defects',
    'humility',
    'service',
    'sponsorship',
    'first step',
    'second step',
    'third step',
    'fourth step',
    'fifth step',
    'sixth step',
    'seventh step',
    'eighth step',
    'ninth step',
    'tenth step',
    'eleventh step',
    'twelfth step',
    'spiritual awakening',
    'moral inventory',
    'making amends',
    'helping others',
    'honesty',
    'open-mindedness',
    'willingness',
    'surrender',
    'trust',
    'faith',
    'hope',
    'courage',
    'integrity',
    'patience',
    'tolerance',
    'kindness',
    'love',
    'spiritual principles',
    'daily meditation',
    'prayer',
    'meditation',
    'daily inventory',
    'living one day at a time',
    'one day at a time',
    'progress not perfection',
    'easier softer way',
    'cunning baffling powerful',
    'alcohol is cunning',
    'first drink',
    'relapse prevention',
    'sobriety',
    'recovery',
    'fellowship',
    'meeting',
    'sharing',
    'listening',
    'being of service',
    'carrying the message',
    'principles before personalities',
    'attraction not promotion'
  ];

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Generate random topics
  const generateRandomTopics = async () => {
    // Pick a random query from the list
    const randomQuery = randomTopicQueries[Math.floor(Math.random() * randomTopicQueries.length)];
    
    // Set the input field to show what was used
    setInput(randomQuery);
    
    // Generate topics with the random query
    await generateTopicsWithQuery(randomQuery);
  };

  // Generate topics with a specific query (used by both regular and random generation)
  const generateTopicsWithQuery = async (queryToUse) => {
    if (!queryToUse || !queryToUse.trim()) {
      setError('Please enter a topic, phrase, or keywords');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/topics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryToUse }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data.topics)) {
        setTopics(data.topics);
      } else if (data.topics && typeof data.topics === 'object') {
        // Handle case where topics might be an object with keys
        setTopics(Object.values(data.topics));
      } else if (Array.isArray(data)) {
        // Handle case where response is directly an array
        setTopics(data);
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error generating topics. Please try again.';
      setError(errorMessage);
      console.error('Error generating topics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate topics based on user input
  const generateTopics = async () => {
    await generateTopicsWithQuery(input);
  };

  // Use one of the sample topics
  const useSampleTopic = (topic) => {
    setInput(topic);
  };

  // Toggle favorite status of a topic
  const toggleFavorite = (topic) => {
    if (favorites.includes(topic)) {
      setFavorites(favorites.filter(fav => fav !== topic));
    } else {
      setFavorites([...favorites, topic]);
    }
  };

  // Copy topic to clipboard
  const copyToClipboard = (topic) => {
    navigator.clipboard.writeText(topic);
    setCopied(topic);
    setTimeout(() => setCopied(null), 2000);
  };

  // Share topic (placeholder function for now)
  const shareTopic = (topic) => {
    if (navigator.share) {
      navigator.share({
        title: 'AA Meeting Topic Idea',
        text: topic,
        url: window.location.href
      });
    } else {
      copyToClipboard(topic);
    }
  };

  return (
    <>
      <PageHeader
        title="AA Meeting Topic Brainstorming"
        icon={<LightbulbIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Generate thoughtful meeting topic ideas based on AA literature and principles. Enter a theme, concept, or keyword to get started."
      />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(to right bottom, #f5f7fa, #e8edf2)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Enter a theme, concept, or keyword"
              variant="outlined"
              fullWidth
              value={input}
              onChange={handleInputChange}
              placeholder="Example: gratitude, step 1, acceptance..."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={generateTopics}
                      disabled={isLoading || !input.trim()}
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  generateTopics();
                }
              }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {topicIdeas.map((idea) => (
                <Chip
                  key={idea}
                  label={idea}
                  onClick={() => useSampleTopic(idea)}
                  clickable
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={generateTopics}
                disabled={isLoading || !input.trim()}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LightbulbIcon />}
                sx={{ flex: 1, minWidth: '200px' }}
              >
                {isLoading ? 'Generating Topics...' : 'Generate Meeting Topics'}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                onClick={generateRandomTopics}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <ShuffleIcon />}
                sx={{ flex: 1, minWidth: '200px' }}
              >
                {isLoading ? 'Generating...' : 'Surprise Me!'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {topics.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Meeting Topic Ideas for "{input}"
            </Typography>

            <Box sx={{ mb: 4 }}>
              {topics.map((topic, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {topic.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {topic.description}
                    </Typography>

                    {topic.reference && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Reference: {topic.reference}
                        </Typography>
                        {topic.dateKey && (
                          <Link href={`/${topic.dateKey}`} style={{ textDecoration: 'none' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CalendarIcon />}
                              sx={{ mt: 0.5 }}
                            >
                              View Daily Reflection
                            </Button>
                          </Link>
                        )}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        onClick={() => copyToClipboard(topic.title)}
                        size="small"
                        color={copied === topic.title ? "success" : "default"}
                        title="Copy topic"
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>

                      {isFavoritesEnabled && (
                        <IconButton
                          onClick={() => toggleFavorite(topic.title)}
                          size="small"
                          color={favorites.includes(topic.title) ? "primary" : "default"}
                          title={favorites.includes(topic.title) ? "Remove from favorites" : "Add to favorites"}
                        >
                          {favorites.includes(topic.title) ? (
                            <BookmarkAddedIcon fontSize="small" />
                          ) : (
                            <BookmarkIcon fontSize="small" />
                          )}
                        </IconButton>
                      )}

                      {isSharingEnabled && (
                        <IconButton
                          onClick={() => shareTopic(topic.title)}
                          size="small"
                          title="Share topic"
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Container>
    </>
  );
}