import { NextResponse } from "next/server";

export const revalidate = 60;

const instruments = [
  { id: "bitcoin", symbol: "BTC/USD", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH/USD", name: "Ethereum" },
  { id: "solana", symbol: "SOL/USD", name: "Solana" },
];

export async function GET() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true", { next: { revalidate } });
    if (!response.ok) throw new Error("Market provider unavailable");
    const prices = await response.json() as Record<string, { usd?: number; usd_24h_change?: number }>;
    return NextResponse.json({ live: true, instruments: instruments.map((instrument) => ({ ...instrument, price: prices[instrument.id]?.usd ?? null, change: prices[instrument.id]?.usd_24h_change ?? null })) });
  } catch {
    return NextResponse.json({ live: false, instruments: instruments.map((instrument) => ({ ...instrument, price: null, change: null })) }, { status: 200 });
  }
}
