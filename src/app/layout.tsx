import { Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'
import "./globals.css";
import VerifyAuthProvider from "@/components/verifyAuthProvider";


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata = {
  title: 'aarusdb',
  description: 'Anti Armed Robbery Unit Suspect Database',
}

export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <VerifyAuthProvider>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div suppressHydrationWarning >
              <header className="flex justify-center items-center p-4 gap-4 ">
                <SignedOut>
                  <SignInButton/>
                  <SignUpButton/>              
                    </SignedOut>
                <SignedIn>
                </SignedIn>
              </header>
              {children}
            </div>
          </ThemeProvider>
        </ClerkProvider>
      </VerifyAuthProvider>
      </body>
    </html>
  )
}