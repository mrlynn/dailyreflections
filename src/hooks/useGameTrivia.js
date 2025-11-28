'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAbly } from '@/lib/ablyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * Custom hook for managing real-time game trivia
 *
 * @param {string} gameSessionId - The game session ID
 * @param {Object} user - Current user object { id, name }
 * @param {Object} options - Additional options
 * @returns {Object} Trivia state and actions
 */
export function useGameTrivia(gameSessionId, user, options = {}) {
  const { client: ablyClient, isConnected: isAblyConnected } = useAbly();
  const isRealtimeEnabled = useFeatureFlag('REALTIME_CHAT'); // Reuse existing flag

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trivia state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [nextQuestionIn, setNextQuestionIn] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [winner, setWinner] = useState(null);

  // Refs
  const channelRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const channelName = `game-trivia:${gameSessionId}`;

  // Initialize channel and subscribe to events
  useEffect(() => {
    if (!isRealtimeEnabled || !ablyClient || !gameSessionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const channel = ablyClient.channels.get(channelName);
      channelRef.current = channel;

      // Subscribe to trivia events
      const handleMessage = (message) => {
        const { name, data } = message;

        switch (name) {
          case 'trivia:question':
            // New question published
            setCurrentQuestion(data.question);
            setQuestionStartTime(new Date(data.shownAt));
            setTimeRemaining(data.timeLimit || 30);
            setHasAnswered(false);
            setLastResult(null);
            setWinner(null);
            if (options.onNewQuestion) {
              options.onNewQuestion(data.question);
            }
            break;

          case 'trivia:answered':
            // Someone answered correctly first
            setWinner({
              userId: data.userId,
              userName: data.userName,
              responseTime: data.responseTime,
            });
            if (options.onAnswered) {
              options.onAnswered(data);
            }
            break;

          case 'trivia:timeout':
            // Question timed out with no winner
            setCurrentQuestion(null);
            setTimeRemaining(null);
            if (options.onTimeout) {
              options.onTimeout(data);
            }
            break;

          case 'trivia:scores':
            // Updated leaderboard
            setLeaderboard(data.leaderboard || []);
            // Update my score if I'm in the leaderboard
            const myEntry = data.leaderboard?.find(p => p.userId === user?.id);
            if (myEntry) {
              setMyScore(myEntry.score);
            }
            break;

          case 'trivia:next':
            // Next question countdown
            setNextQuestionIn(data.secondsUntil);
            setCurrentQuestion(null);
            break;

          default:
            console.log('Unknown trivia event:', name, data);
        }
      };

      channel.subscribe(handleMessage);

      // Enter presence to track active players
      if (user?.id) {
        channel.presence.enter({
          odal: user.id,
          userName: user.name || 'Anonymous',
          joinedAt: new Date().toISOString(),
        }).then(() => {
          setIsConnected(true);
        }).catch((err) => {
          console.error('Error entering trivia presence:', err);
          setError('Failed to join trivia session');
        });
      }

      setIsLoading(false);

      // Cleanup
      return () => {
        if (channel.presence && user?.id) {
          channel.presence.leave().catch(console.error);
        }
        channel.unsubscribe(handleMessage);
        if (timerRef.current) clearInterval(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    } catch (err) {
      console.error('Error setting up trivia channel:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [ablyClient, gameSessionId, channelName, isRealtimeEnabled, user?.id, user?.name]);

  // Timer for answer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !hasAnswered) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [timeRemaining, hasAnswered]);

  // Timer for next question countdown
  useEffect(() => {
    if (nextQuestionIn !== null && nextQuestionIn > 0) {
      countdownRef.current = setInterval(() => {
        setNextQuestionIn((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownRef.current);
    }
  }, [nextQuestionIn]);

  /**
   * Submit an answer to the current question
   */
  const submitAnswer = useCallback(async (answerIndex) => {
    if (!currentQuestion || hasAnswered) {
      return { success: false, error: 'Cannot answer right now' };
    }

    if (!user?.id) {
      return { success: false, error: 'Must be logged in to answer' };
    }

    setHasAnswered(true);

    try {
      const response = await fetch(`/api/game/trivia/${gameSessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odal: user.id,
          userName: user.name || 'Anonymous',
          answer: answerIndex,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit answer');
      }

      setLastResult(result);

      if (result.correct) {
        setMyScore(result.playerScore);
      }

      return result;
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [currentQuestion, hasAnswered, user?.id, user?.name, gameSessionId]);

  /**
   * Fetch current trivia state from server
   */
  const refreshState = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/trivia/${gameSessionId}`);
      const data = await response.json();

      if (data.currentQuestion) {
        setCurrentQuestion(data.currentQuestion);
        setQuestionStartTime(new Date(data.currentQuestion.shownAt));
      }

      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        const myEntry = data.leaderboard.find(p => p.userId === user?.id);
        if (myEntry) {
          setMyScore(myEntry.score);
        }
      }

      if (data.nextQuestionAt) {
        const secondsUntil = Math.max(0, Math.floor((new Date(data.nextQuestionAt) - Date.now()) / 1000));
        setNextQuestionIn(secondsUntil);
      }
    } catch (err) {
      console.error('Error refreshing trivia state:', err);
    }
  }, [gameSessionId, user?.id]);

  // Initial state fetch
  useEffect(() => {
    if (gameSessionId && user?.id) {
      refreshState();
    }
  }, [gameSessionId, user?.id, refreshState]);

  return {
    // Connection state
    isConnected: isConnected && isAblyConnected,
    isLoading,
    error,

    // Question state
    currentQuestion,
    timeRemaining,
    hasAnswered,
    lastResult,
    winner,

    // Countdown
    nextQuestionIn,

    // Scores
    leaderboard,
    myScore,

    // Actions
    submitAnswer,
    refreshState,
  };
}

export default useGameTrivia;
