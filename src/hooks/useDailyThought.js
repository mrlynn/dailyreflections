"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to manage the daily thought modal visibility
 * Uses cookie-based logic to show the modal only once per day
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoShow - Whether to automatically show the modal based on cookie
 * @param {boolean} options.disabled - Whether to disable the modal entirely
 * @returns {Object} Modal state and control functions
 */
export function useDailyThought({ autoShow = true, disabled = false } = {}) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Skip if disabled or not auto-showing
    if (disabled || !autoShow) return;

    // Check if we've already shown the modal today
    const hasSeenTodaysThought = checkDailyThoughtCookie();

    if (!hasSeenTodaysThought) {
      // Only show after a short delay for better UX
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [autoShow, disabled]);

  /**
   * Check if the user has already seen today's thought
   * @returns {boolean} True if the user has seen today's thought
   */
  const checkDailyThoughtCookie = () => {
    if (typeof document === 'undefined') return false;

    // Get the cookie value
    const cookieMatch = document.cookie.match(/dailyThoughtSeen=([^;]+)/);
    if (!cookieMatch) return false;

    // Parse the timestamp
    try {
      const seenTimestamp = new Date(cookieMatch[1]);
      const now = new Date();

      // If the dates match (same day), return true
      return seenTimestamp.toDateString() === now.toDateString();
    } catch (error) {
      console.error('Error parsing dailyThoughtSeen cookie:', error);
      return false;
    }
  };

  /**
   * Set a cookie indicating that today's thought has been seen
   */
  const setDailyThoughtCookie = () => {
    if (typeof document === 'undefined') return;

    // Set cookie to expire at end of day
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);

    document.cookie = `dailyThoughtSeen=${new Date().toISOString()}; expires=${midnight.toUTCString()}; path=/`;
  };

  /**
   * Open the daily thought modal
   */
  const openModal = () => {
    setShowModal(true);
  };

  /**
   * Close the daily thought modal and optionally set the cookie
   * @param {boolean} setCookie - Whether to set the cookie when closing
   */
  const closeModal = (setCookie = true) => {
    setShowModal(false);

    if (setCookie) {
      setDailyThoughtCookie();
    }
  };

  return {
    showModal,
    openModal,
    closeModal,
    hasSeenToday: checkDailyThoughtCookie(),
    setDailyThoughtCookie
  };
}