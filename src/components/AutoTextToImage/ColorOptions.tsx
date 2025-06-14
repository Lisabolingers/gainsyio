import React, { FC } from 'react';
import Button from '../ui/Button';

type TextType = {
  id: number;
  colorOption?: 'bw' | 'all' | 'letters' | null;
  selectedColor?: string;
  letterColors?: string[];
  strokeEnabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOnly?: boolean;
};

type Props = {
  text: TextType;
  setTexts: React.Dispatch<React.SetStateAction<TextType[]>>;
  texts: TextType[];
};

const ColorOptions: FC<Props> = ({ text, setTexts, texts }) => {
  return (
    <div className="mt-4">
      {/* Line above Color Options */}
      <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>

      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">🎨 Color Options</h3>
      <div className="flex gap-2 mb-4">
        {['bw', 'all', 'letters'].map(opt => (
          <button
            key={opt}
            onClick={() => setTexts(texts.map(t => t.id === text.id ? { ...t, colorOption: opt } : t))}
            className={`px-4 py-1 rounded-full border transition-all duration-300 ${
              text.colorOption === opt 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-black hover:bg-blue-100 dark:bg-gray-700 dark:text-white dark:hover:bg-blue-900/20'
            }`}
          >
            {opt === 'bw' ? 'Black & White' : opt === 'all' ? 'Color All Text' : 'Color Letters'}
          </button>
        ))}
      </div>

      {text.colorOption === 'all' && (
        <div className="flex items-center gap-3 mb-4">
          <input
            type="color"
            value={text.selectedColor || '#000000'}
            onChange={(e) =>
              setTexts(
                texts.map((t) =>
                  t.id === text.id
                    ? {
                        ...t,
                        selectedColor: e.target.value,
                        fill: e.target.value,
                      }
                    : t
                )
              )
            }
            className="w-10 h-10 rounded-full border shadow-md"
          />
          <input
            type="text"
            value={text.selectedColor || '#000000'}
            onChange={(e) =>
              setTexts(
                texts.map((t) =>
                  t.id === text.id
                    ? {
                        ...t,
                        selectedColor: e.target.value,
                        fill: e.target.value,
                      }
                    : t
                )
              )
            }
            className="border rounded px-2 py-1 w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            style={{ backgroundColor: 'white', color: 'black' }}
          />
        </div>
      )}

      {text.colorOption === 'letters' && (
        <div className="flex gap-2 mb-4">
          {Array(7).fill(0).map((_, idx) => (
            <input key={idx} type="color" value={text.letterColors?.[idx] || '#CCCCCC'}
              onChange={(e) => {
                const newColors = [...(text.letterColors || Array(7).fill(''))];
                newColors[idx] = e.target.value;
                setTexts(texts.map(t => t.id === text.id ? { ...t, letterColors: newColors } : t));
              }}
              className="w-10 h-10 rounded-full border shadow-md"
            />
          ))}
        </div>
      )}

      <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Stroke</h4>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="text-gray-700 dark:text-gray-300">Enable:</label>
          <input type="checkbox" checked={text.strokeEnabled || false}
            onChange={(e) => setTexts(texts.map(t => t.id === text.id ? { ...t, strokeEnabled: e.target.checked } : t))}
          />
        </div>
        {text.strokeEnabled && (
          <div className="flex gap-2">
            <input type="color" value={text.strokeColor || '#000000'}
              onChange={(e) => setTexts(texts.map(t => t.id === text.id ? { ...t, strokeColor: e.target.value } : t))}
            />
            <input type="number" value={text.strokeWidth || 2} min="1"
              onChange={(e) => setTexts(texts.map(t => t.id === text.id ? { ...t, strokeWidth: parseInt(e.target.value) } : t))}
              className="w-16 p-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              style={{ backgroundColor: 'white', color: 'black' }}
            />
            <div className="flex items-center gap-2">
              <label htmlFor={`only-stroke-${text.id}`} className="text-gray-700 dark:text-gray-300">Only Stroke:</label>
              <input
                id={`only-stroke-${text.id}`}
                type="checkbox"
                checked={text.strokeOnly || false}
                onChange={(e) =>
                  setTexts(
                    texts.map((t) =>
                      t.id === text.id ? { ...t, strokeOnly: e.target.checked } : t
                    )
                  )
                }
                className="w-4 h-4 rounded border"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reset button */}
      <div className="flex gap-2 mt-4">
        <Button onClick={() => setTexts(texts.map(t => t.id === text.id ? {
          ...t,
          colorOption: null,
          selectedColor: '',
          letterColors: Array(7).fill(''),
          fill: '#000000',
          strokeEnabled: false,
          strokeColor: '',
          strokeWidth: 2,
          strokeOnly: false
        } : t))} className="bg-gradient-to-r from-red-400 to-pink-500 text-white">
          Reset
        </Button>
      </div>

      {/* Line below Reset */}
      <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>
    </div>
  );
};

export default ColorOptions;