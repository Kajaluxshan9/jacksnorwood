import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { eventAPI, resolveImageUrl } from "../../services/api";
import { HiPlus, HiPencil, HiTrash, HiX } from "react-icons/hi";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import ImageUpload from "../../components/ui/ImageUpload";
import { FALLBACK_EVENT } from "../../config/constants";

const FALLBACK = FALLBACK_EVENT;

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm();
  const [imageUrl, setImageUrl] = useState("");

  const load = () =>
    eventAPI
      .getAll()
      .then((r) => setEvents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    reset();
    setImageUrl("");
    setShowModal(true);
  };
  const openEdit = (e) => {
    setEditing(e);
    ["title", "description", "reservationLink"].forEach((f) =>
      setValue(f, e[f]),
    );
    setImageUrl(e.imageUrl || "");
    setValue("date", e.date);
    setValue("time", e.time ? e.time.slice(0, 5) : "");
    setValue("active", e.active);
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, imageUrl };
      if (editing) {
        await eventAPI.update(editing.id, payload);
        toast.success("Event updated!");
      } else {
        await eventAPI.create(payload);
        toast.success("Event created!");
      }
      setShowModal(false);
      reset();
      load();
    } catch {
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await eventAPI.delete(id);
      toast.success("Deleted");
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
          <h1 className="text-white font-display text-3xl font-bold">Events</h1>
          <p className="text-white/40 text-sm mt-1">{events.length} events</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus size={18} /> New Event
        </button>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden flex"
            >
              <div className="w-32 flex-shrink-0 overflow-hidden">
                <img
                  src={resolveImageUrl(event.imageUrl, FALLBACK)}
                  alt={event.title}
                  onError={(e) => {
                    e.target.src = FALLBACK;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    {event.date && (
                      <span className="text-pub-gold text-xs flex items-center gap-1">
                        <FaCalendarAlt size={10} />
                        {event.date}
                      </span>
                    )}
                    {event.time && (
                      <span className="text-pub-gold text-xs flex items-center gap-1">
                        <FaClock size={10} />
                        {event.time?.slice(0, 5)}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${event.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                    >
                      {event.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold font-display mb-1">
                    {event.title}
                  </h3>
                  <p className="text-white/40 text-xs line-clamp-2">
                    {event.description}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(event)}
                    className="flex items-center gap-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded px-3 py-1 text-xs"
                  >
                    <HiPencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    className="flex items-center gap-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded px-3 py-1 text-xs"
                  >
                    <HiTrash size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-white text-xl font-bold">
                {editing ? "Edit Event" : "New Event"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/50 hover:text-white"
              >
                <HiX size={22} />
              </button>
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
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Image"
                inputCls={inputCls}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register("date")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                    Time
                  </label>
                  <input
                    type="time"
                    {...register("time")}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">
                  Reservation Link
                </label>
                <input
                  {...register("reservationLink")}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("active")}
                  className="w-4 h-4 accent-pub-gold"
                />
                <span className="text-white/70 text-sm">Active</span>
              </label>
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
