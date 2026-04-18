import { Suspense } from "react";
import OwnerSchoolsClient from "./OwnerSchoolsClient";

export default function OwnerSchoolsPage() {
  return (
    <Suspense fallback={null}>
      <OwnerSchoolsClient />
    </Suspense>
  );
}
