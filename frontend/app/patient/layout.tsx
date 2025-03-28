// app/patient/layout.tsx
import Link from "next/link";
import { ReactNode } from "react";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* Navbar - static across patient routes */}
      <nav>
        <ul>
          <li>
            <Link href="/patient/home">Home</Link>
          </li>
          <li>
            <Link href="/patient/prescriptions">Prescriptions</Link>
          </li>
          <li>
            <Link href="/patient/records">Records</Link>
          </li>
        </ul>
      </nav>

      {/* Page Content - dynamic based on the route */}
      <div>{children}</div>
    </div>
  );
}
