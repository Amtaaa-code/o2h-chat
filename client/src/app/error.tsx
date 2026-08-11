"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "white", backgroundColor: "#060B16" }}>
      <h2 style={{ marginBottom: "1rem" }}>Something went wrong!</h2>
      <button
        onClick={() => reset()}
        style={{ padding: "0.5rem 1rem", backgroundColor: "#1E6BFF", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
