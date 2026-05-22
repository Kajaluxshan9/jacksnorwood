import { useState, useRef } from 'react';
import { HiUpload, HiX } from 'react-icons/hi';
import { uploadAPI, resolveImageUrl } from "../../services/api";
import toast from "react-hot-toast";
import { FALLBACK_IMAGE } from "../../config/constants";

/**
 * Device-only image upload field.
 * Props:
 *   value    – current image URL string
 *   onChange – called with new URL string
 *   label    – field label text (default "Image")
 *   inputCls – base input className from parent admin form
 */
export default function ImageUpload({ value, onChange, label = "Image" }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.upload(file);
      onChange(res.data.url);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
        {label}
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full border border-dashed border-white/30 text-white/50 hover:border-pub-gold hover:text-pub-gold rounded-lg py-5 text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        <HiUpload size={16} />
        {uploading ? "Uploading..." : "Click to select image from device"}
      </button>

      {/* Preview */}
      {value && (
        <div className="mt-2 flex items-center gap-2 bg-white/5 rounded-lg p-2">
          <img
            src={resolveImageUrl(value, FALLBACK_IMAGE)}
            alt="preview"
            className="h-10 w-14 object-cover rounded flex-shrink-0"
            onError={(e) => {
              e.target.src = FALLBACK_IMAGE;
            }}
          />
          <span className="text-white/40 text-xs truncate flex-1">{value}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-white/30 hover:text-red-400 flex-shrink-0"
          >
            <HiX size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
