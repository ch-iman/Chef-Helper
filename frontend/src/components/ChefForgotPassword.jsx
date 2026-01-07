import { useState } from 'react';

export default function ChefForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess('Password reset link has been sent to your email');
      setEmail('');
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
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-4xl font-bold text-black mb-2">Forgot Password?</h1>
          <p className="text-gray-600">Enter your email to reset your password</p>
        </div>

        <div className="bg-black p-8 rounded-lg shadow-2xl">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div>
            <div className="mb-6">
              <label className="block text-white text-sm font-semibold mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                placeholder="chef@example.com"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              onClick={() => window.location.href = '/login'}
              className="w-full text-gray-400 hover:text-white transition text-sm"
            >
              ← Back to Sign In
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