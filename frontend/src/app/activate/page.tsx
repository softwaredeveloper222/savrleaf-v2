//activation page
'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';

function ActivationPageContent() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const inviteByAdmin = searchParams.get('inviteByAdmin');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const activateAccount = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/activate?token=${token}`);
                setSuccess(res.data.message);
                if (!inviteByAdmin) {
                    router.replace('/partner-login');
                }
            } catch (err) {
                console.error('Activation error:', err);
                setError('Failed to activate account');
            }
        }
        activateAccount();
    }, [token, inviteByAdmin, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/set-password`, { token, password });
            setSuccess(res.data.message);
        } catch (err) {
            console.error('Set password error:', err);
        }
        router.replace('/partner-login');
    }

    return (
        <>
        {error && (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500">{error}</p>
            </div>
        )}
        {success && (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Activation Successful</h1>
                <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-orange-100 flex flex-col gap-4 space-y-4">
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" />
                    <button type="submit" className="px-5 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 focus:ring focus:ring-orange-300 transition cursor-pointer">Submit</button>
                </form>
            </div>
        )}
        </>
    );
}

export default function ActivationPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        }>
            <ActivationPageContent />
        </Suspense>
    );
}