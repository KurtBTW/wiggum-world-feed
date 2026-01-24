import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchKnowledge } from '@/services/embeddings';

const SYSTEM_PROMPT = `You are Last Agent, an AI assistant for Last Network - a gated DeFi membership network on Hyperliquid.

Your role is to help users understand:
- Partner protocols and their recent activities
- Announcements and updates from the network
- Market insights and protocol comparisons
- How to engage with the Last Network ecosystem

You have access to real-time tweets, announcements, and on-chain metrics from partner protocols. When answering questions:
1. Base your responses on the provided context (marked with [1], [2], etc.)
2. Be concise but informative - get to the point
3. ALWAYS cite your sources using [1], [2], etc. when referencing specific information
4. If you don't have information about something, say so honestly
5. Be helpful and guide users toward relevant protocols or opportunities
6. When discussing metrics (TVL, APY, etc.), cite the DeFiLlama source

The Last Network includes protocols in: lending, DEXes, derivatives, infrastructure, tooling, and analytics.

Example response format:
"HypurrFi recently announced a new vault strategy [1] which has seen TVL growth of 40% [2]. The team has been focused on..."

Remember: "The last network you'll ever need."`;

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
  
  let context = '';
  
  if (lastUserMessage) {
    const searchResults = await searchKnowledge(lastUserMessage.content, 8);
    
    if (searchResults.length > 0) {
      context = '\n\nRelevant context from partner protocols:\n\n' + 
        searchResults.map((r, i) => 
          `[${i + 1}] ${r.content}\n   Source: @${r.author} | ${r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : 'Unknown date'}`
        ).join('\n\n');
    }
  }
  
  const result = streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT + context,
    messages,
  });

  return result.toTextStreamResponse();
}
