"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Loader from "@/components/common/Loader";
import { Providers } from './providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      
      // If no token and not already on signin page, redirect to signin
      if (!token && pathname !== '/auth/signin') {
        setIsAuthenticated(false);
        window.location.href = '/auth/signin';
      } else if (token) {
        setIsAuthenticated(true);
      }
    };

    // Check authentication immediately
    checkAuth();

    // Set loading to false after a short delay
    const loadingTimer = setTimeout(() => setLoading(false), 1000);

    // Optional: Add event listener to check auth on token changes
    window.addEventListener('storage', checkAuth);

    // Cleanup
    return () => {
      clearTimeout(loadingTimer);
      window.removeEventListener('storage', checkAuth);
    };
  }, [router, pathname]);

  // If still loading, show loader
  if (loading) {
    return (
      <html lang="en">
        <body suppressHydrationWarning={true}>
          <div className="dark:bg-boxdark-2 dark:text-bodydark">
            <Loader />
          </div>
        </body>
      </html>
    );
  }

  // If not authenticated and not on signin page, don't render anything
  if (isAuthenticated === false) {
    return (
      <html lang="en">
        <body suppressHydrationWarning={true}>
          <div className="dark:bg-boxdark-2 dark:text-bodydark"></div>
        </body>
      </html>
    );
  }

  // If authenticated or on signin page, render normally
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}