import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { galleryAPI, uploadAPI, resolveImageUrl, apiErrorMessage } from '../../services/api';
import { HiPlus, HiTrash, HiX, HiPencil } from 'react-icons/hi';
import { FaUpload } from 'react-icons/fa';
import { FALLBACK_GALLERY } from "../../config/constants";

const DEFAULT_CATEGORIES = ["food", "drinks", "events", "interior"];

export default function AdminGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  // Editing an existing image (caption / category / order). Previously an image
  // could only be uploaded or deleted - there was no way to correct a typo in a
  // caption or move a photo into a different category.
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ category: "", caption: "", displayOrder: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // Category state: 'existing' | 'new'
  const [catMode, setCatMode] = useState("existing");
  const [selectedCategory, setSelectedCategory] = useState(
    DEFAULT_CATEGORIES[0],
  );
  const [newCategory, setNewCategory] = useState("");

  const load = () =>
    galleryAPI
      .getAll()
      .then((r) => setImages(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  // Derive existing categories from loaded images + defaults
  const existingCategories = [
    ...new Set([
      ...DEFAULT_CATEGORIES,
      ...images.map((i) => i.category).filter(Boolean),
    ]),
  ];

  const filtered =
    filterCat === "all"
      ? images
      : images.filter((i) => i.category === filterCat);

  const openModal = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setCaption("");
    setCatMode("existing");
    setSelectedCategory(DEFAULT_CATEGORIES[0]);
    setNewCategory("");
    setShowModal(true);
  };

  // Object URLs are held until revoked, so release them when previews change
  // or the component unmounts.
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    previews.forEach(URL.revokeObjectURL);
    setSelectedFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }
    const category =
      catMode === "new"
        ? newCategory.trim().toLowerCase().replace(/\s+/g, "-")
        : selectedCategory;
    if (!category) {
      toast.error("Please enter a category name");
      return;
    }

    setUploading(true);
    let successCount = 0;
    for (const file of selectedFiles) {
      try {
        const res = await uploadAPI.upload(file);
        await galleryAPI.create({ imageUrl: res.data.url, category, caption });
        successCount++;
      } catch (error) {
        toast.error(apiErrorMessage(error, `Failed to upload ${file.name}`));
      }
    }
    setUploading(false);
    if (successCount > 0)
      toast.success(
        `${successCount} image${successCount > 1 ? "s" : ""} added!`,
      );
    setShowModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this image?")) return;
    try {
      await galleryAPI.delete(id);
      toast.success("Removed");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete"));
    }
  };

  const openEdit = (img) => {
    setEditing(img);
    setEditForm({
      category: img.category || "",
      caption: img.caption || "",
      displayOrder: img.displayOrder ?? "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      await galleryAPI.update(editing.id, {
        category: editForm.category.trim().toLowerCase().replace(/\s+/g, "-"),
        caption: editForm.caption,
        displayOrder: editForm.displayOrder === "" ? null : parseInt(editForm.displayOrder, 10),
      });
      toast.success("Image updated");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update"));
    } finally {
      setSavingEdit(false);
    }
  };

  const inputCls =
    "w-full bg-gray-800 border border-white/20 text-white placeholder-white/40 px-3 py-2 rounded-lg focus:outline-none focus:border-pub-gold text-sm";

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white font-display text-3xl font-bold">
            Gallery
          </h1>
          <p className="text-white/40 text-sm mt-1">{images.length} images</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus size={18} /> Add Images
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", ...existingCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${filterCat === cat ? "bg-pub-gold text-pub-dark" : "bg-gray-800 text-white/60 hover:bg-gray-700"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-xl overflow-hidden bg-gray-900 aspect-square"
            >
              <img
                src={resolveImageUrl(img.imageUrl, FALLBACK_GALLERY)}
                alt={img.caption || "Gallery"}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = FALLBACK_GALLERY;
                }}
              />
              <div className="absolute inset-0 bg-pub-dark/0 group-hover:bg-pub-dark/70 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <span className="text-white text-xs text-center px-2">
                  {img.caption}
                </span>
                <span className="text-pub-gold text-xs uppercase">
                  {img.category}
                </span>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => openEdit(img)}
                    title="Edit caption, category or order"
                    className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-400 transition-colors"
                  >
                    <HiPencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    title="Delete permanently"
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-400 transition-colors"
                  >
                    <HiTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <form
            onSubmit={saveEdit}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-white text-xl font-bold">Edit Image</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-white/50 hover:text-white"
              >
                <HiX size={22} />
              </button>
            </div>

            <img
              src={resolveImageUrl(editing.imageUrl, FALLBACK_GALLERY)}
              alt={editing.caption || "Gallery"}
              className="w-full h-40 object-cover rounded-lg mb-4"
              onError={(e) => {
                e.target.src = FALLBACK_GALLERY;
              }}
            />

            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Category
                </label>
                <input
                  list="gallery-categories"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="food"
                  className={inputCls}
                />
                <datalist id="gallery-categories">
                  {existingCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Caption
                </label>
                <input
                  value={editForm.caption}
                  onChange={(e) => setEditForm((f) => ({ ...f, caption: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editForm.displayOrder}
                  onChange={(e) => setEditForm((f) => ({ ...f, displayOrder: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-lg hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 btn-primary disabled:opacity-50 text-sm"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-white text-xl font-bold">
                Add Images
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/50 hover:text-white"
              >
                <HiX size={22} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category selection */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
                  Category
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCatMode("existing")}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${catMode === "existing" ? "bg-pub-gold text-pub-dark" : "bg-gray-800 text-white/60"}`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatMode("new")}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${catMode === "new" ? "bg-pub-gold text-pub-dark" : "bg-gray-800 text-white/60"}`}
                  >
                    New Category
                  </button>
                </div>
                {catMode === "existing" ? (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={inputCls}
                  >
                    {existingCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. specials, staff"
                    className={inputCls}
                  />
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Caption (applied to all)
                </label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Optional caption"
                  className={inputCls}
                />
              </div>

              {/* File picker */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
                  Images *
                </label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 hover:border-pub-gold rounded-xl py-6 cursor-pointer transition-colors">
                  <FaUpload size={20} className="text-white/40" />
                  <span className="text-white/50 text-sm">
                    Click to select images (multiple allowed)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previews.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <HiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-lg hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="flex-1 btn-primary disabled:opacity-50 text-sm"
                >
                  {uploading
                    ? `Uploading... (${selectedFiles.length} files)`
                    : `Upload ${selectedFiles.length || ""} Image${selectedFiles.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
