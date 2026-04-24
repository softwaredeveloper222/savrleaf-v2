'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${email}/send-reset-password-email`
      );

      if (res.data.success) {
        setSuccess('Password reset email sent! Please check your inbox.');
        setTimeout(() => {
          router.push('/partner-login');
        }, 3000);
      }
    } catch (err: unknown) {
      console.error('Send reset password email error:', err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Failed to send reset password email');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send reset password email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 bg-gradient-to-br from-orange-50 to-white px-4 md:px-16 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center text-orange-800 mb-8">
          Forgot Password
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded w-full max-w-md text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded w-full max-w-md text-center">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-orange-100 flex flex-col gap-4"
        >
          <p className="text-gray-600 text-sm mb-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center mt-2">
            <button
              type="button"
              className="text-orange-700 font-medium hover:underline text-sm"
              onClick={() => router.push('/partner-login')}
            >
              Back to Login
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}

