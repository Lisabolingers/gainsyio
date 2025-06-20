import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, Settings, Database, FileText, Menu, X, LogOut, User, Bell, Sun, Moon, Shield, ChevronDown, AlertTriangle, BarChart3, Terminal } from 'lucide-react';

const SuperAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [systemExpanded, setSystemExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Super admin navigation items
  const navigation = [
    { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
    { name: 'User Management', href: '/superadmin/users', icon: Users },
    { name: 'Analytics', href: '/superadmin/analytics', icon: BarChart3 },
    { 
      name: 'System', 
      href: '/superadmin/system', 
      icon: Settings,
      hasSubmenu: true,
      submenu: [
        { name: 'Database', href: '/superadmin/system/database', icon: Database },
        { name: 'Logs', href: '/superadmin/system/logs', icon: FileText },
        { name: 'API Keys', href: '/superadmin/system/api-keys', icon: Terminal },
      ]
    },
  ];

  React.useEffect(() => {
    if (location.pathname === '/superadmin/system') {
      setSystemExpanded(true);
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/superadmin') {
      return location.pathname === '/superadmin';
    }
    
    // For system main page
    if (href === '/superadmin/system') {
      return location.pathname === '/superadmin/system';
    }
    
    // For other routes, check if current path starts with the href
    return location.pathname.startsWith(href);
  };

  const toggleSystemSubmenu = () => {
    setSystemExpanded(!systemExpanded);
  };

  const handleSubmenuClick = () => {
    setSystemExpanded(true);
    setSidebarOpen(false);
  };

  // Switch to regular admin panel
  const switchToRegularAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 dark:bg-gray-950 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800 dark:border-gray-800 flex-shrink-0">
          <Link to="/superadmin" className="flex items-center space-x-2">
            <div className="relative">
              <svg width="32" height="32" viewBox="0 0 5000 5000" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3356.85,978.17c99.43-18.98,200.72-26.23,301.81-21.71,105.68,1.85,215.66,9.16,289.55,94.07,129.18,148.48,92.17,376.17,96.29,559.77h339.94V574.84c-114.01,52.74-238.61,78.47-364.14,75.23-365.62,9.76-735.12-44.33-1091.35,65.98-381.03,117.99-696.21,370.73-907.15,691.7h453.39v851.45h-738.9c-8.62,144.01,1.37,290.22,31.95,435.22,4.79,22.7,10.05,45.3,15.76,67.81h835.12c-129.85-664.1,21.65-1629.36,737.72-1784.06Z" fill="#f15a29" fillRule="evenodd"/>
                <path d="M3264.87,2271.57v305.47c117.62-.05,230.42,46.68,313.57,129.88,83.19,83.15,129.92,195.95,129.92,313.56v673.36c-75.28,4.76-150.79,2.64-225.65-6.34-65.06-7.05-126.61-20.08-184.63-38.52v354.84c180.65,2.7,363.68-11.66,542.57-8.16,182.02,3.56,374.73-14.53,543.71,62.92l-4.03-1019.59c0-255.12,206.82-461.95,462-461.95v-305.47h-1577.45Z" fill="#f15a29" fillRule="evenodd"/>
                <path d="M3298.07,3648.97v-886.74h-678.93c15.59,79.73,35.23,155.12,58.44,224.24,106.5,317.12,314.39,565.21,620.49,662.5Z" fill="#f15a29" fillRule="evenodd"/>
                <path d="M1784.01,2762.23h-188.82v1702.88h1702.88v-461.29c-115.21-1.72-229.45-10.38-341.03-35.05-585.44-129.42-1027.62-633.75-1173.03-1206.53Z" fill="#f15a29" fillRule="evenodd"/>
                <path d="M1623.75,1407.75v851.45h112.55c18.22-304.46,119.63-599.05,285.51-851.45h-398.05Z" fill="#f15a29" fillRule="evenodd"/>
                <rect x="157.68" y="1140.19" width="572.26" height="572.25" fill="#f15a29"/>
                <rect x="474.79" y="1985.55" width="961.56" height="961.59" fill="#f15a29"/>
                <rect x="1315.45" y="652.12" width="501.25" height="501.25" fill="#f15a29"/>
                <rect x="459.65" y="534.9" width="250.62" height="250.61" fill="#f15a29"/>
                <rect x="1113.09" y="1378.46" width="250.64" height="250.62" fill="#f15a29"/>
              </svg>
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
                <Shield className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">Gainsy</span>
              <span className="text-xs text-orange-500">Süper Admin Panel</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {/* Main menu item */}
                {item.hasSubmenu ? (
                  <button
                    type="button"
                    onClick={toggleSystemSubmenu}
                    className={`
                      group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-orange-900/30 text-orange-400'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive(item.href)
                          ? 'text-orange-500'
                          : 'text-gray-400 group-hover:text-gray-300'
                        }
                      `} />
                      {item.name}
                    </div>
                    <div className={`transition-transform duration-200 ${
                      systemExpanded ? 'rotate-180' : 'rotate-0'
                    }`}>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-orange-900/30 text-orange-400'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive(item.href)
                        ? 'text-orange-500'
                        : 'text-gray-400 group-hover:text-gray-300'
                      }
                    `} />
                    {item.name}
                  </Link>
                )}

                {/* Submenu items */}
                {item.hasSubmenu && systemExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                          ${isActive(subItem.href)
                            ? 'bg-orange-900/30 text-orange-400'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                        onClick={handleSubmenuClick}
                      >
                        <subItem.icon className={`
                          mr-3 h-4 w-4 flex-shrink-0
                          ${isActive(subItem.href)
                            ? 'text-orange-500'
                            : 'text-gray-400 group-hover:text-gray-300'
                          }
                        `} />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Switch to Regular Admin */}
          <div className="mt-6 px-3">
            <button
              onClick={switchToRegularAdmin}
              className="w-full flex items-center justify-center px-4 py-2 border border-orange-600 text-orange-500 rounded-lg hover:bg-orange-900/20 transition-colors"
            >
              <span className="mr-2">Normal Panel'e Geç</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email}
              </p>
              <p className="text-xs text-orange-500 flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Süper Admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-gray-900 dark:bg-gray-950 shadow-sm border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-gray-200"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Super Admin Badge */}
              <div className="hidden sm:flex items-center px-3 py-1 bg-orange-900/30 rounded-full">
                <Shield className="h-4 w-4 text-orange-500 mr-2" />
                <span className="text-sm font-medium text-orange-400">Süper Admin Panel</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-200">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800"
                >
                  <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-300">
                    {user?.email?.split('@')[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                    <div className="py-1">
                      <Link
                        to="/superadmin/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        to="/superadmin/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                      <hr className="my-1 border-gray-700" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>

      {/* Click outside to close dropdown */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;