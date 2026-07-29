"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

const LogoutPage = () => {
  useEffect(() => {
    signOut({ callbackUrl: "/sign-in" });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
};

export default LogoutPage;
