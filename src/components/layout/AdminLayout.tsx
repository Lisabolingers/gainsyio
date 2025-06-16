import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Store, Package, BarChart3, BookTemplate as FileTemplate, PlusCircle, Image, Type, Library, Menu, X, LogOut, Settings, User, Bell, Sun, Moon, ChevronDown, Clock, Upload, Brain, Shield, Users } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const [listingExpanded, setListingExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut, isAdminOrSuperAdmin, isSuperAdmin } = useAuth();
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
    { 
      name: 'Listing', 
      href: '/admin/listing', 
      icon: PlusCircle,
      hasSubmenu: true,
      submenu: [
        { name: 'Research', href: '/admin/listing', icon: PlusCircle },
        { name: 'Upload Design', href: '/admin/listing/upload-design', icon: Upload },
      ]
    },
    { name: 'Auto Text to Image', href: '/admin/templates/auto-text-to-image', icon: PlusCircle },
    { name: 'My Fonts', href: '/admin/my-font', icon: Type },
    { name: 'Library', href: '/admin/library', icon: Library },
    { name: 'Temporary Files', href: '/admin/temporary-files', icon: Clock },
    { name: 'AI Agent', href: '/admin/ai-agent', icon: Brain },
  ];

  // Super admin only navigation items
  const superAdminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'System Settings', href: '/admin/system', icon: Settings },
  ];

  // CRITICAL: Templates submenu'nun açık olup olmayacağını kontrol et - SADECE kullanıcı manuel olarak açarsa
  React.useEffect(() => {
    // Sadece templates ana sayfasındaysa menüyü aç, alt sayfalarda açma
    if (location.pathname === '/admin/templates') {
      setTemplatesExpanded(true);
    }
    
    // Listing alt menüsü için kontrol
    if (location.pathname === '/admin/listing') {
      setListingExpanded(true);
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
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    
    // For templates main page
    if (href === '/admin/templates') {
      return location.pathname === '/admin/templates';
    }
    
    // For listing main page
    if (href === '/admin/listing') {
      return location.pathname === '/admin/listing';
    }
    
    // For other routes, check if current path starts with the href
    return location.pathname.startsWith(href);
  };

  // CRITICAL: Templates submenu toggle - kullanıcı kontrolü
  const toggleTemplatesSubmenu = () => {
    setTemplatesExpanded(!templatesExpanded);
  };

  // CRITICAL: Listing submenu toggle - kullanıcı kontrolü
  const toggleListingSubmenu = () => {
    setListingExpanded(!listingExpanded);
  };

  // CRITICAL: Submenu item'ına tıklandığında menüyü açık tut
  const handleSubmenuClick = () => {
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
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Gainsy</span>
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
            {/* Regular navigation items */}
            {navigation.map((item) => (
              <div key={item.name}>
                {/* Main menu item */}
                {item.hasSubmenu ? (
                  <button
                    type="button"
                    onClick={item.name === 'Templates' ? toggleTemplatesSubmenu : toggleListingSubmenu}
                    className={`
                      group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href) && !((item.name === 'Research' && location.pathname === '/admin/listing') || (item.name === 'Templates' && location.pathname === '/admin/templates'))
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive(item.href) && !((item.name === 'Research' && location.pathname === '/admin/listing') || (item.name === 'Templates' && location.pathname === '/admin/templates'))
                          ? 'text-orange-500'
                          : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        }
                      `} />
                      {item.name}
                    </div>
                    <div className={`transition-transform duration-200 ${
                      (item.name === 'Templates' && templatesExpanded) || (item.name === 'Research' && listingExpanded) ? 'rotate-180' : 'rotate-0'
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

                {/* Templates Submenu items */}
                {item.name === 'Templates' && templatesExpanded && (
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

                {/* Research Submenu items */}
                {item.name === 'Listing' && listingExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                          ${location.pathname === subItem.href
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          }
                        `}
                        onClick={handleSubmenuClick}
                      >
                        <subItem.icon className={`
                          mr-3 h-4 w-4 flex-shrink-0
                          ${location.pathname === subItem.href
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

            {/* Super Admin Section - Only visible to superadmins */}
            {isSuperAdmin() && (
              <>
                <div className="pt-5 pb-2">
                  <div className="px-3 flex items-center">
                    <Shield className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                      Süper Admin
                    </span>
                  </div>
                </div>
                
                {superAdminNavigation.map((item) => (
                  <Link
                    key={item.name}
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
                ))}
              </>
            )}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                {userProfile?.role === 'superadmin' ? (
                  <>
                    <Shield className="h-3 w-3 mr-1 text-orange-500" />
                    <span className="text-orange-600 dark:text-orange-400">Süper Admin</span>
                  </>
                ) : userProfile?.role === 'admin' ? (
                  <>
                    <Shield className="h-3 w-3 mr-1 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400">Admin</span>
                  </>
                ) : (
                  <span>{userProfile?.subscription_plan || 'Free'} Plan</span>
                )}
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
              
              {/* Role badge for header */}
              {userProfile?.role && (
                <div className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  userProfile.role === 'superadmin' 
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' 
                    : userProfile.role === 'admin'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {userProfile.role === 'superadmin' && <Shield className="h-3 w-3 mr-1" />}
                  {userProfile.role === 'superadmin' ? 'Süper Admin' : 
                   userProfile.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                </div>
              )}
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