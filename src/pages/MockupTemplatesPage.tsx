// EKLEMELER – Folder sistemini entegre etmek için yapılması gereken tüm eklemeler:

// 📦 1. Ekstra useState tanımlamaları (üst kısma, diğer useState'lerle birlikte ekle)
const [folders, setFolders] = useState<any[]>([]);
const [selectedFolder, setSelectedFolder] = useState<string>('');
const [newFolderName, setNewFolderName] = useState('');

// 📡 2. Supabase'ten klasörleri yükleme ve klasör oluşturma fonksiyonları (useCallback olarak tanımlanabilir)
const loadFolders = useCallback(async () => {
  try {
    if (!user?.id || isDemoMode || !isConfigValid) return;

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setFolders(data || []);
  } catch (error) {
    console.error('❌ Folder loading error:', error);
  }
}, [user, isDemoMode]);

const createFolder = async () => {
  if (!newFolderName.trim()) return;

  try {
    const { data, error } = await supabase
      .from('folders')
      .insert({ name: newFolderName, user_id: user?.id })
      .select();

    if (error) throw error;

    setFolders((prev) => [...prev, ...data]);
    setNewFolderName('');
  } catch (error) {
    console.error('❌ Folder creation error:', error);
    alert('Folder could not be created.');
  }
};

// 🔁 3. useEffect içinde folder'ları da yükle
useEffect(() => {
  if (user || isDemoMode) {
    loadTemplates();
    loadStores();
    loadFolders();
  }
}, [user, isDemoMode, loadTemplates, loadStores, loadFolders]);

// 💾 4. saveTemplate fonksiyonu içinde templateData'ya folder_id ekle
folder_id: selectedFolder,

// 🧩 5. Template oluşturma / düzenleme arayüzüne klasör seçme alanı ekle (templateName inputundan sonra)
<div className="flex items-center space-x-2">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Folder:</label>
  <select
    value={selectedFolder}
    onChange={(e) => setSelectedFolder(e.target.value)}
    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
  >
    <option value="">No Folder</option>
    {folders.map(folder => (
      <option key={folder.id} value={folder.id}>📁 {folder.name}</option>
    ))}
  </select>
</div>
<div className="flex space-x-2 mt-2">
  <Input
    placeholder="New folder name"
    value={newFolderName}
    onChange={(e) => setNewFolderName(e.target.value)}
    className="w-48"
  />
  <Button onClick={createFolder}>➕ Create Folder</Button>
</div>

// 📂 6. Templates listeleme kısmında klasöre göre gruplama yap (opsiyonel olarak tüm template gridinin yerine koyabilirsin)
{folders.map(folder => (
  <div key={folder.id}>
    <h2 className="text-lg font-bold mt-6 mb-3">📁 {folder.name}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTemplates.filter(t => t.folder_id === folder.id).map(template => (
        <Card key={template.id}>...template içeriği...</Card>
      ))}
    </div>
  </div>
))}
{filteredTemplates.filter(t => !t.folder_id).length > 0 && (
  <div>
    <h2 className="text-lg font-bold mt-6 mb-3">🗃️ Other Templates</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTemplates.filter(t => !t.folder_id).map(template => (
        <Card key={template.id}>...template içeriği...</Card>
      ))}
    </div>
  </div>
)}
