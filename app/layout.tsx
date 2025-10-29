import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Go Get Business - Agrégateur d\'offres d\'emploi',
  description: 'Trouvez votre prochain emploi parmi les offres des meilleures entreprises technologiques françaises',
  keywords: 'emploi, job, recrutement, développeur, IT, technologie, France',
  authors: [{ name: 'Go Get Business' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Compact Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between">
                {/* Left side - Logo and tagline */}
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-bold text-blue-600">
                    Go Get Business
                  </h1>
                  <span className="hidden md:block text-sm text-gray-600 pl-4 border-l border-gray-300">
                    Agrégateur d&apos;offres d&apos;emploi
                  </span>
                </div>
                
                {/* Right side - Status and details */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="hidden sm:inline">7/7 scrapers opérationnels</span>
                    <span className="sm:hidden">7/7 actifs</span>
                  </div>
                  <span className="hidden md:inline text-sm text-gray-500">
                    Powered by Next.js
                  </span>
                </div>
              </div>
            </div>
          </header>
          
          <main>
            {children}
          </main>
          
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-sm text-gray-500">
                <p>© 2024 Go Get Business. Tous droits réservés.</p>
                <p className="mt-2">
                  Données mises à jour automatiquement depuis les sites des entreprises partenaires
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}