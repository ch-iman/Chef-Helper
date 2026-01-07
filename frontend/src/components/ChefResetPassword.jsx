import { useState } from 'react';

export default function ChefResetPassword() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get token from URL
  const getTokenFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || window.location.pathname.split('/').pop();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const token = getTokenFromURL();

    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: formData.password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-black p-8 rounded-lg shadow-2xl text-center">
            <div className="mb-4">
              <div className="text-6xl mb-4">✅</div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
            <p className="text-gray-400 mb-4">Redirecting to login...</p>
            <div className="animate-spin text-4xl">👨‍🍳</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-4xl font-bold text-black mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <div className="bg-black p-8 rounded-lg shadow-2xl">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div>
            <div className="mb-4">
              <label className="block text-white text-sm font-semibold mb-2">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="mb-6">
              <label className="block text-white text-sm font-semibold mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>👨‍🍳 Chef Helper</p>
        </div>
      </div>
    </div>
  );
}