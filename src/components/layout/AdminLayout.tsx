import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Zap, LayoutDashboard, Store, Package, BarChart3, BookTemplate as FileTemplate, PlusCircle, Image, Type, Library, Menu, X, LogOut, Settings, User, Bell, Sun, Moon, ChevronDown, ChevronRight } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Stores', href: '/admin/stores', icon: Store },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { 
      name: 'Templates', 
      href: '/admin/templates', 
      icon: FileTemplate,
      hasSubmenu: true,
      submenu: [
        { name: 'Text Templates', href: '/admin/templates/text', icon: Type },
        { name: 'Listing Templates', href: '/admin/templates/listing', icon: FileTemplate },
        { name: 'Mockup Templates', href: '/admin/templates/mockup', icon: Image },
        { name: 'Update Templates', href: '/admin/templates/update', icon: FileTemplate },
        { name: 'Store Images', href: '/admin/store-images', icon: Image },
      ]
    },
    { name: 'Auto Text to Image', href: '/admin/templates/auto-text-to-image', icon: Zap },
    { name: 'My Fonts', href: '/admin/my-font', icon: Type },
    { name: 'Listing', href: '/admin/listing', icon: PlusCircle },
    { name: 'Library', href: '/admin/library', icon: Library },
  ];

  // CRITICAL: Templates submenu'nun açık olup olmayacağını kontrol et - SADECE kullanıcı manuel olarak açarsa
  React.useEffect(() => {
    // Sadece templates ana sayfasındaysa menüyü aç, alt sayfalarda açma
    if (location.pathname === '/admin/templates') {
      setTemplatesExpanded(true);
    }
    // Diğer durumlarda menüyü kapalı bırak (kullanıcı manuel olarak açmadıysa)
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
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    
    // For templates main page
    if (href === '/admin/templates') {
      return location.pathname === '/admin/templates';
    }
    
    // For other routes, check if current path starts with the href
    return location.pathname.startsWith(href);
  };

  // CRITICAL: Templates submenu toggle - kullanıcı kontrolü
  const toggleTemplatesSubmenu = () => {
    setTemplatesExpanded(!templatesExpanded);
  };

  // CRITICAL: Submenu item'ına tıklandığında menüyü açık tut
  const handleSubmenuClick = () => {
    setTemplatesExpanded(true);
    setSidebarOpen(false);
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Link to="/admin" className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Gainsy</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                    onClick={toggleTemplatesSubmenu}
                    className={`
                      group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive(item.href)
                          ? 'text-orange-500'
                          : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        }
                      `} />
                      {item.name}
                    </div>
                    {templatesExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive(item.href)
                        ? 'text-orange-500'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }
                    `} />
                    {item.name}
                  </Link>
                )}

                {/* Submenu items - SADECE kullanıcı açtığında görünür */}
                {item.hasSubmenu && templatesExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                          ${isActive(subItem.href)
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          }
                        `}
                        onClick={handleSubmenuClick}
                      >
                        <subItem.icon className={`
                          mr-3 h-4 w-4 flex-shrink-0
                          ${isActive(subItem.href)
                            ? 'text-orange-500'
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
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
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Free Plan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.email?.split('@')[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      <Link
                        to="/admin/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        to="/admin/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <main className="flex-1 overflow-auto">
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

export default AdminLayout;