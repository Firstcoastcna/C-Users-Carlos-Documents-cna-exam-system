import { Suspense } from "react";
import OwnerIndependentClient from "./OwnerIndependentClient";

export default function OwnerIndependentPage() {
  return (
    <Suspense fallback={null}>
      <OwnerIndependentClient />
    </Suspense>
  );
}
