/**
 * Enhanced createLLMPrompt function to better handle both AA Big Book and Daily Reflections
 * This file contains only the enhanced function - to be integrated into chatbotSearch.js
 */

/**
 * Create a prompt for LLM with context from search results
 * @param {string} query - User's query
 * @param {Array} results - Search results
 * @param {Array} chatHistory - Chat history
 * @param {Object} [todaysReflection] - Today's reflection (optional)
 * @returns {string} - LLM prompt
 */
export function createLLMPrompt(query, results, chatHistory = [], todaysReflection = null) {
  // Format chat history
  const formattedHistory = chatHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  // Categorize results by source
  const bigBookResults = results.filter(r => r.source === 'AA Big Book 4th Edition');
  const reflectionResults = results.filter(r => r.source === 'Daily Reflection');

  // Format search results as context, grouped by source
  let context = '';

  // Add Big Book results first if there are any
  if (bigBookResults.length > 0) {
    context += 'From AA Big Book:\n';
    context += bigBookResults.map((result, i) => {
      return `[B${i + 1}] Page ${result.page_number}:\n"${result.text}"`;
    }).join('\n\n');
  }

  // Add Daily Reflection results with a separator
  if (reflectionResults.length > 0) {
    if (bigBookResults.length > 0) {
      context += '\n\n----------\n\n';
    }
    context += 'From Daily Reflections:\n';
    context += reflectionResults.map((result, i) => {
      return `[R${i + 1}] ${result.reference}:\n"${result.text}"`;
    }).join('\n\n');
  }

  // Format today's reflection if available
  let todaysReflectionContext = '';
  if (todaysReflection) {
    const date = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;

    todaysReflectionContext = `
TODAY'S REFLECTION (${formattedDate}):
Title: ${todaysReflection.title}
Quote: "${todaysReflection.quote}"
Reflection: ${todaysReflection.comment}
Reference: ${todaysReflection.reference}
`;
  }

  // Detect query intent patterns
  const isAboutTodaysReflection = /today|today['']?s|current|this/i.test(query.toLowerCase()) &&
                               /reflection|reading|message|daily/i.test(query.toLowerCase());

  const isAskingForMeaning = /\b(mean|meaning|explain|interpret|understand|significance|about|thoughts on)\b/i.test(query.toLowerCase());

  const isAboutBigBook = /\b(big book|12 steps|twelve steps|aa book|alcoholics anonymous book)\b/i.test(query.toLowerCase());

  const isAboutSpecificTradition = /\b(tradition|traditions)\b/i.test(query.toLowerCase());

  const isAboutSpecificStep = /\b(step|steps)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i.test(query.toLowerCase());

  // Build the system prompt with specific instructions based on query intent
  let specialInstructions = '';

  if (isAboutTodaysReflection && isAskingForMeaning) {
    specialInstructions = `Your answer should focus on EXPLAINING the meaning and significance of today's reflection shown above. Analyze its themes, message, and how it relates to recovery principles. Break down the reflection's core ideas and what they teach about recovery.`;
  } else if (isAboutTodaysReflection) {
    specialInstructions = `Your answer should focus primarily on addressing the question about today's reflection shown above.`;
  } else if (isAboutBigBook) {
    specialInstructions = `Your answer should focus on the AA Big Book content, highlighting key passages and principles. Reference specific pages when citing the Big Book.`;
  } else if (isAboutSpecificTradition) {
    specialInstructions = `Your answer should explain the requested AA Tradition in detail, its purpose, and how it guides AA groups. If the specific tradition is in the provided excerpts, focus on that information.`;
  } else if (isAboutSpecificStep) {
    specialInstructions = `Your answer should explain the requested Step in detail, including its purpose in recovery and how it's typically worked. Focus on information from the provided excerpts.`;
  }

  return `You are a compassionate and knowledgeable recovery assistant for Alcoholics Anonymous.
Your responses should be helpful, supportive, and based on AA literature.

${formattedHistory ? `Recent conversation history:\n${formattedHistory}\n\n` : ''}

${todaysReflectionContext ? `${todaysReflectionContext}\n\n` : ''}

Please answer the following question based on the provided excerpts from AA literature:

Question: ${query}

${specialInstructions ? `${specialInstructions}\n\n` : ''}

Relevant excerpts (ranked by relevance):
${context}

Instructions:
1. Base your answer only on the provided excerpts and widely known AA principles.
2. Be compassionate, supportive, and non-judgmental in your response.
3. DO NOT invent or assume information not present in the excerpts.
4. When directly referencing content from the excerpts:
   - For Big Book content, use the format "As mentioned in the Big Book, page X..."
   - For Daily Reflections, use the format "As the reflection for [date] states..."
   - For today's reflection (if provided), use "As today's reflection states..."
5. If the excerpts don't contain relevant information, acknowledge this limitation politely.
6. Format your answer in clear, readable paragraphs.
7. Use a warm, supportive tone appropriate for someone in recovery or seeking help.
${todaysReflectionContext && isAskingForMeaning ?
  '8. IMPORTANT: Since the user is asking about the meaning of the reflection, provide a detailed explanation of its significance, themes, and recovery lessons. Don\'t just paraphrase, but deeply analyze what the reflection teaches.' : ''}
${isAboutBigBook || isAboutSpecificTradition || isAboutSpecificStep ?
  '8. IMPORTANT: Include the exact wording from the Big Book when possible, followed by your explanation of what this means in practical terms.' : ''}

Your answer:`;
}