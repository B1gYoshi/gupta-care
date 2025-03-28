"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /patient/home when visiting /patient
    router.push("/patient/home");
  }, [router]);

  return null; // No UI to render since we're just redirecting
}