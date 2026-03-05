import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WachtlijstHelderheid - Transparant Wachtlijstbeheer voor Kinderopvang',
  description:
    'Stop met wachtlijst chaos. Start met transparantie. Bespaar 12 uur per week en geef ouders duidelijkheid over hun wachtlijstpositie.',
  keywords: [
    'wachtlijst',
    'kinderopvang',
    'BSO',
    'KDV',
    'wachtlijstbeheer',
    'transparantie',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
