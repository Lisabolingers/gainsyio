# Gainsy - Etsy Mağaza Yönetim Platformu

Gainsy, Etsy satıcılarının mağazalarını daha verimli bir şekilde yönetmelerine yardımcı olmak için tasarlanmış güçlü bir platformdur.

## 🚀 Özellikler

- **Mağaza Yönetimi**: Birden fazla Etsy mağazasını tek bir panelden yönetin
- **Otomatik Mockuplar**: Profesyonel ürün mockuplarını otomatik olarak oluşturun
- **Listeleme Şablonları**: Hızlı ürün oluşturma için listeleme şablonlarını kaydedin ve yeniden kullanın
- **Analitik**: Detaylı analizlerle mağaza performansını takip edin
- **Toplu Güncellemeler**: Birden fazla listeyi tek seferde güncelleyin
- **Tasarım Araçları**: Ürünler için metin-görsel tasarımları oluşturun ve yönetin

## 🛠️ Teknoloji Yığını

- **Frontend**: React with TypeScript
- **Stil**: Tailwind CSS
- **Veritabanı**: Supabase
- **Hosting**: Netlify
- **Kimlik Doğrulama**: Supabase Auth
- **İkonlar**: Lucide React

## 🔧 Geliştirme

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı
- Etsy Developer hesabı

### Ortam Değişkenleri

Kök dizinde bir `.env` dosyası oluşturun:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/yourusername/gainsy.git
cd gainsy
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

### Dağıtım için Derleme

```bash
npm run build
```

## 📝 Proje Yapısı

```
gainsy/
├── src/
│   ├── components/     # Yeniden kullanılabilir UI bileşenleri
│   ├── context/       # React context sağlayıcıları
│   ├── lib/           # Yardımcı kütüphaneler ve API istemcileri
│   ├── pages/         # Sayfa bileşenleri
│   ├── types/         # TypeScript tip tanımlamaları
│   └── utils/         # Yardımcı fonksiyonlar
├── public/           # Statik varlıklar
└── supabase/        # Supabase yapılandırmaları ve migrasyonları
```

## 📄 Lisans

Bu proje özel yazılımdır. Tüm hakları saklıdır.