import { NextResponse } from "next/server";

export const revalidate = 60;

type Quote = { price: number | null; change: number | null };

const crypto = [
  { id: "bitcoin", symbol: "BTC/USD", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH/USD", name: "Ethereum" },
  { id: "solana", symbol: "SOL/USD", name: "Solana" },
];

const traditional = [
  { id: "nasdaq", symbol: "NASDAQ", name: "Nasdaq Composite", yahooSymbol: "%5EIXIC" },
  { id: "dow", symbol: "DOW JONES", name: "Dow Jones Industrial Average", yahooSymbol: "%5EDJI" },
  { id: "spx", symbol: "S&P 500", name: "S&P 500", yahooSymbol: "%5EGSPC" },
  { id: "gold", symbol: "GOLD", name: "Gold Futures", yahooSymbol: "GC%3DF" },
  { id: "silver", symbol: "SILVER", name: "Silver Futures", yahooSymbol: "SI%3DF" },
];

async function yahooQuote(symbol: string): Promise<Quote> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2d&interval=1d`, {
      headers: { "User-Agent": "Better-Wealth-Market-Ticker/1.0" },
      next: { revalidate },
    });
    if (!response.ok) return { price: null, change: null };
    const data = await response.json() as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number } }> } };
    const meta = data.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? null;
    const previousClose = meta?.chartPreviousClose ?? meta?.previousClose ?? null;
    return { price, change: price !== null && previousClose ? ((price - previousClose) / previousClose) * 100 : null };
  } catch {
    return { price: null, change: null };
  }
}

export async function GET() {
  const cryptoRequest = fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true", { next: { revalidate } });
  const [cryptoResult, ...traditionalQuotes] = await Promise.allSettled([cryptoRequest, ...traditional.map((instrument) => yahooQuote(instrument.yahooSymbol))]);
  const prices = cryptoResult.status === "fulfilled" && cryptoResult.value.ok
    ? await cryptoResult.value.json() as Record<string, { usd?: number; usd_24h_change?: number }>
    : {};
  const cryptoInstruments = crypto.map((instrument) => ({ ...instrument, price: prices[instrument.id]?.usd ?? null, change: prices[instrument.id]?.usd_24h_change ?? null }));
  const traditionalInstruments = traditional.map((instrument, index) => {
    const result = traditionalQuotes[index];
    const quote = result.status === "fulfilled" ? result.value : { price: null, change: null };
    return { id: instrument.id, symbol: instrument.symbol, name: instrument.name, ...quote };
  });
  const instruments = [...traditionalInstruments, ...cryptoInstruments];
  return NextResponse.json({ live: instruments.some((instrument) => instrument.price !== null), instruments });
}
