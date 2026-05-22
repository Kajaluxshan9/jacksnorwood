import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { teamAPI, uploadAPI, resolveImageUrl } from '../../services/api';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';
import { FaUpload } from 'react-icons/fa';
import { FALLBACK_TEAM } from "../../config/constants";

const FALLBACK = FALLBACK_TEAM;

const emptyForm = { name: "", position: "", imageUrl: "", displayOrder: "" };

export default function AdminTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = create
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () =>
    teamAPI
      .getAll()
      .then((r) => setMembers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      position: m.position,
      imageUrl: m.imageUrl || "",
      displayOrder: m.displayOrder ?? "",
    });
    setImageFile(null);
    setImagePreview(m.imageUrl || "");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.position.trim()) {
      toast.error("Name and position are required");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        setUploading(true);
        const res = await uploadAPI.upload(imageFile);
        imageUrl = res.data.url;
        setUploading(false);
      }
      const payload = {
        name: form.name.trim(),
        position: form.position.trim(),
        imageUrl: imageUrl || "",
        displayOrder:
          form.displayOrder !== "" ? parseInt(form.displayOrder) : 0,
      };
      if (editing) {
        await teamAPI.update(editing.id, payload);
        toast.success("Member updated!");
      } else {
        await teamAPI.create(payload);
        toast.success("Member added!");
      }
      closeModal();
      load();
    } catch {
      toast.error("Failed to save member");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this team member?")) return;
    try {
      await teamAPI.delete(id);
      toast.success("Removed");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const inputCls =
    "w-full bg-gray-800 border border-white/20 text-white placeholder-white/40 px-3 py-2 rounded-lg focus:outline-none focus:border-pub-gold text-sm";

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white font-display text-3xl font-bold">
            Team Members
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus size={18} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-10">Loading...</div>
      ) : members.length === 0 ? (
        <div className="text-center text-white/30 py-20">
          <p className="text-lg font-display">No team members yet</p>
          <p className="text-sm mt-1">Click "Add Member" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden group"
            >
              <div className="aspect-square overflow-hidden bg-gray-800">
                <img
                  src={resolveImageUrl(m.imageUrl, FALLBACK)}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = FALLBACK;
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-white font-display font-bold text-lg leading-tight">
                  {m.name}
                </h3>
                <p className="text-pub-gold text-sm mt-0.5">{m.position}</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    <HiPencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    <HiTrash size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-white text-xl font-bold">
                {editing ? "Edit Member" : "Add Member"}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/50 hover:text-white"
              >
                <HiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
                  Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                    <img
                      src={
                        imagePreview
                          ? imagePreview.startsWith("blob:")
                            ? imagePreview
                            : resolveImageUrl(imagePreview, FALLBACK)
                          : FALLBACK
                      }
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = FALLBACK;
                      }}
                    />
                  </div>
                  <label className="flex-1 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-white/20 hover:border-pub-gold rounded-xl py-4 cursor-pointer transition-colors">
                    <FaUpload size={16} className="text-white/40" />
                    <span className="text-white/50 text-xs">
                      Click to upload
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Jack Smith"
                  className={inputCls}
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Position *
                </label>
                <input
                  value={form.position}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, position: e.target.value }))
                  }
                  placeholder="e.g. Head Chef"
                  className={inputCls}
                  required
                />
              </div>

              {/* Display order */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayOrder: e.target.value }))
                  }
                  placeholder="0"
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-white/20 text-white/70 py-2.5 rounded-lg hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary disabled:opacity-50 text-sm"
                >
                  {uploading
                    ? "Uploading..."
                    : saving
                      ? "Saving..."
                      : editing
                        ? "Save Changes"
                        : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
