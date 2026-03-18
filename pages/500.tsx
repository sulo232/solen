export default function Custom500() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1A1A2E" }}>Etwas ist schiefgelaufen</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>Bitte versuche es später erneut.</p>
        <a href="/de/" style={{ color: "#38B2AC", marginTop: "1rem", display: "inline-block" }}>Zurück zur Startseite</a>
      </div>
    </div>
  );
}
