'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Prijzen', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow ${
        scrolled ? 'shadow-md border-b border-gray-100' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="text-lg font-bold text-gray-900">
            WachtlijstHelderheid
          </a>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              Start Gratis Trial
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-3 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#"
            className="block py-3 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </a>
          <a
            href="#pricing"
            className="mt-2 block w-full text-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Start Gratis Trial
          </a>
        </div>
      )}
    </nav>
  );
}
