import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "white", backgroundColor: "#060B16" }}>
      <h2 style={{ marginBottom: "1rem" }}>404 - Page Not Found</h2>
      <Link
        href="/"
        style={{ padding: "0.5rem 1rem", backgroundColor: "#1E6BFF", color: "white", borderRadius: "0.5rem", textDecoration: "none" }}
      >
        Go Home
      </Link>
    </div>
  );
}
