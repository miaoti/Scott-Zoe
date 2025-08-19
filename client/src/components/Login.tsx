import React, { useState } from 'react';
import { Heart, Lock, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        setPassword('');
        setLoading(false);
        return;
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm mx-auto">
        {/* Main Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 scale-in">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Heart 
                  className="h-16 w-16 text-red-500 heart-beat" 
                  fill="currentColor" 
                />
                <div className="absolute inset-0 h-16 w-16 bg-red-500/20 rounded-full blur-xl"></div>
              </div>
            </div>
            <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Scott &amp; Zoe
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              Welcome to our sanctuary
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-800 text-center">
                Choose your identity
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Scott Card */}
                <button
                  type="button"
                  onClick={() => setUsername('scott')}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${
                    username === 'scott'
                      ? 'border-purple-400 bg-purple-50/80 shadow-lg shadow-purple-400/20'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50/80'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                      username === 'scott'
                        ? 'bg-gradient-to-br from-purple-400 to-purple-500 scale-110'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-purple-300 group-hover:to-purple-400'
                    }`}>
                      S
                    </div>
                    <span className={`font-medium transition-colors ${
                      username === 'scott' ? 'text-purple-700' : 'text-gray-700'
                    }`}>
                      Scott
                    </span>
                  </div>
                  {username === 'scott' && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>

                {/* Zoe Card */}
                <button
                  type="button"
                  onClick={() => setUsername('zoe')}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${
                    username === 'zoe'
                      ? 'border-pink-500 bg-pink-50/80 shadow-lg shadow-pink-500/20'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50/80'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                      username === 'zoe'
                        ? 'bg-gradient-to-br from-pink-500 to-pink-600 scale-110'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-pink-400 group-hover:to-pink-500'
                    }`}>
                      Z
                    </div>
                    <span className={`font-medium transition-colors ${
                      username === 'zoe' ? 'text-pink-700' : 'text-gray-700'
                    }`}>
                      Zoe
                    </span>
                  </div>
                  {username === 'zoe' && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 text-center">
                Enter our secret password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50/80 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400 transition-all duration-300 text-center font-medium backdrop-blur-sm"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 border border-red-200 text-red-700 text-sm text-center py-4 px-4 rounded-2xl backdrop-blur-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transform ${
                username === 'scott'
                  ? 'bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white hover:shadow-xl hover:shadow-purple-400/25'
                  : username === 'zoe'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white hover:shadow-xl hover:shadow-pink-500/25'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  Enter Our World
                  <Heart className="h-5 w-5 ml-2" fill="currentColor" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 font-medium">
              A private space for our precious memories ✨
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400 font-medium">
            Made with ❤️ for Scott &amp; Zoe
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;