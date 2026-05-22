import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { menuAPI, resolveImageUrl } from '../../services/api';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';
import { FaFire, FaLeaf, FaLayerGroup } from 'react-icons/fa';
import ImageUpload from '../../components/ui/ImageUpload';
import { FALLBACK_IMAGE } from "../../config/constants";

// ── Modal type enum ──────────────────────────────────────────────────────────
// 'item' | 'subcategory'

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'item' | 'subcategory' | null
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState("all");

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

  // ── Item form ──────────────────────────────────────────────────────────────
  const {
    register: regItem,
    handleSubmit: submitItem,
    reset: resetItem,
    control,
    formState: { errors: itemErrors, isSubmitting: itemSubmitting },
  } = useForm();

  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
  } = useFieldArray({ control, name: "sizes" });
  const watchedCategoryId = useWatch({ control, name: "categoryId" });
  const filteredSubcategories = watchedCategoryId
    ? subcategories.filter(
        (s) => String(s.categoryId) === String(watchedCategoryId),
      )
    : subcategories;

  const openAddItem = () => {
    setEditing(null);
    setModalType("item");
    resetItem({ isSpicy: false, isVegan: false, sizes: [] });
    setIsActive(true);
  };

  const openEditItem = (item) => {
    setEditing(item);
    setModalType("item");
    resetItem({
      name: item.name,
      description: item.description || "",
      price: item.price,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId || "",
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
        toast.success("Menu item updated!");
      } else {
        await menuAPI.create(payload);
        toast.success("Menu item added!");
      }
      setModalType(null);
      resetItem();
      load();
    } catch {
      toast.error("Failed to save item");
    }
  };

  // ── Subcategory form ───────────────────────────────────────────────────────
  const {
    register: regSub,
    handleSubmit: submitSub,
    reset: resetSub,
    formState: { isSubmitting: subSubmitting },
  } = useForm();
  const [subImageUrl, setSubImageUrl] = useState("");

  const openAddSubcategory = () => {
    setEditing(null);
    setModalType("subcategory");
    resetSub({});
    setSubImageUrl("");
  };

  const openEditSubcategory = (sub) => {
    setEditing(sub);
    setModalType("subcategory");
    resetSub({ name: sub.name, categoryId: sub.categoryId || "" });
    setSubImageUrl(sub.imageUrl || "");
  };

  const onSubmitSubcategory = async (data) => {
    try {
      const payload = {
        name: data.name,
        imageUrl: subImageUrl,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      };
      if (editing) {
        await menuAPI.updateSubcategory(editing.id, payload);
        toast.success("Subcategory updated!");
      } else {
        await menuAPI.createSubcategory(payload);
        toast.success("Subcategory added!");
      }
      setModalType(null);
      resetSub();
      load();
    } catch {
      toast.error("Failed to save subcategory");
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await menuAPI.delete(id);
      toast.success("Item deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteSubcategory = async (id, name) => {
    if (!confirm(`Delete subcategory "${name}"?`)) return;
    try {
      await menuAPI.deleteSubcategory(id);
      toast.success("Subcategory deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered =
    filterCat === "all"
      ? items
      : items.filter((i) => i.categoryId === parseInt(filterCat));
  const inputCls =
    "w-full bg-gray-800 border border-white/20 text-white placeholder-white/40 px-3 py-2 rounded-lg focus:outline-none focus:border-pub-gold text-sm";

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-white font-display text-3xl font-bold">
            Menu Management
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {items.length} items · {subcategories.length} subcategories
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openAddSubcategory}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white/70 rounded-sm hover:bg-white/5 text-sm font-semibold uppercase tracking-wider transition-all"
          >
            <FaLayerGroup size={14} /> Add Sub Category
          </button>
          <button
            onClick={openAddItem}
            className="btn-primary flex items-center gap-2"
          >
            <HiPlus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Subcategories list */}
      {subcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">
            Subcategories
          </h2>
          <div className="flex flex-wrap gap-3">
            {subcategories.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-2 bg-gray-900 border border-white/10 rounded-lg px-3 py-2"
              >
                {sub.imageUrl && (
                  <img
                    src={resolveImageUrl(sub.imageUrl, FALLBACK_IMAGE)}
                    alt={sub.name}
                    className="w-8 h-8 rounded object-cover"
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                )}
                <span className="text-white text-sm">{sub.name}</span>
                {sub.categoryName && (
                  <span className="text-pub-gold text-xs">
                    ({sub.categoryName})
                  </span>
                )}
                <button
                  onClick={() => openEditSubcategory(sub)}
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  <HiPencil size={13} />
                </button>
                <button
                  onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <HiTrash size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter by category */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${filterCat === "all" ? "bg-pub-gold text-pub-dark" : "bg-gray-800 text-white/60 hover:bg-gray-700"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCat(String(c.id))}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${filterCat === String(c.id) ? "bg-pub-gold text-pub-dark" : "bg-gray-800 text-white/60 hover:bg-gray-700"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Items table */}
      {loading ? (
        <div className="text-white/50 text-center py-10">Loading...</div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 border-b border-white/10">
              <tr>
                <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs">
                  Name
                </th>
                <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs hidden md:table-cell">
                  Category
                </th>
                <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs hidden lg:table-cell">
                  Subcategory
                </th>
                <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs">
                  Price
                </th>
                <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs hidden sm:table-cell">
                  Tags
                </th>
                <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs">
                  Status
                </th>
                <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-white/40 text-xs truncate max-w-xs">
                      {item.description}
                    </p>
                    {item.sizes && item.sizes.length > 0 && (
                      <p className="text-pub-gold/60 text-xs mt-0.5">
                        {item.sizes
                          .map(
                            (s) =>
                              `${s.name}: $${parseFloat(s.price).toFixed(2)}`,
                          )
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-pub-gold text-xs">
                      {item.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-white/50 text-xs">
                      {item.subcategoryName || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">
                    {item.sizes && item.sizes.length > 0 ? (
                      <span className="text-xs text-white/60">See sizes</span>
                    ) : (
                      `$${parseFloat(item.price).toFixed(2)}`
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {item.isSpicy && (
                        <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded">
                          <FaFire size={8} className="inline mr-0.5" />
                          Spicy
                        </span>
                      )}
                      {item.isVegan && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded">
                          <FaLeaf size={8} className="inline mr-0.5" />
                          Vegan
                        </span>
                      )}
                      {item.isPopular && (
                        <span className="bg-pub-gold/20 text-pub-gold text-xs px-1.5 py-0.5 rounded">
                          ★ Popular
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${item.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                    >
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditItem(item)}
                        className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-blue-500/10 transition-colors"
                      >
                        <HiPencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                      >
                        <HiTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-white/40 py-10">
              No items found
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit Item Modal ─────────────────────────────────────────────── */}
      {modalType === "item" && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-white text-xl font-bold">
                {editing ? "Edit Item" : "Add Menu Item"}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-green-500/20 text-green-400 border border-green-500/40"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400" : "bg-red-400"}`}
                  />
                  {isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => setModalType(null)}
                  className="text-white/50 hover:text-white"
                >
                  <HiX size={22} />
                </button>
              </div>
            </div>

            <form onSubmit={submitItem(onSubmitItem)} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Name *
                </label>
                <input
                  {...regItem("name", { required: true })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Description
                </label>
                <textarea
                  {...regItem("description")}
                  rows={3}
                  className={inputCls + " resize-none"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                    Category *
                  </label>
                  <select
                    {...regItem("categoryId", { required: true })}
                    className={inputCls}
                  >
                    <option value="">Select...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                    Subcategory
                  </label>
                  <select {...regItem("subcategoryId")} className={inputCls}>
                    <option value="">None</option>
                    {filteredSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Base price (used if no sizes) */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Base Price ($) — leave 0 if using sizes below
                </label>
                <input
                  {...regItem("price")}
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className={inputCls}
                />
              </div>

              {/* Size variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/50 text-xs uppercase tracking-wider">
                    Size Variants (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => appendSize({ name: "", price: "" })}
                    className="text-pub-gold text-xs hover:underline flex items-center gap-1"
                  >
                    <HiPlus size={12} /> Add Size
                  </button>
                </div>
                {sizeFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <input
                      {...regItem(`sizes.${idx}.name`)}
                      placeholder="e.g. Small"
                      className={inputCls}
                    />
                    <input
                      {...regItem(`sizes.${idx}.price`)}
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeSize(idx)}
                      className="text-red-400 hover:text-red-300 px-2 flex-shrink-0"
                    >
                      <HiX size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-4">
                {[
                  ["isSpicy", "Spicy"],
                  ["isVegan", "Vegan"],
                  ["isPopular", "Popular (show on home page)"],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      {...regItem(field)}
                      className="w-4 h-4 accent-pub-gold"
                    />
                    <span className="text-white/70 text-sm">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={itemSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 text-sm"
                >
                  {itemSubmitting ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add/Edit Subcategory Modal ──────────────────────────────────────── */}
      {modalType === "subcategory" && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-white text-xl font-bold">
                {editing ? "Edit Subcategory" : "Add Subcategory"}
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="text-white/50 hover:text-white"
              >
                <HiX size={22} />
              </button>
            </div>
            <form
              onSubmit={submitSub(onSubmitSubcategory)}
              className="space-y-4"
            >
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Name *
                </label>
                <input
                  {...regSub("name", { required: true })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Category *
                </label>
                <select
                  {...regSub("categoryId", { required: true })}
                  className={inputCls}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <ImageUpload
                value={subImageUrl}
                onChange={setSubImageUrl}
                label="Subcategory Image"
                inputCls={inputCls}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-lg hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 text-sm"
                >
                  {subSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
