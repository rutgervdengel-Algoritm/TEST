import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

// Icons per design system specificatie
const Icons = {
  // Dashboard - grid/squares icon
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  // Wachtlijst - clipboard-check icon
  waitlist: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  // Nieuwe Plek - plus-circle icon
  newSpot: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  // Matches - shuffle/link icon
  matches: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  // Prioriteitsregels - sliders icon
  rules: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  // Beslissingslog - file-text icon
  log: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  // Analytics - bar-chart icon
  analytics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  // Import/Export - upload-download icon
  importExport: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  ),
  // Logout icon
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  // Hamburger menu icon
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  // Close icon
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export default function Layout({ children, title }: LayoutProps) {
  const { organization, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sluit sidebar bij route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Sluit sidebar bij resize naar desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Icons.dashboard },
    { path: '/waitlist', label: 'Wachtlijst', icon: Icons.waitlist },
    { path: '/spots/new', label: 'Nieuwe Plek', icon: Icons.newSpot },
    { path: '/matches', label: 'Matches', icon: Icons.matches },
    { path: '/rules', label: 'Prioriteitsregels', icon: Icons.rules },
    { path: '/log', label: 'Beslissingslog', icon: Icons.log },
    { path: '/analytics', label: 'Analytics', icon: Icons.analytics },
    { path: '/import-export', label: 'Import / Export', icon: Icons.importExport },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-forest-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - fixed left, full height - Forest green theme */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-forest-500 z-30 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Header met logo */}
        <div className="h-16 flex items-center px-4 border-b border-forest-400">
          <Link to="/" className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo icon - forest groen vierkant met witte letter */}
            <div className="w-9 h-9 bg-terracotta-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg font-serif">W</span>
            </div>
            <span className="font-serif text-white text-lg tracking-tight truncate">WachtlijstHelderheid</span>
          </Link>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 ml-2 text-forest-200 hover:text-white hover:bg-forest-600 rounded-lg flex-shrink-0"
            aria-label="Sluit menu"
          >
            {Icons.close}
          </button>
        </div>

        {/* Organisatie info */}
        <div className="px-4 py-3 border-b border-forest-400">
          <p className="text-white font-medium text-sm truncate">{organization?.name}</p>
          <p className="text-forest-200 text-xs truncate mt-0.5">
            {organization?.type === 'BSO' ? 'Buitenschoolse opvang' : 'Kinderdagverblijf'}
          </p>
        </div>

        {/* Navigatie */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                  ${isActive
                    ? 'bg-white/15 text-white'
                    : 'text-forest-100 hover:bg-forest-600 hover:text-white'
                  }
                `}
              >
                <span className={isActive ? 'text-teal-300' : 'text-forest-200'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-forest-400">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-forest-200 truncate">
                {organization?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-forest-200 hover:text-white rounded-lg hover:bg-forest-600 transition-colors"
              title="Uitloggen"
            >
              {Icons.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - offset by sidebar width on desktop */}
      <main className="md:ml-64 min-h-screen">
        {/* Sticky header - cream/warm style */}
        <header className="h-16 bg-cream-100/90 backdrop-blur-md border-b border-cream-300 flex items-center px-4 md:px-8 sticky top-0 z-10">
          {/* Hamburger menu button - mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 mr-2 text-forest-500 hover:text-forest-700 hover:bg-cream-200 rounded-lg"
            aria-label="Open menu"
          >
            {Icons.menu}
          </button>
          {title && (
            <h1 className="text-xl font-serif font-bold text-forest-600">{title}</h1>
          )}
        </header>

        {/* Content area */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
