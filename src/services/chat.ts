// Chat Service - GPT-5.2 Integration for explanations
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getItemById } from './tiles';
import type { ChatMessage, TileItem } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Model to use - GPT-5.2 as specified (fallback to gpt-4o if not available)
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// System prompt for grounded explanations
const SYSTEM_PROMPT = `You are a calm, factual assistant helping users understand news and developments. 

Your responses must be:
- Grounded in the provided information only
- Calm, optimistic, and non-sensational in tone
- Solution-oriented and forward-looking
- Honest about uncertainty - say "I don't have enough information" when needed

NEVER:
- Invent facts, numbers, or events not in the provided context
- Use sensational language (breaking, shocking, devastating, etc.)
- Make predictions without uncertainty labels
- Claim certainty without direct sourcing

Your response structure for "Explain" requests:
1. **What happened**: Brief factual summary (1-2 sentences)
2. **Why it matters**: Significance and implications (2-3 sentences)
3. **What to watch next**: Forward-looking considerations (1-2 sentences)

Keep responses concise and helpful. Use bullet points for clarity when appropriate.`;

/**
 * Process a chat message with optional item context
 */
export async function processChatMessage(
  sessionId: string,
  userMessage: string,
  boundItemId?: string
): Promise<ChatMessage> {
  // Get chat history for this session
  const history = await getChatHistory(sessionId, 10);
  
  // Get item context if bound
  let itemContext = '';
  if (boundItemId) {
    const itemData = await getItemById(boundItemId);
    if (itemData) {
      itemContext = formatItemContext(itemData.item, itemData.ingestedItem);
    }
  }
  
  // Store user message
  const userChatMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'user',
      content: userMessage,
      boundItemId
    }
  });
  
  // Build messages for OpenAI
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];
  
  // Add item context if available
  if (itemContext) {
    messages.push({
      role: 'system',
      content: `Current news item context:\n${itemContext}`
    });
  }
  
  // Add history (limited to last 10 messages)
  for (const msg of history) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    });
  }
  
  // Add current message
  messages.push({
    role: 'user',
    content: userMessage
  });
  
  try {
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const assistantContent = completion.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response. Please try again.';
    
    // Store assistant response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: assistantContent,
        boundItemId
      }
    });
    
    return transformChatMessage(assistantMessage);
    
  } catch (error) {
    console.error('[Chat] OpenAI error:', error);
    
    // Store error response
    const errorMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please check that the API key is configured correctly.',
        boundItemId
      }
    });
    
    return transformChatMessage(errorMessage);
  }
}

/**
 * Generate "Explain with GPT-5.2" response for an item
 */
export async function explainItem(
  sessionId: string,
  itemId: string
): Promise<ChatMessage> {
  const itemData = await getItemById(itemId);
  
  if (!itemData) {
    return {
      id: 'error',
      sessionId,
      role: 'assistant',
      content: 'Item not found.',
      createdAt: new Date()
    };
  }
  
  const prompt = `Please explain this news item. What happened, why it matters, and what to watch next?

Title: ${itemData.item.originalTitle}
Source: ${itemData.item.sourceName}
Summary: ${itemData.item.calmSummary}
${itemData.item.excerpt ? `Excerpt: ${itemData.item.excerpt}` : ''}`;
  
  return processChatMessage(sessionId, prompt, itemId);
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string, limit = 50): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: limit
  });
  
  return messages.map(transformChatMessage);
}

/**
 * Clear chat history for a session
 */
export async function clearChatHistory(sessionId: string): Promise<void> {
  await prisma.chatMessage.deleteMany({
    where: { sessionId }
  });
}

/**
 * Format item context for the AI
 */
function formatItemContext(item: TileItem, ingestedItem: any): string {
  return `
Title: ${item.originalTitle}
Calm Headline: ${item.calmHeadline}
Source: ${item.sourceName}
Published: ${new Date(item.publishedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}
URL: ${item.url}
${item.excerpt ? `Excerpt: ${item.excerpt}` : ''}
${ingestedItem.snippet ? `Full snippet: ${ingestedItem.snippet.slice(0, 500)}` : ''}

Scores:
- Optimism: ${(ingestedItem.scores.optimismScore * 100).toFixed(0)}%
- Forward Progress: ${(ingestedItem.scores.forwardProgressScore * 100).toFixed(0)}%
- Credibility: ${(ingestedItem.scores.credibilityScore * 100).toFixed(0)}%
`.trim();
}

/**
 * Transform Prisma message to API format
 */
function transformChatMessage(msg: any): ChatMessage {
  return {
    id: msg.id,
    sessionId: msg.sessionId,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    boundItemId: msg.boundItemId || undefined,
    createdAt: msg.createdAt
  };
}
