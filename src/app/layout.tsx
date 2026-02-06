import './globals.css'
import Script from 'next/script'
import AppLifecycle from '@/components/AppLifecycle'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata = {
  title: 'Electron',
  description: 'Coding puzzle game'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FV8D69PVFV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FV8D69PVFV');
          `}
        </Script>
      </head>
      <body>
        <AppLifecycle />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
