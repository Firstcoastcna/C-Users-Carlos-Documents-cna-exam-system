import { Suspense } from "react";
import OwnerAdminsClient from "./OwnerAdminsClient";

export default function OwnerAdminsPage() {
  return (
    <Suspense fallback={null}>
      <OwnerAdminsClient />
    </Suspense>
  );
}
