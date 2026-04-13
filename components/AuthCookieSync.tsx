"use client"

import { useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export const syncSessionCookie = (session: { access_token: string; refresh_token: string } | null) => {
    if (typeof document === 'undefined') return;
    
    const hostname = window.location.hostname;
    const isProd = hostname.endsWith('gameforsmart.com');
    const domainStr = isProd ? '; domain=.gameforsmart.com' : '';
    const secureStr = isProd ? '; secure' : '';

    if (session) {
        const value = `${session.access_token}|${session.refresh_token}`;
        document.cookie = `gfs-session=${encodeURIComponent(value)}${domainStr}; path=/; max-age=604800${secureStr}; samesite=lax`;
    } else {
        document.cookie = `gfs-session=${domainStr}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureStr}; samesite=lax`;
    }
};

export default function AuthCookieSync() {
    useEffect(() => {
        const supabase = getSupabaseBrowserClient()
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                // Kita hanya peduli ketika token direfresh oleh background process Supabase
                // SIGNED_IN dan SIGNED_OUT sudah dihandle oleh Server Actions
                if (event === 'TOKEN_REFRESHED' && session) {
                    console.log('[AuthCookieSync] Token refreshed, syncing gfs-session...')
                    syncSessionCookie({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token
                    })
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])
    
    return null
}
