import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const initial = saved || 'dark';
        setTheme(initial);
        applyTheme(initial);
        setMounted(true);
    }, []);

    const applyTheme = (t: 'light' | 'dark') => {
        const root = document.documentElement;
        if (t === 'light') {
            root.classList.add('light');
        } else {
            root.classList.remove('light');
        }
    };

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', next);
            applyTheme(next);
            return next;
        });
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" />;
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 dark:hover:bg-slate-900 dark:border-slate-900 text-slate-400 hover:text-white rounded-xl transition-all"
            title={theme === 'dark' ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
            ) : (
                <Moon className="w-5 h-5 text-indigo-400" />
            )}
        </button>
    );
}
