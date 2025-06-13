import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import Button from '../ui/Button';
import { useFonts } from '../../hooks/useFonts';

interface FontUploadButtonProps {
  onFontUploaded?: (fontData: { display: string, value: string }) => void;
  className?: string;
}

const FontUploadButton: React.FC<FontUploadButtonProps> = ({ 
  onFontUploaded, 
  className = '' 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFont, loading, error } = useFonts();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const savedFont = await uploadFont(file);
      
      // Notify parent component with font data object
      if (onFontUploaded) {
        onFontUploaded({
          display: savedFont.font_name,
          value: savedFont.font_family
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      // Error is handled by the useFonts hook and displayed in the UI
      // No need to log to console as it creates redundant error messages
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 h-10 w-10 flex items-center justify-center ${className}`}
        title="Upload custom font"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple={false}
      />
      
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 border border-red-300 text-red-700 text-xs rounded shadow-lg z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </>
  );
};

export default FontUploadButton;