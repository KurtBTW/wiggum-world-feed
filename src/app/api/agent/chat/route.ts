import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchKnowledge } from '@/services/embeddings';
import { parseDepositIntent, generateDepositResponse, getVaultDisplayInfo, WalletContext } from '@/lib/depositIntentParser';

export interface DepositAction {
  type: 'deposit_action';
  vault: 'lhype' | 'khype' | 'xhype' | 'xbtc';
  amount: string;
  stablecoin?: 'USDC' | 'USDT0';
  vaultInfo: {
    name: string;
    token: string;
    apy: string;
    depositAsset: string;
  };
}

const SYSTEM_PROMPT = `You are Last Agent, an AI assistant for Last Network - a gated DeFi membership network on Hyperliquid.

Your role is to help users:
- Understand partner protocols and their recent activities
- Make deposits into yield vaults (you can execute these!)
- Get announcements and updates from the network
- Analyze market insights and protocol comparisons
- Navigate the Last Network ecosystem
- Find yield opportunities and vault strategies on HyperEVM

You have access to real-time tweets, announcements, and on-chain metrics from partner protocols. When answering questions:
1. Base your responses on the provided context (marked with [1], [2], etc.)
2. Be concise but informative - get to the point
3. ALWAYS cite your sources using [1], [2], etc. when referencing specific information
4. If you don't have information about something, say so honestly
5. Be helpful and guide users toward relevant protocols or opportunities
6. When discussing metrics (TVL, APY, etc.), cite sources when available

AVAILABLE YIELD VAULTS (you can help users deposit into these):
1. **Kinetiq (kHYPE)** - Variable APY, deposit native HYPE, liquid staking protocol
2. **Looping Collective (LHYPE)** - Variable APY, deposit native HYPE, automated looping strategy
3. **Liminal xHYPE** - Variable APY, deposit USDC/USDT0, delta-neutral HYPE exposure
4. **Liminal xBTC** - Variable APY, deposit USDC/USDT0, delta-neutral BTC exposure

When users want to deposit, stake, or earn yield:
- If they specify a vault and amount, confirm you'll help them execute it
- If they're unsure which vault, explain the options and APYs
- Mention they can say things like "deposit 10 HYPE into Kinetiq" or "stake 100 HYPE"

The Last Network includes protocols in: lending, DEXes, derivatives, infrastructure, tooling, and analytics.

Example response format:
"HypurrFi recently announced a new vault strategy [1] which has seen TVL growth of 40% [2]. The team has been focused on..."

Remember: "The last network you'll ever need."`;

export async function POST(req: Request) {
  const { messages, walletContext } = await req.json();
  
  const typedWalletContext: WalletContext | undefined = walletContext;
  const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
  
  if (lastUserMessage) {
    const depositIntent = parseDepositIntent(lastUserMessage.content, typedWalletContext);
    
    if (depositIntent.detected && depositIntent.vault && depositIntent.amount) {
      const vaultInfo = getVaultDisplayInfo(depositIntent.vault);
      const action: DepositAction = {
        type: 'deposit_action',
        vault: depositIntent.vault,
        amount: depositIntent.amount,
        stablecoin: depositIntent.stablecoin,
        vaultInfo: {
          name: vaultInfo.name,
          token: vaultInfo.token,
          apy: vaultInfo.apy,
          depositAsset: vaultInfo.depositAsset,
        },
      };
      
      return Response.json({
        action,
        message: `I'll help you deposit ${depositIntent.amount} ${vaultInfo.depositAsset} into ${vaultInfo.name} (${vaultInfo.apy} APY). Please confirm the transaction below.`,
      });
    }
    
    if (depositIntent.detected && !depositIntent.vault) {
      return Response.json({
        message: generateDepositResponse(depositIntent),
      });
    }
    
    if (depositIntent.detected && !depositIntent.amount) {
      return Response.json({
        message: generateDepositResponse(depositIntent),
      });
    }
  }
  
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
  
  let walletInfo = '';
  if (typedWalletContext?.address) {
    walletInfo = `\n\nUSER WALLET INFO:
- Address: ${typedWalletContext.address}
- HYPE Balance: ${parseFloat(typedWalletContext.hypeBalance).toFixed(4)} HYPE
- USDC Balance: ${parseFloat(typedWalletContext.usdcBalance).toFixed(2)} USDC
- USDT0 Balance: ${parseFloat(typedWalletContext.usdt0Balance).toFixed(2)} USDT0

When the user asks to deposit "all", "half", or a percentage, calculate the actual amount from their balance.`;
  }
  
  const result = streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT + walletInfo + context,
    messages,
  });

  return result.toTextStreamResponse();
}
