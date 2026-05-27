import { Link, router, usePage } from '@inertiajs/react';
import {
    Radio, Power, RefreshCw, LogOut, ArrowLeft, Shield,
    Info, Settings, Link2, Globe, AudioLines, FolderOpen, Users,
    Music, FileText, BarChart3, Menu, X, Youtube
} from 'lucide-react';
import ThemeToggle from '@/Components/ThemeToggle';
import { useState } from 'react';

interface StationMini {
    id: number;
    name: string;
    type: 'audio' | 'video';
    status: string;
    port: number;
}

interface PageProps {
    station: StationMini;
    isImpersonating?: boolean;
    auth?: {
        user: {
            name: string;
            email: string;
            role: string;
        } | null;
    };
    app?: {
        logo: string;
        favicon: string;
        name: string;
    };
}

const menuItems = [
    { label: 'Información general', icon: Info, route: 'show', slug: '' },
    { label: 'Configurar', icon: Settings, route: 'config', slug: '/config' },
    { label: 'Widgets y enlaces', icon: Link2, route: 'widgets', slug: '/widgets' },
    { label: 'Página pública', icon: Globe, route: '', slug: '', disabled: true },
    { label: 'Puntos de montaje', icon: AudioLines, route: '', slug: '', disabled: true },
    { label: 'Administrador de archivos', icon: FolderOpen, route: 'files', slug: '/files' },
    { label: 'Gerente de DJ', icon: Users, route: '', slug: '', disabled: true },
    { label: 'Título de la canción', icon: Music, route: '', slug: '', disabled: true },
    { label: 'Archivos de registro', icon: FileText, route: '', slug: '', disabled: true },
    { label: 'Informes', icon: BarChart3, route: '', slug: '', disabled: true },
];

