import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return and Replacement Policy',
  description:
    'Read Kalamic’s seven-day replacement policy for ceramic products delivered damaged, defective, incorrect or materially different from the order.',
  alternates: { canonical: '/returns' },
  robots: { index: true, follow: true },
};

export default function ReturnsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
