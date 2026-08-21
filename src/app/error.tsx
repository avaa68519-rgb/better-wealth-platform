"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><p className="eyebrow">Better Wealth</p><h1>We could not load this page.</h1><p>Please try again. If the issue continues, contact the client services team.</p><button className="button" onClick={() => reset()}>Try again</button></main>;
}
