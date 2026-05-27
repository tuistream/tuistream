import { Link, usePage } from '@inertiajs/react';
import { Radio, LayoutDashboard, Music, Video, Users, LogOut, ChevronRight, BarChart3, Settings, Mail, Menu, X, Youtube, Disc3, PlaySquare, Code2, Globe } from 'lucide-react';
import { router } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import ThemeToggle from '@/Components/ThemeToggle';

interface AdminLayoutProps {
    children: ReactNode;
    currentPage: 'dashboard' | 'audio' | 'video' | 'clients' | 'statistics' | 'settings' | 'email-templates' | 'youtube-downloader' | 'webdj' | 'player-generator' | 'api-docs' | 'nodes';
}

interface NavItem {
    key: 'dashboard' | 'audio' | 'video' | 'clients' | 'statistics' | 'settings' | 'email-templates' | 'youtube-downloader' | 'webdj' | 'player-generator' | 'api-docs' | 'nodes';
    label: string;
    href: string;
    icon: any;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Principal',
        items: [
            { key: 'dashboard',         label: 'Dashboard',       href: '/admin/dashboard',          icon: LayoutDashboard },
            { key: 'audio',             label: 'Audio',           href: '/admin/audio',               icon: Music },
            { key: 'video',             label: 'Video',           href: '/admin/video',               icon: Video },
            { key: 'clients',           label: 'Clientes',        href: '/admin/clients',             icon: Users },
            { key: 'statistics',        label: 'Estadísticas',    href: '/admin/statistics',          icon: BarChart3 },
        ],
    },
    {
        label: 'Herramientas',
        items: [
            { key: 'youtube-downloader', label: 'YouTube DL',     href: '/admin/youtube-downloader', icon: Youtube },
            { key: 'player-generator',   label: 'Web Player',     href: '/admin/player-generator',   icon: PlaySquare },
            { key: 'api-docs',           label: 'REST API',       href: '/admin/api-docs',           icon: Code2 },
            { key: 'nodes',              label: 'Nodos / Geo-LB', href: '/admin/nodes',              icon: Globe },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { key: 'settings',       label: 'Ajustes',   href: '/admin/settings',         icon: Settings },
            { key: 'email-templates', label: 'Plantillas', href: '/admin/email-templates', icon: Mail },
        ],
    },
];

const navItems: NavItem[] = navGroups.flatMap(g => g.items);

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
    const { auth, app } = usePage<any>().props;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row overflow-x-hidden relative">

            {/* Mobile Top Header (Hidden on Desktop) */}
            <header className="md:hidden h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {app?.logo ? (
                        <img src={app.logo} alt={app?.name || 'Logo'} className="max-h-9 max-w-[150px] object-contain" />
                    ) : (
                        <>
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg text-white">
                                <Radio className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="font-bold tracking-tight text-white text-sm">{app?.name || 'TuiStream'}</span>
                                <span className="block text-[8px] text-indigo-400 font-mono font-bold -mt-1">ADMIN</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-slate-300 transition-all"
                    >
                        {isDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="w-64 min-h-screen bg-slate-950 border-r border-slate-900 hidden md:flex flex-col fixed left-0 top-0 z-50">
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-slate-900">
                    {app?.logo ? (
                        <div className="w-full flex items-center justify-center py-2 select-none">
                            <img src={app.logo} alt={app?.name || 'Logo'} className="max-h-10 max-w-full object-contain" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-linear-to-br from-indigo-500 to-violet-600 rounded-lg text-white">
                                    <Radio className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold tracking-tight text-white text-base">{app?.name || 'TuiStream'}</span>
                                    <span className="block text-[10px] text-indigo-400 font-mono font-bold -mt-0.5">ADMIN PANEL</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navGroups.map((group) => (
                        <div key={group.label} className="mb-1">
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-4 py-2">{group.label}</p>
                            {group.items.map((item) => {
                                const isActive = currentPage === item.key;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.key}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                                            isActive
                                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                        {item.label}
                                        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-500/60" />}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                            {auth?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-200 truncate">{auth?.user?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{auth?.user?.email}</p>
                        </div>
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45 md:hidden flex justify-end">
                    <div className="w-80 h-full bg-slate-950 border-l border-slate-900 flex flex-col p-6 animate-[slideIn_0.3s_ease-out]">
                        <div className="flex items-center justify-between pb-6 border-b border-slate-900">
                            <span className="font-black text-xs text-indigo-400 uppercase tracking-widest">Navegación</span>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <nav className="flex-1 py-6 space-y-2">
                            {navItems.map((item) => {
                                const isActive = currentPage === item.key;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.key}
                                        href={item.href}
                                        onClick={() => setIsDrawerOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                                            isActive
                                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="pt-6 border-t border-slate-900 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs font-black">
                                    {auth?.user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-white truncate">{auth?.user?.name}</h4>
                                    <p className="text-[10px] text-slate-500 truncate">{auth?.user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 border-t border-slate-900 backdrop-blur-lg z-40 px-6 flex items-center justify-between select-none">
                {navItems.slice(0, 5).map((item) => {
                    const isActive = currentPage === item.key;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all relative ${
                                isActive ? 'text-indigo-400 font-extrabold' : 'text-slate-500'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[9px] font-sans font-bold mt-1 tracking-tight">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                {/* Glowing background highlights */}
                <div className="fixed top-0 right-1/4 w-150 h-150 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="fixed bottom-10 left-1/3 w-150 h-150 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

                <main className="relative z-10 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
