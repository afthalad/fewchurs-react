import "@fewchurs/next/styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Fewchurs Next.js example",
  description: "A feature-request board rendered on the server.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: "3rem 1rem", fontFamily: "system-ui, sans-serif", colorScheme: "light dark" }}>
        {children}
      </body>
    </html>
  );
}
