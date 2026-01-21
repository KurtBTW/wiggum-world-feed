// POST /api/chat - Send chat message and get GPT-5.2 response
import { NextResponse } from 'next/server';
import { processChatMessage, explainItem, getChatHistory, clearChatHistory } from '@/services/chat';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
  boundItemId: z.string().optional(),
  action: z.enum(['message', 'explain', 'history', 'clear']).default('message')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }
    
    const { sessionId, message, boundItemId, action } = parsed.data;
    
    switch (action) {
      case 'explain': {
        if (!boundItemId) {
          return NextResponse.json(
            { error: 'boundItemId required for explain action' },
            { status: 400 }
          );
        }
        const response = await explainItem(sessionId, boundItemId);
        const history = await getChatHistory(sessionId);
        return NextResponse.json({ message: response, history });
      }
      
      case 'history': {
        const history = await getChatHistory(sessionId);
        return NextResponse.json({ history });
      }
      
      case 'clear': {
        await clearChatHistory(sessionId);
        return NextResponse.json({ success: true, message: 'Chat history cleared' });
      }
      
      case 'message':
      default: {
        const response = await processChatMessage(sessionId, message, boundItemId);
        const history = await getChatHistory(sessionId);
        return NextResponse.json({ message: response, history });
      }
    }
  } catch (error) {
    console.error('[API] Error processing chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// GET /api/chat?sessionId=xxx - Get chat history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter required' },
        { status: 400 }
      );
    }
    
    const history = await getChatHistory(sessionId);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('[API] Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
