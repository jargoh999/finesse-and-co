import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from '@/app/providers';
import { ThemeProvider } from '@/contexts/ThemeContext';

// import { AssistantButton } from '@/components/AssistantButton';
import { AutoSaveUserData } from '@/components/AutoSaveUserData';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { SecurityFeatures } from '@/components/SecurityFeatures';
import { UnauthorizedRedirect } from '@/components/UnauthorizedRedirect';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Szecurium - Elite Digital Security Vault',
    description: 'Your personal fortress of digital security. Military-grade encryption, zero-trust architecture, and premium privacy protection.',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    manifest: '/manifest.json',
    themeColor: '#f59e0b',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black',
        title: 'Szecurium',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#f59e0b" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                <meta name="apple-mobile-web-app-title" content="Szecurium" />
            </head>
            <body className={inter.className}>
                <ThemeProvider>
                    <Providers>
                        <SecurityFeatures />
                        {children}
                        {/* <AssistantButton /> */}
                        <AutoSaveUserData />
                        <ServiceWorkerRegistration />
                        <UnauthorizedRedirect />
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
