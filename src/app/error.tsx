"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container narrow page" style={{ textAlign: "center", paddingTop: 96 }}>
      <h1 style={{ fontSize: "1.8rem" }}>Something went wrong</h1>
      <p className="muted" style={{ marginTop: 12 }}>Your progress is safe. Try again.</p>
      <p style={{ marginTop: 24 }}>
        <button className="btn" onClick={reset}>
          Try again
        </button>
      </p>
    </div>
  );
}
