'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authToken, isVerified } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isAuthPage = pathname?.startsWith('/auth');
    const isVerifyPage = pathname?.startsWith('/auth/verify');
    // Events pages are public — users can browse without logging in
    const isEventsPage = pathname?.startsWith('/events');
    const isPublicPage = pathname === '/' || isAuthPage || isEventsPage;

    if (!authToken && !isPublicPage) {
      router.push('/auth/login');
    } else if (authToken) {
      if (!isVerified && !isVerifyPage) {
        router.push('/auth/verify');
      } else if (isVerified && isAuthPage) {
        router.push('/');
      }
    }
  }, [authToken, isVerified, pathname, router, mounted]);

  const isAuthPage = pathname?.startsWith('/auth');
  const isVerifyPage = pathname?.startsWith('/auth/verify');
  const isEventsPage = pathname?.startsWith('/events');
  const isPublicPage = pathname === '/' || isAuthPage || isEventsPage;

  // Prevent initial flicker/flash of content before layout mounts on the client
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050505] text-neutral-400 flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-neutral-600">
            SECURE ROUTE // GATEWAY HANDSHAKE...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to access a secure page, block rendering and show loader (redirection handled by useEffect)
  if (!authToken && !isPublicPage) {
    return (
      <div className="min-h-screen bg-[#050505] text-neutral-400 flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-neutral-600">
            ACCESS DENIED // REDIRECTING TO PORTAL...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
