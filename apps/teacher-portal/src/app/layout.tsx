import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'Shikkhok AI — শিক্ষক পোর্টাল (Teacher Portal)',
  description: 'AI-চালিত পাঠদান, শ্রেণিকক্ষ ও অ্যাসাইনমেন্ট মূল্যায়ন প্ল্যাটফর্ম',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
