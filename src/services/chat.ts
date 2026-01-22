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

// System prompt for HypurrAI - Crypto & AI Assistant
const SYSTEM_PROMPT = `You are HypurrAI, an expert assistant for crypto traders and AI enthusiasts. You are part of the HypurrRelevancy news feed, powered by HypurrFi.

Your expertise areas:
- DeFi protocols, yields, TVL, liquidity strategies
- Token analysis, security evaluation, rug pull detection
- Perp DEXs (especially Hyperliquid), trading strategies
- AI frontier models (GPT, Claude, Llama, Gemini), agents, and research
- On-chain analytics and market movements

Your responses must be:
- Accurate and grounded in facts
- Concise and actionable for traders
- Non-sensational in tone (no hype, no FUD)
- Honest about risks and uncertainty

When discussing tokens:
- Always mention security considerations
- Note liquidity and volume when relevant
- Be cautious about newer/unverified projects

When discussing AI:
- Focus on practical capabilities and limitations
- Reference specific models and benchmarks when relevant
- Explain technical concepts clearly

For news explanations, structure as:
1. **What happened**: Brief factual summary
2. **Why it matters**: Significance for traders/developers
3. **What to watch**: Forward-looking considerations

Keep responses helpful and to-the-point. Use bullet points for clarity.`;

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
 * Generate a newspaper-style summary for an item (standalone, not stored in chat)
 */
export async function summarizeItem(itemId: string): Promise<{
  headline: string;
  byline: string;
  leadParagraph: string;
  body: string;
  keyPoints: string[];
  outlook: string;
}> {
  const itemData = await getItemById(itemId);
  
  if (!itemData) {
    return {
      headline: 'Article Not Found',
      byline: '',
      leadParagraph: 'Unable to retrieve article information.',
      body: '',
      keyPoints: [],
      outlook: ''
    };
  }

  const prompt = `You are a newspaper editor. Create a structured newspaper-style summary of this news item.

Title: ${itemData.item.originalTitle}
Source: ${itemData.item.sourceName}
Summary: ${itemData.item.calmSummary}
${itemData.item.excerpt ? `Excerpt: ${itemData.item.excerpt}` : ''}
${itemData.ingestedItem.snippet ? `Full snippet: ${itemData.ingestedItem.snippet}` : ''}

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "headline": "A clear, calm headline (no sensationalism)",
  "byline": "Brief one-line context about the significance",
  "leadParagraph": "The most important 2-3 sentences summarizing what happened",
  "body": "Additional context and details in 2-3 sentences",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "outlook": "Forward-looking statement about what this means going forward (1-2 sentences)"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'You are a calm, factual newspaper editor. Always respond with valid JSON only, no markdown or code blocks.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
      return {
        headline: parsed.headline || itemData.item.calmHeadline,
        byline: parsed.byline || `From ${itemData.item.sourceName}`,
        leadParagraph: parsed.leadParagraph || itemData.item.calmSummary,
        body: parsed.body || '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        outlook: parsed.outlook || ''
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        headline: itemData.item.calmHeadline,
        byline: `From ${itemData.item.sourceName}`,
        leadParagraph: itemData.item.calmSummary,
        body: itemData.item.excerpt || '',
        keyPoints: [],
        outlook: ''
      };
    }
  } catch (error) {
    console.error('[Chat] Summarize error:', error);
    return {
      headline: itemData.item.calmHeadline,
      byline: `From ${itemData.item.sourceName}`,
      leadParagraph: itemData.item.calmSummary,
      body: itemData.item.excerpt || '',
      keyPoints: [],
      outlook: 'Unable to generate AI summary at this time.'
    };
  }
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
