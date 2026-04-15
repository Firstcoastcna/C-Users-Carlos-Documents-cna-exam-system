import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

function ResetPasswordFallback() {
  return <main style={{ maxWidth: 640, margin: "24px auto", padding: 20 }}>Loading reset form...</main>;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
