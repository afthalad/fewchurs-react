import { FewchursBoard } from "@fewchurs/next";

export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  return (
    <main>
      <FewchursBoard labels={{ title: "What should we build next?" }} />
    </main>
  );
}
