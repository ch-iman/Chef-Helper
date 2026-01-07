import { useState } from 'react';

export default function ChefLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data._id,
        name: data.name,
        email: data.email
      }));

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <h1 className="text-4xl font-bold text-black mb-2">Chef Helper</h1>
          <p className="text-gray-600">AI-Powered Recipe Generator</p>
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
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                placeholder="chef@example.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-white text-sm font-semibold mb-2">
                Password
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

            <div className="mb-6 text-right">
              <button
                onClick={() => window.location.href = '/forgot-password'}
                className="text-gray-400 text-sm hover:text-white transition"
              >
                Forgot Password?
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => window.location.href = '/register'}
                className="text-white font-semibold hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🤖 Powered by Hugging Face AI</p>
        </div>
      </div>
    </div>
  );
}