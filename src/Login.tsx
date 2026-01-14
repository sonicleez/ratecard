import React, { useState } from 'react';
import { supabase } from './supabase';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';

interface LoginProps {
    onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            onLogin();
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            alert('Signup successful! You can now login.');
            setLoading(false);
        }
    };

    return (
        <div className="login-overlay">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">
                        <Sparkles className="icon-pulse" />
                    </div>
                    <h2>AI Quotation Studio</h2>
                    <p>Login to manage your smart quotations</p>
                </div>

                <form className="login-form">
                    <div className="input-group">
                        <Mail size={18} />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <Lock size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <div className="login-actions">
                        <button
                            type="button"
                            className="login-btn primary"
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Log In'}
                        </button>
                        <button
                            type="button"
                            className="login-btn secondary"
                            onClick={handleSignUp}
                            disabled={loading}
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
