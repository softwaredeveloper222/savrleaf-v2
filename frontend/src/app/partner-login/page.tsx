'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

export default function PartnerLogin() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { login, isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'partner') {
      router.replace('/partner-dashboard');
    }
  }, [loading, isAuthenticated, user, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user, firstLogin } = res.data;

      login(token, user);
      router.push('/partner-dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Login failed');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    }
  };

  const resendActivationLink = async () => {
    if(email === '') {
      setError('Please enter your email');
      return;
    }
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-activation-link`, { email });
    } catch (err: unknown) {
      console.error('Resend activation link error:', err);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 bg-gradient-to-br from-orange-50 to-white px-4 md:px-16 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center text-orange-800 mb-8">
          Partner Login
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded w-full max-w-md text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-orange-100 flex flex-col gap-4"
        >
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="current-password"
          />

          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded transition cursor-pointer"
          >
            Log In
          </button>

          {/* Forgot Password and Resend activation link */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="text-orange-700 font-medium hover:underline text-sm"
              onClick={() => router.push('/forgot-password')}
            >
              Forgot Password?
            </button>
            <button
              type="button"
              className="text-orange-700 font-medium hover:underline text-sm"
              onClick={() => resendActivationLink()}
            >
              Resend activation link
            </button>
          </div>

          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">Not a partner yet? </span>
            <button
              type="button"
              className="text-orange-700 font-medium hover:underline text-sm"
              onClick={() => router.push('/partner-signup')}
            >
              Apply to be a partner instead
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
