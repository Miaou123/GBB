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
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-primary-600">
                      Go Get Business
                    </h1>
                  </div>
                  <div className="hidden md:block ml-4">
                    <p className="text-sm text-gray-600">
                      Agrégateur d&apos;offres d&apos;emploi
                    </p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Powered by Next.js
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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