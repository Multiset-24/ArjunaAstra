import { ImageResponse } from "next/og";

export const alt = "teacher — calm, interactive learning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#17110d",
          color: "#ece1d1",
          padding: "72px 80px",
          fontFamily: "geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 999,
              border: "6px solid #d39d6b",
              marginRight: 18,
            }}
          />
          <div style={{ fontSize: 34, color: "#d39d6b" }}>teacher</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, lineHeight: 1.15, maxWidth: 980 }}>Learn slowly. Think clearly. Solve a lot.</div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: "#c4b4a1", marginTop: 24, maxWidth: 860 }}>
            From zero to Codeforces Candidate Master, plus system design, low-level design, and AI engineering.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
