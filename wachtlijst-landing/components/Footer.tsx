import { Linkedin, Twitter } from 'lucide-react';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Voor Opvang', href: '#opvang' },
      { label: 'Voor Ouders', href: '#ouders' },
      { label: 'Features', href: '#features' },
      { label: 'Prijzen', href: '#pricing' },
    ],
  },
  {
    title: 'Bedrijf',
    links: [
      { label: 'Over ons', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Vacatures', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Algemene Voorwaarden', href: '#' },
      { label: 'AVG Informatie', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>hallo@wachtlijsthelderheid.nl</li>
              <li>+31 20 123 4567</li>
              <li className="flex items-center gap-3 pt-2">
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between text-sm">
          <p>&copy; 2026 WachtlijstHelderheid. Alle rechten voorbehouden.</p>
          <p className="mt-2 sm:mt-0 text-gray-500">
            Gemaakt met zorg voor kinderopvang in Nederland
          </p>
        </div>
      </div>
    </footer>
  );
}
