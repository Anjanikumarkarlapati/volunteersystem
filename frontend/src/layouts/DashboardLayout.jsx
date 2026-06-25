import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Compass,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareDiff,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  Users,
  X,
  PanelLeftClose,
  PanelLeft,
  Trophy,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { notificationService } from '../services/resources.js';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Discover', to: '/discover', icon: Compass, roles: ['volunteer'], group: 'Volunteer' },
  {
    label: 'Build your squad',
    to: '/squads',
    icon: Trophy,
    roles: ['volunteer'],
    group: 'Volunteer',
  },
  { label: 'Opportunities', to: '/opportunities', icon: ClipboardList, group: 'Workflows' },
  { label: 'Applications', to: '/applications', icon: Users, group: 'Workflows' },
  { label: 'Events', to: '/events', icon: CalendarDays, group: 'Workflows' },
  { label: 'Feedback', to: '/feedback', icon: MessageSquareDiff, group: 'Workflows' },
  { label: 'Profile', to: '/profile', icon: User, group: 'Account' },
  { label: 'Settings', to: '/settings', icon: Settings, group: 'Account' },
  { label: 'Reports', to: '/reports', icon: BarChart3, group: 'Account' },
  { label: 'Notifications', to: '/notifications', icon: Bell, group: 'Account' },
  { label: 'Users', to: '/admin/users', icon: Users, roles: ['admin'], group: 'Admin' },
  {
    label: 'Organizations',
    to: '/admin/organizations',
    icon: Building2,
    roles: ['admin'],
    group: 'Admin',
  },
  {
    label: 'Approvals',
    to: '/admin/approvals',
    icon: ClipboardList,
    roles: ['admin'],
    group: 'Admin',
  },
  {
    label: 'Assign Tasks',
    to: '/admin/tasks',
    icon: CalendarDays,
    roles: ['admin'],
    group: 'Admin',
  },
];

const roleLabels = {
  admin: 'Admin Suite',
  organization: 'Org Suite',
  volunteer: 'Volunteer Suite',
};

function getInitials(name = '') {
  return (
    name
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'VH'
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Sidebar({ collapsed, onToggle, unreadCount, user }) {
  const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));
  const groups = useMemo(() => {
    return visibleNav.reduce((acc, item) => {
      acc[item.group] = [...(acc[item.group] || []), item];
      return acc;
    }, {});
  }, [visibleNav]);

  return (
    <aside
      className={`flex h-full flex-col bg-surface-container border-r border-outline-variant shadow-sm transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[272px]'
      }`}
    >
      {/* Logo */}
      <div
        className={`flex h-16 items-center border-b border-outline-variant shrink-0 ${
          collapsed ? 'justify-center px-0' : 'justify-between px-5'
        }`}
      >
        <Link
          to="/dashboard"
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <HeartHandshake className="h-5 w-5 text-on-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface tracking-tight leading-tight">
                Volunteer Hub
              </p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                {roleLabels[user.role]}
              </p>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-2">
            {!collapsed && (
              <p className="mb-1 px-6 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant opacity-60">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 transition-all duration-200 ${
                      collapsed
                        ? 'justify-center mx-auto w-10 h-10 rounded-full my-1 ml-4'
                        : 'px-4 py-3 mx-2 rounded-lg'
                    } ${
                      isActive
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isActive ? '' : 'group-hover:scale-110'
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate text-xs font-semibold uppercase tracking-widest">
                            {item.label}
                          </span>
                          {item.to === '/notifications' && unreadCount > 0 && (
                            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-on-error leading-none">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
      {collapsed ? (
        <div className="border-t border-outline-variant p-2 flex justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-on-surface text-[10px] font-bold text-on-primary shadow-sm">
            {getInitials(user.name)}
          </div>
        </div>
      ) : (
        <div className="border-t border-outline-variant p-3">
          <div className="rounded-2xl bg-surface-container-high p-3 border border-outline-variant">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-surface text-[10px] font-bold text-on-primary shadow-sm">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-on-surface">{user.name}</p>
                <p className="truncate text-[10px] text-on-surface-variant">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const refreshUnread = () => {
    notificationService
      .list()
      .then(data => {
        const unread = Array.isArray(data) ? data.filter(n => !n.is_read).length : 0;
        setUnreadCount(unread);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshUnread();
  }, [location.pathname]);

  useEffect(() => {
    const handler = e => {
      if (e.detail && typeof e.detail.count === 'number') {
        setUnreadCount(e.detail.count);
      } else {
        refreshUnread();
      }
    };
    window.addEventListener('notif-read', handler);
    return () => window.removeEventListener('notif-read', handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));
  const currentPage =
    visibleNav.find(item => location.pathname.startsWith(item.to))?.label || 'Workspace';

  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{ backgroundColor: '#faf9f5', color: '#1b1c1a' }}
    >
      {/* Desktop sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 hidden lg:block transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[272px]'
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          unreadCount={unreadCount}
          user={user}
        />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-[70] lg:hidden"
              initial={{ x: -272 }}
              animate={{ x: 0 }}
              exit={{ x: -272 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            >
              <Sidebar
                collapsed={false}
                onToggle={() => {}}
                unreadCount={unreadCount}
                user={user}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[272px]'}`}
      >
        <header className="sticky top-0 z-50 h-16 border-b border-outline-variant bg-surface">
          <div className="flex h-full items-center gap-3 px-4 sm:px-6">
            {/* Mobile menu toggle */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container transition-colors lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              onClick={() => setCollapsed(v => !v)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            {/* Page label */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant leading-none mb-0.5">
                {getGreeting()}
              </span>
              <span className="text-sm font-bold text-on-surface leading-none">{currentPage}</span>
            </div>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="relative ml-auto hidden md:flex items-center max-w-xs w-full"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-full border border-outline-variant bg-surface-container-low pl-10 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Search resources, events..."
                aria-label="Search"
              />
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-on-error ring-2 ring-white leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Theme toggle */}
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high transition-colors"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isDark ? 'sun' : 'moon'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-outline-variant mx-1" />

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  className="flex h-9 items-center gap-2.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3 hover:bg-surface-container transition-colors"
                  onClick={() => setProfileOpen(v => !v)}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-on-surface text-[10px] font-bold text-on-primary">
                    {getInitials(user.name)}
                  </span>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-bold text-on-surface leading-none max-w-24 truncate">
                      {user.name?.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter leading-none mt-0.5">
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-on-surface-variant transition-transform duration-200 ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-[24px] border border-outline-variant p-2 z-[100]"
                      style={{
                        backgroundColor: '#ffffff',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
                        border: '1px solid #d0d0cc',
                      }}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      {/* User info */}
                      <div className="bg-surface-container rounded-2xl p-4 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface text-sm font-bold text-on-primary shrink-0">
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-on-surface">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div>
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Settings className="h-4 w-4 text-on-surface-variant" />
                          Account Settings
                        </Link>
                        <Link
                          to="/notifications"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Bell className="h-4 w-4 text-on-surface-variant" />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-on-error leading-none">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                        <div className="my-1.5 border-t border-outline-variant" />
                        <button
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-error hover:bg-error-container transition-colors"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-0 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
