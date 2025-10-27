'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { ChatProvider } from '@/contexts/ChatContext';

export function Providers({ children, ...props }: ThemeProviderProps) {
    return (
        <SessionProvider>
            {/* <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                {...props}
            > */}
                <ChatProvider>
                    {children}
                </ChatProvider>
            {/* </NextThemesProvider> */}
        </SessionProvider>
    );
}
