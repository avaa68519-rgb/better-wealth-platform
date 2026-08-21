import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><p className="eyebrow">404</p><h1>That page is not here.</h1><p>Return to the Better Wealth home page to continue.</p><Link className="button" href="/">Back to home</Link></main>;
}
