'use client';

import { AuthProvider } from "./components/Auth/AuthProvider";

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
