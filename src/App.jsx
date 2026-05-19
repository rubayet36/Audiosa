import { BrowserRouter as Router, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Compass, Home as HomeIcon, Library as LibraryIcon, Search, Settings, Waves } from 'lucide-react';
import Home from './pages/Home';
import Browse from './pages/Browse';
import SearchPage from './pages/Search';
import Library from './pages/Library';
import SettingsPage from './pages/Settings';
import Player from './components/Player';
import InstallPrompt from './components/InstallPrompt';

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/browse', label: 'Browse', icon: Compass },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/library', label: 'Library', icon: LibraryIcon },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function App() {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-[#08090c] text-white">
        <nav className="hidden w-64 flex-shrink-0 flex-col border-r border-white/8 bg-black/30 p-5 backdrop-blur-xl md:flex">
          <div className="mb-9 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
              <Waves className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Audiosa</h1>
              <p className="text-xs text-white/35">Music PWA</p>
            </div>
          </div>
          <div className="space-y-1 flex-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-black shadow-lg shadow-black/20'
                      : 'text-white/55 hover:bg-white/6 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-xs text-white/35">
            Proxy: localhost:3001
          </div>
        </nav>

        <main className="relative flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pb-40 md:pb-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<Library />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Player />
          <nav className="absolute bottom-24 left-0 right-0 z-40 grid grid-cols-5 border-t border-white/8 bg-black/70 px-2 py-2 backdrop-blur-xl md:hidden">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition-colors ${
                    isActive ? 'bg-white text-black' : 'text-white/55'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <InstallPrompt />
        </main>
      </div>
    </Router>
  );
}

export default App;
