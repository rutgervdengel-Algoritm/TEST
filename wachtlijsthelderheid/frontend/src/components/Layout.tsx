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
};

export default function Layout({ children, title }: LayoutProps) {
  const { organization, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - fixed left, full height */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar z-30 flex flex-col">
        {/* Header met logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            {/* Logo icon - w-9 h-9 bg-primary-400 rounded-lg */}
            <div className="w-9 h-9 bg-primary-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="font-semibold text-white text-lg tracking-tight">Wait</span>
          </Link>
          {/* Sandbox badge */}
          <span className="bg-amber-400 text-amber-900 text-xs font-medium px-2 py-0.5 rounded">
            Sandbox
          </span>
        </div>

        {/* Organisatie info */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-white font-medium text-sm truncate">{organization?.name}</p>
          <p className="text-gray-400 text-xs truncate mt-0.5">
            {organization?.type === 'BSO' ? 'Buitenschoolse opvang' : 'Kinderdagverblijf'}
          </p>
        </div>

        {/* Navigatie */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${isActive
                    ? 'bg-primary-400/20 text-primary-300'
                    : 'text-gray-300 hover:bg-sidebar-light hover:text-white'
                  }
                `}
              >
                <span className={isActive ? 'text-primary-300' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 truncate">
                {organization?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-sidebar-light transition-colors"
              title="Uitloggen"
            >
              {Icons.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - offset by sidebar width */}
      <main className="ml-64 min-h-screen">
        {/* Sticky header */}
        {title && (
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 sticky top-0 z-20">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </header>
        )}

        {/* Content area */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
