import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { heroImageAPI, uploadAPI, resolveImageUrl, apiErrorMessage } from '../../services/api';
import { HiPlus, HiTrash, HiX, HiEye, HiEyeOff, HiArrowLeft, HiArrowRight } from 'react-icons/hi';
import { FaUpload } from 'react-icons/fa';
import { FALLBACK_HERO } from "../../config/constants";

export default function AdminHeroImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    heroImageAPI
      .getAll()
      .then((r) => setImages(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openModal = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setShowModal(true);
  };

  // Object URLs stay allocated until explicitly revoked, so release them
  // whenever a preview is replaced, removed, or the component unmounts.
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
      toast.error("Select at least one image");
      return;
    }
    setUploading(true);
    let count = 0;
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const res = await uploadAPI.upload(selectedFiles[i]);
        // displayOrder is left to the server, which appends after the highest
        // existing value. Deriving it from images.length here collided with
        // existing slides as soon as anything had been deleted.
        await heroImageAPI.create({ imageUrl: res.data.url, active: true });
        count++;
      } catch (error) {
        toast.error(apiErrorMessage(error, `Failed to upload ${selectedFiles[i].name}`));
      }
    }
    setUploading(false);
    if (count > 0)
      toast.success(`${count} image${count > 1 ? "s" : ""} added!`);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this hero image?")) return;
    try {
      await heroImageAPI.delete(id);
      toast.success("Removed");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete"));
    }
  };

  /**
   * Show or hide a slide without deleting it.
   *
   * The `active` flag has always existed on the record and the public site
   * filters on it, but no endpoint or control ever changed it - so the only way
   * to take a hero image down was to delete it permanently.
   */
  const toggleActive = async (img) => {
    try {
      await heroImageAPI.update(img.id, { active: !img.active });
      toast.success(img.active ? "Hidden from the site" : "Now showing on the site");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update"));
    }
  };

  /** Move a slide one position and persist the whole ordering. */
  const move = async (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setImages(reordered); // optimistic, so the grid does not jump
    try {
      await heroImageAPI.reorder(reordered.map((item) => item.id));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to reorder"));
      load();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white font-display text-3xl font-bold">
            Hero Images
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {images.length} image{images.length !== 1 ? "s" : ""} — slides on
            the homepage &amp; used as banner background on all other pages
          </p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus size={18} /> Add Images
        </button>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-10">Loading...</div>
      ) : images.length === 0 ? (
        <div className="text-center text-white/30 py-20">
          <p className="text-lg font-display">No hero images yet</p>
          <p className="text-sm mt-1">
            Add images to power the homepage slideshow and all page banner
            backgrounds
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              className={`group relative rounded-xl overflow-hidden bg-gray-900 aspect-video ${
                img.active ? "" : "opacity-50"
              }`}
            >
              <img
                src={resolveImageUrl(img.imageUrl, FALLBACK_HERO)}
                alt={`Hero ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = FALLBACK_HERO;
                }}
              />
              <div className="absolute inset-0 bg-pub-dark/0 group-hover:bg-pub-dark/60 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Move earlier"
                  className="bg-white/15 text-white rounded-full p-2.5 hover:bg-white/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <HiArrowLeft size={16} />
                </button>
                <button
                  onClick={() => toggleActive(img)}
                  title={img.active ? "Hide from the site" : "Show on the site"}
                  className="bg-white/15 text-white rounded-full p-2.5 hover:bg-white/25 transition-colors"
                >
                  {img.active ? <HiEyeOff size={16} /> : <HiEye size={16} />}
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  title="Move later"
                  className="bg-white/15 text-white rounded-full p-2.5 hover:bg-white/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <HiArrowRight size={16} />
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  title="Delete permanently"
                  className="bg-red-500 text-white rounded-full p-2.5 hover:bg-red-400 transition-colors"
                >
                  <HiTrash size={16} />
                </button>
              </div>
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Slide {i + 1}
              </div>
              <div
                className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
                  img.active ? "bg-green-500/80 text-white" : "bg-gray-600/90 text-white/80"
                }`}
              >
                {img.active ? "Live" : "Hidden"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-white text-xl font-bold">
                Add Hero Images
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/50 hover:text-white"
              >
                <HiX size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 hover:border-pub-gold rounded-xl py-8 cursor-pointer transition-colors">
                <FaUpload size={22} className="text-white/40" />
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

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-lg overflow-hidden group"
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
                    ? "Uploading..."
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
