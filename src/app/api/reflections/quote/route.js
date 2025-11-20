import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getTodayKey } from '@/utils/dateUtils';

/**
 * GET /api/reflections/quote
 * Get a daily quote/affirmation from reflections database
 * Returns a meaningful quote that can be displayed on the home page
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const todayKey = getTodayKey();
    const [month, day] = todayKey.split('-').map(num => parseInt(num, 10));

    // Get today's reflection
    const todayReflection = await db.collection('reflections').findOne({
      month,
      day
    });

    // Extract a meaningful quote from the reflection
    let quote = null;
    let source = null;

    if (todayReflection) {
      // Try to extract a quote from the reflection text
      // Look for text in quotes or a meaningful sentence
      const text = todayReflection.text || '';
      
      // Look for quoted text first
      const quotedMatch = text.match(/"([^"]{20,150})"/);
      if (quotedMatch) {
        quote = quotedMatch[1];
        source = todayReflection.title || 'Daily Reflection';
      } else {
        // Extract first meaningful sentence (50-150 chars)
        const sentences = text.split(/[.!?]+/).filter(s => {
          const trimmed = s.trim();
          return trimmed.length >= 50 && trimmed.length <= 150;
        });
        
        if (sentences.length > 0) {
          quote = sentences[0].trim();
          source = todayReflection.title || 'Daily Reflection';
        }
      }
    }

    // Fallback quotes if no reflection quote found
    const fallbackQuotes = [
      { quote: "Courage is fear that has said its prayers.", source: "AA Literature" },
      { quote: "One day at a time.", source: "AA Slogan" },
      { quote: "Progress, not perfection.", source: "AA Slogan" },
      { quote: "First things first.", source: "AA Slogan" },
      { quote: "Easy does it.", source: "AA Slogan" },
      { quote: "Live and let live.", source: "AA Slogan" },
      { quote: "Let go and let God.", source: "AA Slogan" }
    ];

    // If no quote extracted, use a fallback based on day of year
    if (!quote) {
      const dayOfYear = (month - 1) * 30 + day;
      const fallbackIndex = dayOfYear % fallbackQuotes.length;
      const fallback = fallbackQuotes[fallbackIndex];
      quote = fallback.quote;
      source = fallback.source;
    }

    return NextResponse.json({
      success: true,
      quote,
      source,
      dateKey: todayKey
    });
  } catch (error) {
    console.error('Error fetching daily quote:', error);
    
    // Return a safe fallback
    return NextResponse.json({
      success: true,
      quote: "One day at a time.",
      source: "AA Slogan",
      dateKey: getTodayKey()
    });
  }
}

