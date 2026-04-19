import { Suspense } from "react";
import ReportsClient from "./ReportsClient";

function ReportsFallback() {
  return <main style={{ maxWidth: 920, margin: "24px auto", padding: 20 }}>Loading your report...</main>;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsFallback />}>
      <ReportsClient />
    </Suspense>
  );
}
