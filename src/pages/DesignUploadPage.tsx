import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, Image, FileUp, Clock, AlertCircle, CheckCircle, X, Trash2, Download, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';

interface DesignFile {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: 'black' | 'white' | 'color';
  file_size: number;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  expires_at: string;
}

const DesignUploadPage: React.FC = () => {
  const { user } = useAuth();
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedDesign, setUploadedDesign] = useState<DesignFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Lütfen sadece resim dosyaları yükleyin.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük. Maksimum 5MB izin verilir.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Lütfen sadece resim dosyaları yükleyin.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük. Maksimum 5MB izin verilir.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const uploadDesign = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Create design file record in Supabase
          const { data, error } = await supabase
            .from('design_files')
            .insert({
              user_id: user.id,
              file_name: selectedFile.name,
              file_url: base64Data, // Store base64 data directly
              file_type: designType,
              file_size: selectedFile.size,
              status: 'active',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
            })
            .select()
            .single();

          clearInterval(progressInterval);
          
          if (error) {
            console.error('Error uploading design:', error);
            setError(`Yükleme hatası: ${error.message}`);
            setUploadProgress(0);
            return;
          }

          setUploadProgress(100);
          setUploadSuccess(true);
          setUploadedDesign(data);
          
          // Reset form after successful upload
          setTimeout(() => {
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadProgress(0);
          }, 2000);
          
        } catch (err) {
          console.error('Error processing file:', err);
          setError('Dosya işlenirken bir hata oluştu.');
          setUploadProgress(0);
        }
      };
      
      reader.onerror = () => {
        setError('Dosya okunamadı.');
        setUploadProgress(0);
      };
      
    } catch (err) {
      console.error('Error uploading design:', err);
      setError('Yükleme sırasında bir hata oluştu.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
    setUploadSuccess(false);
    setUploadedDesign(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadDesign = () => {
    if (!uploadedDesign) return;
    
    const link = document.createElement('a');
    link.href = uploadedDesign.file_url;
    link.download = uploadedDesign.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Upload className="h-6 w-6 mr-2 text-orange-500" />
          Tasarım Yükle
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Etsy listeleri için tasarım dosyalarınızı yükleyin
        </p>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        </div>
      </div>

      {/* Design Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tasarım Türü
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setDesignType('black')}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              designType === 'black'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="w-16 h-16 bg-black rounded-lg mb-2 flex items-center justify-center">
              <Image className="h-8 w-8 text-white" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Siyah Tasarım</span>
          </button>
          
          <button
            onClick={() => setDesignType('white')}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              designType === 'white'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg mb-2 flex items-center justify-center">
              <Image className="h-8 w-8 text-gray-800 dark:text-white" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Beyaz Tasarım</span>
          </button>
          
          <button
            onClick={() => setDesignType('color')}
            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
              designType === 'color'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-2 flex items-center justify-center">
              <Image className="h-8 w-8 text-white" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Renkli Tasarım</span>
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dosya Yükleme
        </h2>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {uploadSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700 dark:text-green-400">Tasarım başarıyla yüklendi!</p>
            </div>
          </div>
        )}
        
        {/* File Upload Dropzone */}
        {!uploadedDesign ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              previewUrl
                ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700'
            } transition-colors`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative mx-auto max-w-xs">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 max-w-full mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={resetUpload}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {selectedFile?.name}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                {/* Upload Progress */}
                {uploading && (
                  <div className="w-full max-w-xs mx-auto">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Yükleniyor...</span>
                      <span className="text-gray-600 dark:text-gray-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center space-x-3">
                  <Button
                    onClick={uploadDesign}
                    disabled={uploading}
                    className="flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="h-4 w-4" />
                        <span>Yükle</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={resetUpload}
                    variant="secondary"
                    disabled={uploading}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <FileUp className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Tasarım dosyanızı buraya sürükleyin
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    veya dosya seçmek için tıklayın
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="mx-auto"
                >
                  Dosya Seç
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG veya JPEG • Maks 5MB
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <img
                  src={uploadedDesign.file_url}
                  alt={uploadedDesign.file_name}
                  className="h-32 w-32 object-contain rounded-lg border border-green-200 dark:border-green-800"
                />
                <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {uploadedDesign.file_name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                    {(uploadedDesign.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-full text-xs text-orange-700 dark:text-orange-400 capitalize">
                    {uploadedDesign.file_type} Design
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full text-xs text-blue-700 dark:text-blue-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    24 saat geçerli
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={downloadDesign}
                    variant="secondary"
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>İndir</span>
                  </Button>
                  <Button
                    onClick={resetUpload}
                    className="flex items-center space-x-2"
                  >
                    <FileUp className="h-4 w-4" />
                    <span>Yeni Tasarım Yükle</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto Text Design Link */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Image className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
              🎨 Otomatik Metin Tasarımı Oluşturmak İster misiniz?
            </h3>
            <p className="text-sm text-orange-600 dark:text-orange-300">
              Metinlerinizi özelleştirilmiş tasarımlara dönüştürmek için <a href="/admin/templates/auto-text-to-image" className="underline font-medium">Auto Text to Image</a> aracını kullanabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignUploadPage;