import React from 'react';
import { Settings, Database, FileText, Terminal, ArrowRight } from 'lucide-react';

const SystemSettingsPage: React.FC = () => {
  const systemModules = [
    {
      title: 'Veritabanı Yönetimi',
      description: 'Veritabanı performansını izleyin, yedeklemeleri yönetin ve bakım işlemlerini gerçekleştirin.',
      icon: Database,
      link: '/superadmin/system/database',
      color: 'bg-blue-500'
    },
    {
      title: 'Sistem Logları',
      description: 'Sistem loglarını görüntüleyin, hata kayıtlarını inceleyin ve sorunları tespit edin.',
      icon: FileText,
      link: '/superadmin/system/logs',
      color: 'bg-green-500'
    },
    {
      title: 'API Anahtarları',
      description: 'API anahtarlarını yönetin, yeni anahtarlar oluşturun ve erişim izinlerini düzenleyin.',
      icon: Terminal,
      link: '/superadmin/system/api-keys',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Settings className="h-6 w-6 mr-2 text-orange-500" />
          Sistem Ayarları
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistem modüllerini yönetin ve yapılandırın
        </p>
      </div>

      {/* System Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {systemModules.map((module, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {module.title}
                </h2>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {module.description}
              </p>
              
              <a 
                href={module.link}
                className="flex items-center text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                <span>Modüle Git</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sistem Bilgileri
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Uygulama Versiyonu</h3>
              <p className="text-base text-gray-900 dark:text-white">v1.5.2</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sunucu Ortamı</h3>
              <p className="text-base text-gray-900 dark:text-white">Production</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Node.js Versiyonu</h3>
              <p className="text-base text-gray-900 dark:text-white">v18.16.0</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Veritabanı Versiyonu</h3>
              <p className="text-base text-gray-900 dark:text-white">PostgreSQL 14.5</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Son Yedekleme</h3>
              <p className="text-base text-gray-900 dark:text-white">2023-06-15 03:45 AM</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Son Güncelleme</h3>
              <p className="text-base text-gray-900 dark:text-white">2023-06-10 10:30 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;