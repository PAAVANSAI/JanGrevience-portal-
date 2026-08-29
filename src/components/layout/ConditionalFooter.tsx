"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Dashboard / app routes where the global public footer should not be visible
  const hiddenRoutes = ["/admin", "/department-admin", "/citizen", "/officer", "/onboarding", "/login", "/register"];
  
  // If pathname hasn't resolved yet, hide footer to prevent flash
  if (!pathname) {
    return null;
  }
  
  const shouldHideFooter = hiddenRoutes.some(route => pathname.startsWith(route));
  
  if (shouldHideFooter) {
    return null;
  }
  
  return <Footer />;
}
