"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /clinician/home when visiting /clinician
    router.push("/clinician/home");
  }, [router]);

  return null;
}