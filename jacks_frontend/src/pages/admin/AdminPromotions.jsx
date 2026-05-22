import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { promotionAPI, resolveImageUrl } from '../../services/api';
import { HiPencil, HiTrash, HiX } from 'react-icons/hi';
import { FaSun, FaStar } from 'react-icons/fa';
import ImageUpload from '../../components/ui/ImageUpload';
import { FALLBACK_PROMOTION } from "../../config/constants";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [promoType, setPromoType] = useState("SPECIAL");

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState("");

  const load = () =>
    promotionAPI
      .getAll()
      .then((r) => setPromotions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openAdd = (type) => {
    setEditing(null);
    setPromoType(type);
    reset({});
    setImageUrl("");
    setActive(true);
    setDayOfWeek("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setPromoType(p.promotionType || "SPECIAL");
    reset({
      title: p.title,
      description: p.description || "",
      startDateTime: p.startDateTime ? p.startDateTime.slice(0, 16) : "",
      endDateTime: p.endDateTime ? p.endDateTime.slice(0, 16) : "",
    });
    setImageUrl(p.imageUrl || "");
    setActive(p.active ?? true);
    setDayOfWeek(p.dayOfWeek || "");
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        imageUrl,
        active,
        promotionType: promoType,
        dayOfWeek: promoType === "DAILY" ? dayOfWeek : null,
        startDateTime:
          promoType === "SPECIAL" && data.startDateTime
            ? data.startDateTime
            : null,
        endDateTime:
          promoType === "SPECIAL" && data.endDateTime ? data.endDateTime : null,
      };
      if (editing) {
        await promotionAPI.update(editing.id, payload);
        toast.success("Promotion updated!");
      } else {
        await promotionAPI.create(payload);
        toast.success("Promotion created!");
      }
      setShowModal(false);
      reset();
      load();
    } catch {
      toast.error("Failed to save promotion");
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await promotionAPI.delete(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const inputCls =
    "w-full bg-gray-800 border border-white/20 text-white placeholder-white/40 px-3 py-2 rounded-lg focus:outline-none focus:border-pub-gold text-sm";

  // Group daily specials by day of week
  const daily = promotions.filter((p) => p.promotionType === "DAILY");
  const special = promotions.filter((p) => p.promotionType !== "DAILY");

  // Sort daily by day order
  const DAY_ORDER = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };
  const sortedDaily = [...daily].sort(
    (a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99),
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-white font-display text-3xl font-bold">
            Promotions & Specials
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {promotions.length} total promotions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openAdd("DAILY")}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FaSun size={14} /> Add Daily Special
          </button>
          <button
            onClick={() => openAdd("SPECIAL")}
            className="flex items-center gap-2 px-4 py-2 border border-pub-gold/50 text-pub-gold rounded-sm hover:bg-pub-gold/10 text-sm font-semibold uppercase tracking-wider transition-all"
          >
            <FaStar size={14} /> Add Special
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-10">Loading...</div>
      ) : (
        <>
          {/* Daily Specials — grouped by day */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <FaSun className="text-blue-400" size={16} />
              <h2 className="text-white font-display text-xl font-semibold">
                Daily Specials
              </h2>
              <span className="text-white/30 text-sm">({daily.length})</span>
            </div>
            {daily.length === 0 ? (
              <div className="text-white/30 text-sm py-4">
                No daily specials. Add one above.
              </div>
            ) : (
              <div className="space-y-6">
                {DAYS.map((day) => {
                  const dayItems = sortedDaily.filter(
                    (p) => p.dayOfWeek === day,
                  );
                  if (dayItems.length === 0) return null;
                  return (
                    <div key={day}>
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">
                        {day}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {dayItems.map((p) => (
                          <PromoCard
                            key={p.id}
                            p={p}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* No day assigned */}
                {(() => {
                  const unassigned = sortedDaily.filter((p) => !p.dayOfWeek);
                  if (unassigned.length === 0) return null;
                  return (
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">
                        Unassigned
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {unassigned.map((p) => (
                          <PromoCard
                            key={p.id}
                            p={p}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Featured Specials */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaStar className="text-purple-400" size={16} />
              <h2 className="text-white font-display text-xl font-semibold">
                Featured Specials
              </h2>
              <span className="text-white/30 text-sm">({special.length})</span>
            </div>
            {special.length === 0 ? (
              <div className="text-white/30 text-sm py-4">
                No featured specials. Add one above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {special.map((p) => (
                  <PromoCard
                    key={p.id}
                    p={p}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {promoType === "DAILY" ? (
                  <FaSun className="text-blue-400" />
                ) : (
                  <FaStar className="text-purple-400" />
                )}
                <h2 className="font-display text-white text-xl font-bold">
                  {editing ? "Edit" : "New"}{" "}
                  {promoType === "DAILY" ? "Daily Special" : "Featured Special"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActive((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-green-500/20 text-green-400 border border-green-500/40"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${active ? "bg-green-400" : "bg-red-400"}`}
                  />
                  {active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/50 hover:text-white"
                >
                  <HiX size={22} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Title *
                </label>
                <input
                  {...register("title", { required: true })}
                  className={inputCls}
                />
              </div>

              {/* Day of week — only for DAILY */}
              {promoType === "DAILY" && (
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
                    Day of Week *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setDayOfWeek(day)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                          dayOfWeek === day
                            ? "bg-pub-gold text-pub-dark border-pub-gold"
                            : "bg-gray-800 text-white/60 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {dayOfWeek && (
                    <p className="text-pub-gold text-xs mt-2">
                      Selected: {dayOfWeek}
                    </p>
                  )}
                </div>
              )}

              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Poster Image"
                inputCls={inputCls}
              />

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className={inputCls + " resize-none"}
                />
              </div>

              {promoType === "SPECIAL" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        {...register("startDateTime")}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        {...register("endDateTime")}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </>
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
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PromoCard({ p, onEdit, onDelete }) {
  const FALLBACK_IMG = FALLBACK_PROMOTION;
  const isDaily = p.promotionType === "DAILY";
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
      <div className="h-40 relative overflow-hidden">
        <img
          src={resolveImageUrl(p.imageUrl, FALLBACK_IMG)}
          alt={p.title}
          onError={(e) => {
            e.target.src = FALLBACK_IMG;
          }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isDaily
                ? "bg-blue-500/90 text-white"
                : "bg-purple-500/90 text-white"
            }`}
          >
            {isDaily ? <FaSun size={9} /> : <FaStar size={9} />}
            {isDaily ? p.dayOfWeek || "Daily" : "Special"}
          </span>
        </div>
        <div
          className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${p.active ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"}`}
        >
          {p.active ? "Active" : "Inactive"}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold font-display mb-1">
          {p.title}
        </h3>
        {p.description && (
          <p className="text-white/50 text-xs line-clamp-2 mb-2">
            {p.description}
          </p>
        )}
        {!isDaily && p.endDateTime && (
          <p className="text-white/30 text-xs mb-2">
            Ends:{" "}
            {new Date(p.endDateTime).toLocaleString("en-AU", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit(p)}
            className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg py-1.5 text-sm flex items-center justify-center gap-1.5"
          >
            <HiPencil size={14} /> Edit
          </button>
          <button
            onClick={() => onDelete(p.id, p.title)}
            className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg py-1.5 text-sm flex items-center justify-center gap-1.5"
          >
            <HiTrash size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
