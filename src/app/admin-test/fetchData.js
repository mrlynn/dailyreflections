'use client';

// Separate file for data fetching
export async function fetchAdminStats() {
  console.log('🔄 Starting fetchAdminStats function');
  try {
    // Use fetch with explicit AbortController and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    console.log('🔄 Starting fetch to /api/admin/stats/test...');
    const response = await fetch('/api/admin/stats/test', {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 } // Prevent caching for testing purposes
    });

    clearTimeout(timeoutId);
    console.log('✅ Fetch completed with status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch admin stats: ${response.status}`);
    }

    // Clone the response to handle the promise twice
    const responseClone = response.clone();

    // Save raw text for debugging
    const rawText = await responseClone.text();
    console.log('📄 Raw API response text:', rawText);

    // Try parsing the JSON - parse from the raw text to avoid any issues
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (jsonError) {
      console.error('❌ JSON parsing error:', jsonError);
      throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
    }

    console.log('📦 JSON data successfully parsed:', data);

    if (!data || !data.stats) {
      throw new Error('Invalid data structure received from API');
    }

    // Process the data into the correct format with more robust type handling
    const processedData = {
      stats: {
        totalUsers: typeof data.stats.totalUsers === 'number' ? data.stats.totalUsers : Number(data.stats.totalUsers) || 0,
        totalComments: typeof data.stats.totalComments === 'number' ? data.stats.totalComments : Number(data.stats.totalComments) || 0,
        totalChatMessages: typeof data.stats.totalChatMessages === 'number' ? data.stats.totalChatMessages : Number(data.stats.totalChatMessages) || 0,
        totalMeetings: typeof data.stats.totalMeetings === 'number' ? data.stats.totalMeetings : Number(data.stats.totalMeetings) || 0,
        activeUsers: typeof data.stats.activeUsers === 'number' ? data.stats.activeUsers : Number(data.stats.activeUsers) || 0,
      },
      recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      rawResponse: rawText
    };

    // Log the processed data types for debugging
    console.log('✅ Returning processed data with types:', {
      totalUsers: typeof processedData.stats.totalUsers,
      totalComments: typeof processedData.stats.totalComments,
      totalChatMessages: typeof processedData.stats.totalChatMessages,
      totalMeetings: typeof processedData.stats.totalMeetings,
      activeUsers: typeof processedData.stats.activeUsers,
    });

    return processedData;

  } catch (err) {
    console.error('❌ Error fetching admin data:', err);
    // Return fallback data instead of throwing to prevent client component errors
    return {
      stats: {
        totalUsers: 0,
        totalComments: 0,
        totalChatMessages: 0,
        totalMeetings: 0,
        activeUsers: 0,
      },
      recentActivity: [],
      rawResponse: `Error fetching data: ${err.message}`
    };
  }
}