import { Suspense } from "react";
import OwnerReportsClient from "./OwnerReportsClient";

function ReportsFallback() {
  return <main style={{ maxWidth: 980, margin: "24px auto", padding: 20 }}>Loading report...</main>;
}

export default function OwnerReportsPage() {
  return (
    <Suspense fallback={<ReportsFallback />}>
      <OwnerReportsClient />
    </Suspense>
  );
}