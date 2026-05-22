import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiHome } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import logoImg from '../../assets/images/JN L 2.png';

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await authAPI.login(data);
      login(res.data);
      toast.success(`Welcome back, ${res.data.username}!`);
      navigate('/admin');
    } catch {
      toast.error('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-pub-dark flex items-center justify-center px-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-pub-gold transition-colors text-sm font-medium">
        <HiHome size={18} />
        Back to Home
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src={logoImg} alt="Jack's Norwood" className="h-24 w-auto object-contain mx-auto mb-4" />
          <h1 className="font-display text-white text-3xl font-bold">Admin Login</h1>
          <p className="text-white/40 text-sm mt-2">Jack's Norwood Management System</p>
        </div>

        <div className="bg-pub-brown/60 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Username</label>
              <input
                {...register('username', { required: 'Username is required' })}
                type="text"
                placeholder="admin"
                autoComplete="username"
                className="w-full bg-pub-dark/60 border border-white/20 text-white placeholder-white/30 px-4 py-3 rounded-lg focus:outline-none focus:border-pub-gold transition-colors"
              />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-pub-dark/60 border border-white/20 text-white placeholder-white/30 px-4 py-3 rounded-lg focus:outline-none focus:border-pub-gold transition-colors"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-base disabled:opacity-50">
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
