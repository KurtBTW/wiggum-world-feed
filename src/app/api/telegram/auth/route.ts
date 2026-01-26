import { NextResponse } from 'next/server';
import { isAuthenticated, sendCode, signIn } from '@/services/telegram';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    return NextResponse.json({ authenticated });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: String(error) });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phoneNumber, phoneCode, phoneCodeHash, password } = body;

    if (action === 'sendCode') {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
      }
      const result = await sendCode(phoneNumber);
      return NextResponse.json({ success: true, phoneCodeHash: result.phoneCodeHash });
    }

    if (action === 'signIn') {
      if (!phoneNumber || !phoneCode || !phoneCodeHash) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const result = await signIn(phoneNumber, phoneCode, phoneCodeHash, password);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
