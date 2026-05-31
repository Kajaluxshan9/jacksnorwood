import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { menuAPI, resolveImageUrl } from '../../services/api';
import { HiPlus, HiPencil, HiTrash, HiX, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { FaFire, FaLeaf } from 'react-icons/fa';
import ImageUpload from '../../components/ui/ImageUpload';
import { FALLBACK_IMAGE } from '../../config/constants';

// modalType: 'category' | 'subcategory' | 'item' | null

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [editing, setEditing] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});

  const [isActive, setIsActive] = useState(true);

  const load = () => {
    Promise.all([
      menuAPI.getAllAdmin().then((r) => setItems(r.data)),
      menuAPI.getCategories().then((r) => setCategories(r.data)),
      menuAPI.getSubcategories().then((r) => setSubcategories(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // expand newly-loaded categories by default without touching existing collapsed state
  useEffect(() => {
    if (categories.length) {
      setExpandedCats((prev) => {
        const next = { ...prev };
        categories.forEach((c) => { if (!(c.id in next)) next[c.id] = true; });
        return next;
      });
    }
  }, [categories]);

  const toggleCat = (id) => setExpandedCats((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id) => setExpandedSubs((p) => ({ ...p, [id]: !p[id] }));

  // ── Category form ────────────────────────────────────────────────────────────
  const {
    register: regCat,
    handleSubmit: submitCat,
    reset: resetCat,
    formState: { isSubmitting: catSubmitting },
  } = useForm();
  const [catImageUrl, setCatImageUrl] = useState('');

  const openAddCategory = () => {
    setEditing(null);
    setModalType('category');
    resetCat({});
    setCatImageUrl('');
  };

  const openEditCategory = (cat) => {
    setEditing(cat);
    setModalType('category');
    resetCat({ name: cat.name, description: cat.description || '', displayOrder: cat.displayOrder || '' });
    setCatImageUrl(cat.imageUrl || '');
  };

  const onSubmitCategory = async (data) => {
    try {
      const payload = { ...data, imageUrl: catImageUrl, displayOrder: data.displayOrder ? parseInt(data.displayOrder) : null };
      if (editing) {
        await menuAPI.updateCategory(editing.id, payload);
        toast.success('Category updated!');
      } else {
        await menuAPI.createCategory(payload);
        toast.success('Category added!');
      }
      setModalType(null);
      load();
    } catch {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Delete category "${name}" and all its subcategories/items?`)) return;
    try {
      await menuAPI.deleteCategory(id);
      toast.success('Category deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Subcategory form ─────────────────────────────────────────────────────────
  const {
    register: regSub,
    handleSubmit: submitSub,
    reset: resetSub,
    formState: { isSubmitting: subSubmitting },
  } = useForm();
  const [subImageUrl, setSubImageUrl] = useState('');

  const openAddSubcategory = (catId = null) => {
    setEditing(null);
    setModalType('subcategory');
    resetSub({ categoryId: catId || '' });
    setSubImageUrl('');
  };

  const openEditSubcategory = (sub) => {
    setEditing(sub);
    setModalType('subcategory');
    resetSub({ name: sub.name, categoryId: sub.categoryId || '', displayOrder: sub.displayOrder || '' });
    setSubImageUrl(sub.imageUrl || '');
  };

  const onSubmitSubcategory = async (data) => {
    try {
      const payload = {
        name: data.name,
        imageUrl: subImageUrl,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        displayOrder: data.displayOrder ? parseInt(data.displayOrder) : null,
      };
      if (editing) {
        await menuAPI.updateSubcategory(editing.id, payload);
        toast.success('Subcategory updated!');
      } else {
        await menuAPI.createSubcategory(payload);
        toast.success('Subcategory added!');
      }
      setModalType(null);
      load();
    } catch {
      toast.error('Failed to save subcategory');
    }
  };

  const handleDeleteSubcategory = async (id, name) => {
    if (!confirm(`Delete subcategory "${name}"?`)) return;
    try {
      await menuAPI.deleteSubcategory(id);
      toast.success('Subcategory deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Item form ────────────────────────────────────────────────────────────────
  const {
    register: regItem,
    handleSubmit: submitItem,
    reset: resetItem,
    control,
    formState: { isSubmitting: itemSubmitting },
  } = useForm();

  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({ control, name: 'sizes' });
  const watchedCategoryId = useWatch({ control, name: 'categoryId' });
  const filteredSubcategories = watchedCategoryId
    ? subcategories.filter((s) => String(s.categoryId) === String(watchedCategoryId))
    : subcategories;

  const openAddItem = (catId = null, subId = null) => {
    setEditing(null);
    setModalType('item');
    resetItem({ isSpicy: false, isVegan: false, sizes: [], categoryId: catId || '', subcategoryId: subId || '' });
    setIsActive(true);
  };

  const openEditItem = (item) => {
    setEditing(item);
    setModalType('item');
    resetItem({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId || '',
      isSpicy: item.isSpicy,
      isVegan: item.isVegan,
      isPopular: item.isPopular,
      sizes: item.sizes || [],
    });
    setIsActive(item.isActive ?? true);
  };

  const onSubmitItem = async (data) => {
    try {
      const sizes = (data.sizes || []).filter((s) => s.name && s.price);
      const payload = {
        ...data,
        isActive,
        price: parseFloat(data.price),
        categoryId: parseInt(data.categoryId),
        subcategoryId: data.subcategoryId ? parseInt(data.subcategoryId) : null,
        sizes: sizes.map((s) => ({ name: s.name, price: parseFloat(s.price) })),
      };
      if (editing) {
        await menuAPI.update(editing.id, payload);
        toast.success('Menu item updated!');
      } else {
        await menuAPI.create(payload);
        toast.success('Menu item added!');
      }
      setModalType(null);
      load();
    } catch {
      toast.error('Failed to save item');
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await menuAPI.delete(id);
      toast.success('Item deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const inputCls = 'w-full bg-gray-800 border border-white/20 text-white placeholder-white/40 px-3 py-2 rounded-lg focus:outline-none focus:border-pub-gold text-sm';

  // build lookup maps for quick rendering
  const subsByCategory = {};
  subcategories.forEach((s) => {
    if (!subsByCategory[s.categoryId]) subsByCategory[s.categoryId] = [];
    subsByCategory[s.categoryId].push(s);
  });

  const itemsBySubcategory = {};
  const itemsDirectByCategory = {};
  items.forEach((item) => {
    if (item.subcategoryId) {
      if (!itemsBySubcategory[item.subcategoryId]) itemsBySubcategory[item.subcategoryId] = [];
      itemsBySubcategory[item.subcategoryId].push(item);
    } else {
      if (!itemsDirectByCategory[item.categoryId]) itemsDirectByCategory[item.categoryId] = [];
      itemsDirectByCategory[item.categoryId].push(item);
    }
  });

  const totalItems = items.length;
  const totalSubs = subcategories.length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-white font-display text-3xl font-bold">Menu Management</h1>
          <p className="text-white/40 text-sm mt-1">
            {categories.length} categories · {totalSubs} subcategories · {totalItems} items
          </p>
        </div>
        <button onClick={openAddCategory} className="btn-primary flex items-center gap-2">
          <HiPlus size={18} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-16">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <p className="mb-4">No categories yet.</p>
          <button onClick={openAddCategory} className="btn-primary">
            <HiPlus size={16} className="inline mr-1" /> Add your first category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catSubs = subsByCategory[cat.id] || [];
            const directItems = itemsDirectByCategory[cat.id] || [];
            const catItemCount = catSubs.reduce((n, s) => n + (itemsBySubcategory[s.id]?.length || 0), 0) + directItems.length;
            const expanded = expandedCats[cat.id];

            return (
              <div key={cat.id} className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                {/* Category row */}
                <div className={`flex items-center gap-3 px-4 py-3 bg-gray-800/50 ${expanded ? 'border-b border-white/10' : ''}`}>
                  <button onClick={() => toggleCat(cat.id)} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
                    {expanded ? <HiChevronDown size={18} /> : <HiChevronRight size={18} />}
                  </button>
                  {cat.imageUrl && (
                    <img
                      src={resolveImageUrl(cat.imageUrl, FALLBACK_IMAGE)}
                      alt={cat.name}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-semibold text-base">{cat.name}</span>
                    <span className="text-white/30 text-xs ml-2">{catItemCount} item{catItemCount !== 1 ? 's' : ''} · {catSubs.length} subcategorie{catSubs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { openAddSubcategory(cat.id); setExpandedCats((p) => ({ ...p, [cat.id]: true })); }}
                      className="text-xs px-3 py-1.5 border border-white/20 text-white/60 rounded hover:bg-white/5 transition-colors flex items-center gap-1"
                    >
                      <HiPlus size={12} /> Subcategory
                    </button>
                    <button
                      onClick={() => { openAddItem(cat.id, null); setExpandedCats((p) => ({ ...p, [cat.id]: true })); }}
                      className="text-xs px-3 py-1.5 border border-pub-gold/30 text-pub-gold/80 rounded hover:bg-pub-gold/10 transition-colors flex items-center gap-1"
                    >
                      <HiPlus size={12} /> Item
                    </button>
                    <button onClick={() => openEditCategory(cat)} className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-blue-500/10 transition-colors">
                      <HiPencil size={15} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors">
                      <HiTrash size={15} />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="divide-y divide-white/5">
                    {/* Subcategories */}
                    {catSubs.map((sub) => {
                      const subItems = itemsBySubcategory[sub.id] || [];
                      const subExpanded = expandedSubs[sub.id] ?? true;

                      return (
                        <div key={sub.id}>
                          {/* Subcategory row */}
                          <div className="flex items-center gap-3 px-4 py-2.5 pl-10 bg-gray-800/20">
                            <button onClick={() => toggleSub(sub.id)} className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0">
                              {subExpanded ? <HiChevronDown size={15} /> : <HiChevronRight size={15} />}
                            </button>
                            {sub.imageUrl && (
                              <img
                                src={resolveImageUrl(sub.imageUrl, FALLBACK_IMAGE)}
                                alt={sub.name}
                                className="w-6 h-6 rounded object-cover flex-shrink-0"
                                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                              />
                            )}
                            <span className="text-white/80 text-sm font-medium flex-1">{sub.name}</span>
                            <span className="text-white/30 text-xs">{subItems.length} item{subItems.length !== 1 ? 's' : ''}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => { openAddItem(cat.id, sub.id); setExpandedSubs((p) => ({ ...p, [sub.id]: true })); }}
                                className="text-xs px-2.5 py-1 border border-pub-gold/30 text-pub-gold/70 rounded hover:bg-pub-gold/10 transition-colors flex items-center gap-1"
                              >
                                <HiPlus size={11} /> Item
                              </button>
                              <button onClick={() => openEditSubcategory(sub)} className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10 transition-colors">
                                <HiPencil size={13} />
                              </button>
                              <button onClick={() => handleDeleteSubcategory(sub.id, sub.name)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors">
                                <HiTrash size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Items under subcategory */}
                          {subExpanded && subItems.length > 0 && (
                            <div className="divide-y divide-white/5">
                              {subItems.map((item) => (
                                <ItemRow key={item.id} item={item} onEdit={openEditItem} onDelete={handleDeleteItem} />
                              ))}
                            </div>
                          )}
                          {subExpanded && subItems.length === 0 && (
                            <div className="pl-20 py-2 text-white/25 text-xs italic">No items yet</div>
                          )}
                        </div>
                      );
                    })}

                    {/* Items directly under category (no subcategory) */}
                    {directItems.length > 0 && (
                      <div>
                        {catSubs.length > 0 && (
                          <div className="pl-10 py-2 text-white/30 text-xs uppercase tracking-wider bg-gray-800/10">
                            Without subcategory
                          </div>
                        )}
                        <div className="divide-y divide-white/5">
                          {directItems.map((item) => (
                            <ItemRow key={item.id} item={item} onEdit={openEditItem} onDelete={handleDeleteItem} />
                          ))}
                        </div>
                      </div>
                    )}

                    {catSubs.length === 0 && directItems.length === 0 && (
                      <div className="pl-10 py-4 text-white/25 text-sm italic">No subcategories or items yet</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Category Modal ──────────────────────────────────────────────────────── */}
      {modalType === 'category' && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModalType(null)}>
          <form onSubmit={submitCat(onSubmitCategory)} className="space-y-4">
            <Field label="Name *">
              <input {...regCat('name', { required: true })} className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea {...regCat('description')} rows={3} className={inputCls + ' resize-none'} />
            </Field>
            <Field label="Display Order">
              <input {...regCat('displayOrder')} type="number" className={inputCls} />
            </Field>
            <ImageUpload value={catImageUrl} onChange={setCatImageUrl} label="Category Image" inputCls={inputCls} />
            <ModalActions onCancel={() => setModalType(null)} submitting={catSubmitting} />
          </form>
        </Modal>
      )}

      {/* ── Subcategory Modal ───────────────────────────────────────────────────── */}
      {modalType === 'subcategory' && (
        <Modal title={editing ? 'Edit Subcategory' : 'Add Subcategory'} onClose={() => setModalType(null)}>
          <form onSubmit={submitSub(onSubmitSubcategory)} className="space-y-4">
            <Field label="Name *">
              <input {...regSub('name', { required: true })} className={inputCls} />
            </Field>
            <Field label="Category *">
              <select {...regSub('categoryId', { required: true })} className={inputCls}>
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Display Order">
              <input {...regSub('displayOrder')} type="number" className={inputCls} />
            </Field>
            <ImageUpload value={subImageUrl} onChange={setSubImageUrl} label="Subcategory Image" inputCls={inputCls} />
            <ModalActions onCancel={() => setModalType(null)} submitting={subSubmitting} />
          </form>
        </Modal>
      )}

      {/* ── Item Modal ──────────────────────────────────────────────────────────── */}
      {modalType === 'item' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-white text-xl font-bold">
                {editing ? 'Edit Item' : 'Add Menu Item'}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${isActive ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                  {isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => setModalType(null)} className="text-white/50 hover:text-white">
                  <HiX size={22} />
                </button>
              </div>
            </div>

            <form onSubmit={submitItem(onSubmitItem)} className="space-y-4">
              <Field label="Name *">
                <input {...regItem('name', { required: true })} className={inputCls} />
              </Field>
              <Field label="Description">
                <textarea {...regItem('description')} rows={3} className={inputCls + ' resize-none'} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category *">
                  <select {...regItem('categoryId', { required: true })} className={inputCls}>
                    <option value="">Select...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Subcategory">
                  <select {...regItem('subcategoryId')} className={inputCls}>
                    <option value="">None</option>
                    {filteredSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Base Price ($) — leave 0 if using sizes">
                <input {...regItem('price')} type="number" step="0.01" defaultValue="0" className={inputCls} />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/50 text-xs uppercase tracking-wider">Size Variants (optional)</label>
                  <button type="button" onClick={() => appendSize({ name: '', price: '' })} className="text-pub-gold text-xs hover:underline flex items-center gap-1">
                    <HiPlus size={12} /> Add Size
                  </button>
                </div>
                {sizeFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <input {...regItem(`sizes.${idx}.name`)} placeholder="e.g. Small" className={inputCls} />
                    <input {...regItem(`sizes.${idx}.price`)} type="number" step="0.01" placeholder="Price" className={inputCls} />
                    <button type="button" onClick={() => removeSize(idx)} className="text-red-400 hover:text-red-300 px-2 flex-shrink-0">
                      <HiX size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                {[['isSpicy', 'Spicy'], ['isVegan', 'Vegan'], ['isPopular', 'Popular (home page)']].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...regItem(field)} className="w-4 h-4 accent-pub-gold" />
                    <span className="text-white/70 text-sm">{label}</span>
                  </label>
                ))}
              </div>

              <ModalActions onCancel={() => setModalType(null)} submitting={itemSubmitting} />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small reusable helpers ────────────────────────────────────────────────────

function ItemRow({ item, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 pl-20 hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm">{item.name}</span>
        {item.description && (
          <span className="text-white/30 text-xs ml-2 truncate hidden sm:inline">{item.description}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.isSpicy && <FaFire size={10} className="text-red-400" title="Spicy" />}
        {item.isVegan && <FaLeaf size={10} className="text-green-400" title="Vegan" />}
        {item.isPopular && <span className="text-pub-gold text-xs">★</span>}
        <span className="text-white/60 text-xs font-mono">
          {item.sizes && item.sizes.length > 0
            ? item.sizes.map((s) => `${s.name} $${parseFloat(s.price).toFixed(2)}`).join(' · ')
            : `$${parseFloat(item.price).toFixed(2)}`}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {item.isActive ? 'Active' : 'Hidden'}
        </span>
        <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10 transition-colors">
          <HiPencil size={13} />
        </button>
        <button onClick={() => onDelete(item.id, item.name)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors">
          <HiTrash size={13} />
        </button>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-white text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><HiX size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function ModalActions({ onCancel, submitting }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm">
        Cancel
      </button>
      <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-50 text-sm">
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