export default function StationLayout({ children, currentSection = 'show' }: {
    children: React.ReactNode;
    currentSection?: string;
}) {
    const { station, isImpersonating, auth, app } = usePage<any>().props as PageProps;
    const isAudio = station.type === 'audio';
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleToggle = () => {
        router.post(`/dashboard/station/${station.id}/toggle`);
    };

    const handleRestart = () => {
        if (confirm('¿Reiniciar los servicios de streaming?')) {
            router.post(`/dashboard/station/${station.id}/restart`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row overflow-x-hidden relative">
            {/* Glowing background */}
            <div className="fixed top-0 right-1/4 w-150 h-150 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-10 left-1/4 w-150 h-150 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Mobile Top Header (Hidden on Desktop) */}
            <header className="md:hidden h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {app?.logo ? (
                        <img src={app.logo} alt={app?.name || 'Logo'} className="max-h-8 max-w-[120px] object-contain" />
                    ) : (
                        <>
                            <div className={`p-2 bg-gradient-to-br rounded-lg text-white ${
                                isAudio ? 'from-indigo-500 to-violet-600' : 'from-pink-500 to-violet-600'
                            }`}>
                                <Radio className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xs font-bold text-white truncate max-w-[120px]">{station.name}</h2>
                                <span className={`text-[8px] font-mono font-bold uppercase ${
                                    station.status === 'online' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                                }`}>{station.status}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Compact Start/Stop Buttons */}
                    <button
                        onClick={handleToggle}
                        className={`p-1.5 rounded-lg border text-xs transition-all ${
                            station.status === 'online'
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-indigo-500 text-white border-indigo-600'
                        }`}
                        title={station.status === 'online' ? 'Apagar' : 'Encender'}
                    >
                        <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleRestart}
                        disabled={station.status !== 'online'}
                        className="p-1.5 bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 rounded-lg"
                        title="Reiniciar"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <ThemeToggle />
                    <button
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"
                    >
                        {isDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="w-64 shrink-0 border-r border-slate-900 bg-slate-950/50 backdrop-blur-sm hidden md:flex flex-col h-screen sticky top-0 z-50">
                {/* Station Header */}
                <div className="p-5 border-b border-slate-900">
                    <div className="flex items-center justify-center mb-4 border-b border-slate-900/30 pb-3 select-none">
                        {app?.logo ? (
                            <img src={app.logo} alt={app?.name || 'Logo'} className="max-h-9 max-w-full object-contain" />
                        ) : (
                            <div className="flex items-center gap-2.5 w-full">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg ${
                                    isAudio ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-pink-500 shadow-pink-500/20'
                                }`}>
                                    TS
                                </div>
                                <span className="font-bold text-white text-sm tracking-tight font-sans">
                                    {app?.name || 'TuiStream'}
                                </span>
                            </div>
                        )}
                    </div>

                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver al panel
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${
                            station.status === 'online'
                                ? isAudio
                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                    : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                : 'bg-slate-950 border-slate-900 text-slate-500'
                        }`}>
                            <Radio className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-white truncate">{station.name}</h2>
                            <span className={`text-[10px] font-mono font-bold uppercase ${
                                station.status === 'online' ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                                {station.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={handleToggle}
                            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                station.status === 'online'
                                    ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'
                                    : isAudio
                                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                        : 'bg-pink-500 hover:bg-pink-600 text-white'
                            }`}
                        >
                            <Power className="w-3 h-3" />
                            {station.status === 'online' ? 'Apagar' : 'Encender'}
                        </button>
                        <button
                            onClick={handleRestart}
                            disabled={station.status !== 'online'}
                            className="px-2 py-1.5 bg-slate-950 border border-slate-900 hover:bg-slate-900 disabled:opacity-40 text-slate-300 rounded-lg transition-all"
                            title="Reiniciar"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                    {menuItems.map((item) => {
                        if (item.disabled) return null;
                        const isActive = item.route === currentSection;
                        const href = `/dashboard/station/${station.id}${item.slug}`;
                        return (
                            <Link
                                key={item.label}
                                href={href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    isActive
                                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                                }`}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-slate-900/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-3">Herramientas</span>
                        <div className="space-y-0.5">
                            <Link
                                href={`/dashboard/station/${station.id}/youtube-downloader`}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    currentSection === 'youtube'
                                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                                }`}
                            >
                                <Youtube className="w-4 h-4 shrink-0" />
                                YouTube DL
                            </Link>
                            <Link
                                href={`/dashboard/station/${station.id}/web-player`}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    currentSection === 'web-player'
                                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                                }`}
                            >
                                <Globe className="w-4 h-4 shrink-0" />
                                Web Player
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-900 shrink-0">
                    {isImpersonating && (
                        <button
                            onClick={() => router.post('/admin/stop-impersonating')}
                            className="w-full mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                            <Shield className="w-3.5 h-3.5" /> Volver a Admin
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {auth?.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <Link href="/dashboard/profile" className="text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-colors truncate block">{auth?.user?.name}</Link>
                            <p className="text-[10px] text-slate-600 truncate">{auth?.user?.email}</p>
                        </div>
                        <ThemeToggle />
                        <button
                            onClick={() => router.post('/logout')}
                            className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-white rounded-lg transition-all"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45 md:hidden flex justify-end">
                    <div className="w-80 h-full bg-slate-950 border-l border-slate-900 flex flex-col p-6 animate-[slideIn_0.3s_ease-out] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                            <span className="font-bold text-xs text-indigo-400 uppercase tracking-wider">Menú General</span>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <nav className="flex-1 py-4 space-y-1">
                            <Link
                                href="/dashboard"
                                onClick={() => setIsDrawerOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all"
                            >
                                <ArrowLeft className="w-4 h-4 shrink-0" />
                                Volver al panel general
                            </Link>

                            {menuItems.map((item) => {
                                if (item.disabled) return null;
                                const isActive = item.route === currentSection;
                                const href = `/dashboard/station/${station.id}${item.slug}`;
                                return (
                                    <Link
                                        key={item.label}
                                        href={href}
                                        onClick={() => setIsDrawerOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                            isActive
                                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <item.icon className="w-4.5 h-4.5 shrink-0" />
                                        {item.label}
                                    </Link>
                                );
                            })}

                            <div className="pt-4 mt-4 border-t border-slate-900/50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-3">Herramientas</span>
                                <div className="space-y-1">
                                    <Link
                                        href={`/dashboard/station/${station.id}/youtube-downloader`}
                                        onClick={() => setIsDrawerOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                            currentSection === 'youtube'
                                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <Youtube className="w-4.5 h-4.5 shrink-0" />
                                        YouTube DL
                                    </Link>
                                    <Link
                                        href={`/dashboard/station/${station.id}/web-player`}
                                        onClick={() => setIsDrawerOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                            currentSection === 'web-player'
                                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <Globe className="w-4.5 h-4.5 shrink-0" />
                                        Web Player
                                    </Link>
                                </div>
                            </div>
                        </nav>

                        <div className="pt-4 border-t border-slate-900 space-y-3 shrink-0">
                            {isImpersonating && (
                                <button
                                    onClick={() => router.post('/admin/stop-impersonating')}
                                    className="w-full py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                                >
                                    <Shield className="w-4 h-4" /> Volver a Admin
                                </button>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold">
                                    {auth?.user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-white truncate">{auth?.user?.name}</h4>
                                    <p className="text-[9px] text-slate-600 truncate">{auth?.user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.post('/logout')}
                                className="w-full py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 border-t border-slate-900 backdrop-blur-lg z-40 px-6 flex items-center justify-between select-none">
                {menuItems.filter(i => !i.disabled).slice(0, 5).map((item) => {
                    const isActive = item.route === currentSection;
                    const href = `/dashboard/station/${station.id}${item.slug}`;
                    return (
                        <Link
                            key={item.label}
                            href={href}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all relative ${
                                isActive ? 'text-indigo-400 font-extrabold' : 'text-slate-500'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[8px] font-sans font-bold mt-1 tracking-tight truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
                            {isActive && (
                                <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-y-auto h-screen pb-20 md:pb-0">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
