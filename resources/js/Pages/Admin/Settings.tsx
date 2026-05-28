import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Settings, Save, Wrench, MonitorPlay, Images, Mail, Puzzle, BarChart3, Database, Code, MoreHorizontal, Server, AlertCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import AdminLayout from './Layout';

interface PageProps {
    activeSection: string;
    settings: Record<string, string>;
    sections: Record<string, string>;
    flash: {
        success?: string;
        error?: string;
    };
}

const sectionIcons: Record<string, any> = {
    general: Wrench,
    services: Server,
    video_players: MonitorPlay,
    albums: Images,
    email: Mail,
    plugins: Puzzle,
    statistics: BarChart3,
    backups: Database,
    html: Code,
    misc: MoreHorizontal,
};

function PlaceholderSection({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-4">
                <AlertCircle className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm">{description}</p>
            <span className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-500">
                Próximamente
            </span>
        </div>
    );
}

function GeneralSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm<any>({
        app_name: settings.app_name || 'TuiStream',
        app_timezone: settings.app_timezone || 'UTC',
        app_language: settings.app_language || 'es',
        app_logo: null,
        app_favicon: null,
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_tax_id: settings.company_tax_id || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({ group: 'general', settings: data }));
        post('/admin/settings');
    };

    const latamTimezones = [
        { value: 'UTC', label: 'UTC (Tiempo Universal Coordinado)' },
        { value: 'America/Bogota', label: 'Bogotá, Colombia (UTC-5)' },
        { value: 'America/Mexico_City', label: 'Ciudad de México, México (UTC-6)' },
        { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires, Argentina (UTC-3)' },
        { value: 'America/Santiago', label: 'Santiago, Chile (UTC-4)' },
        { value: 'America/Lima', label: 'Lima, Perú (UTC-5)' },
        { value: 'America/Caracas', label: 'Caracas, Venezuela (UTC-4)' },
        { value: 'America/La_Paz', label: 'La Paz, Bolivia (UTC-4)' },
        { value: 'America/Montevideo', label: 'Montevideo, Uruguay (UTC-3)' },
        { value: 'America/Asuncion', label: 'Asunción, Paraguay (UTC-4)' },
        { value: 'America/Quito', label: 'Quito, Ecuador (UTC-5)' },
        { value: 'America/Guatemala', label: 'Guatemala (UTC-6)' },
        { value: 'America/El_Salvador', label: 'El Salvador (UTC-6)' },
        { value: 'America/Tegucigalpa', label: 'Tegucigalpa, Honduras (UTC-6)' },
        { value: 'America/Managua', label: 'Managua, Nicaragua (UTC-6)' },
        { value: 'America/Costa_Rica', label: 'Costa Rica (UTC-6)' },
        { value: 'America/Panama', label: 'Panamá (UTC-5)' },
        { value: 'America/Santo_Domingo', label: 'Santo Domingo, Rep. Dominicana (UTC-4)' },
        { value: 'America/Puerto_Rico', label: 'San Juan, Puerto Rico (UTC-4)' },
        { value: 'America/Havana', label: 'La Habana, Cuba (UTC-5)' },
        { value: 'America/Sao_Paulo', label: 'São Paulo, Brasil (UTC-3)' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nombre de la Aplicación</label>
                    <input type="text" value={data.app_name} onChange={e => setData('app_name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Idioma por Defecto</label>
                    <select value={data.app_language} onChange={e => setData('app_language', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Logo del Sitio (PNG, JPG)</label>
                    <input type="file" onChange={e => setData('app_logo', e.target.files?.[0] || null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-400"
                        accept="image/*"
                    />
                    {settings.app_logo && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">Actual:</span>
                            <img src={settings.app_logo} alt="Logo" className="h-8 max-w-[120px] rounded-lg object-contain bg-slate-950/80 p-1 border border-slate-900" />
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Favicon del Sitio (ICO, PNG)</label>
                    <input type="file" onChange={e => setData('app_favicon', e.target.files?.[0] || null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-400"
                        accept="image/x-icon, image/png, image/jpeg"
                    />
                    {settings.app_favicon && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">Actual:</span>
                            <img src={settings.app_favicon} alt="Favicon" className="h-8 w-8 rounded-lg object-contain bg-slate-950/80 p-1 border border-slate-900" />
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Zona Horaria Oficial de América Latina</label>
                <select value={data.app_timezone} onChange={e => setData('app_timezone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                >
                    {latamTimezones.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                </select>
            </div>

            {/* Datos de Nuestra Empresa Section */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                <div className="border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Datos de Nuestra Empresa</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Configuración de la información fiscal e institucional de su empresa.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Nombre de la Empresa</label>
                        <input type="text" value={data.company_name} onChange={e => setData('company_name', e.target.value)}
                            placeholder="Empresa LLC..."
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Identificación Fiscal (RUT / NIT / CIF)</label>
                        <input type="text" value={data.company_tax_id} onChange={e => setData('company_tax_id', e.target.value)}
                            placeholder="e.g. NIT 900.123.456-7"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Teléfono de Contacto</label>
                        <input type="text" value={data.company_phone} onChange={e => setData('company_phone', e.target.value)}
                            placeholder="+57 300 123 4567"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Correo Electrónico Corporativo</label>
                        <input type="email" value={data.company_email} onChange={e => setData('company_email', e.target.value)}
                            placeholder="contacto@empresa.com"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Dirección Física de la Empresa</label>
                    <input type="text" value={data.company_address} onChange={e => setData('company_address', e.target.value)}
                        placeholder="Calle 123 # 45-67, Edificio Corporativo, Piso 5"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar General
                </button>
            </div>
        </form>
    );
}

function ServicesSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        server_domain_type: settings.server_domain_type || 'domain',
        server_domain: settings.server_domain || '',
        base_port: settings.base_port || '8000',
        default_max_listeners: settings.default_max_listeners || '100',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({ group: 'services', settings: data }));
        post('/admin/settings');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Host</label>
                    <select value={data.server_domain_type} onChange={e => setData('server_domain_type', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    >
                        <option value="domain">Nombre de Dominio</option>
                        <option value="ip">Dirección IP del Servidor</option>
                    </select>
                </div>
                
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        {data.server_domain_type === 'domain' ? 'Dominio del Servidor' : 'IP del Servidor'}
                    </label>
                    <input type="text" value={data.server_domain} onChange={e => setData('server_domain', e.target.value)}
                        placeholder={data.server_domain_type === 'domain' ? 'radio.midominio.com' : '192.168.1.10'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Puerto Base</label>
                    <input type="number" value={data.base_port} onChange={e => setData('base_port', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Oyentes por Defecto</label>
                    <input type="number" value={data.default_max_listeners} onChange={e => setData('default_max_listeners', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
            </div>
            <div className="pt-4">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Services
                </button>
            </div>
        </form>
    );
}

function EmailSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || '587',
        smtp_user: settings.smtp_user || '',
        smtp_password: settings.smtp_password || '',
        smtp_encryption: settings.smtp_encryption || 'tls',
        mail_from_address: settings.mail_from_address || '',
        mail_from_name: settings.mail_from_name || 'TuiStream',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({ group: 'email', settings: data }));
        post('/admin/settings');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">SMTP Host</label>
                    <input type="text" value={data.smtp_host} onChange={e => setData('smtp_host', e.target.value)}
                        placeholder="smtp.ejemplo.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">SMTP Puerto</label>
                    <input type="number" value={data.smtp_port} onChange={e => setData('smtp_port', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">SMTP Usuario</label>
                    <input type="text" value={data.smtp_user} onChange={e => setData('smtp_user', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">SMTP Contraseña</label>
                    <input type="password" value={data.smtp_password} onChange={e => setData('smtp_password', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Encriptación</label>
                    <select value={data.smtp_encryption} onChange={e => setData('smtp_encryption', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    >
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                        <option value="none">Ninguna</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">From Address</label>
                    <input type="email" value={data.mail_from_address} onChange={e => setData('mail_from_address', e.target.value)}
                        placeholder="noreply@ejemplo.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">From Name</label>
                    <input type="text" value={data.mail_from_name} onChange={e => setData('mail_from_name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
            </div>
            <div className="pt-4">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Email
                </button>
            </div>
        </form>
    );
}

function HtmlSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        html_head: settings.html_head || '',
        html_footer: settings.html_footer || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({ group: 'html', settings: data }));
        post('/admin/settings');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Custom HTML Head</label>
                <textarea value={data.html_head} onChange={e => setData('html_head', e.target.value)}
                    rows={6}
                    placeholder="<!-- Código HTML para <head> -->"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Custom HTML Footer</label>
                <textarea value={data.html_footer} onChange={e => setData('html_footer', e.target.value)}
                    rows={6}
                    placeholder="<!-- Código HTML para footer -->"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                />
            </div>
            <div className="pt-4">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar HTML
                </button>
            </div>
        </form>
    );
}

function MiscSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        maintenance_mode: settings.maintenance_mode === '1',
        admin_notes: settings.admin_notes || '',
        api_access: settings.api_access || 'disabled',
        recaptcha_failed_logins: settings.recaptcha_failed_logins === '1',
        recaptcha_site_key: settings.recaptcha_site_key || '',
        recaptcha_secret: settings.recaptcha_secret || '',
        facebook_app_id: settings.facebook_app_id || '',
        facebook_app_secret: settings.facebook_app_secret || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            group: 'misc',
            settings: {
                maintenance_mode: data.maintenance_mode ? '1' : '0',
                admin_notes: data.admin_notes,
                api_access: data.api_access,
                recaptcha_failed_logins: data.recaptcha_failed_logins ? '1' : '0',
                recaptcha_site_key: data.recaptcha_site_key,
                recaptcha_secret: data.recaptcha_secret,
                facebook_app_id: data.facebook_app_id,
                facebook_app_secret: data.facebook_app_secret,
            }
        }));
        post('/admin/settings');
    };

    const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.hostname}:2020/controller/StreamTargets/fbauth`
        : 'https://you-domain:2020/controller/StreamTargets/fbauth';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Misc section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950">
                    <input type="checkbox" id="maintenance" checked={data.maintenance_mode} onChange={e => setData('maintenance_mode', e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <label htmlFor="maintenance" className="text-sm text-slate-300 font-semibold cursor-pointer">
                        Modo Mantenimiento
                    </label>
                    <span className="text-xs text-slate-500 ml-auto">Mostrará página de mantenimiento a los usuarios</span>
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Notas de Administrador</label>
                    <textarea value={data.admin_notes} onChange={e => setData('admin_notes', e.target.value)}
                        rows={3}
                        placeholder="Notas internas..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
            </div>

            {/* API Access Section */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                <div className="border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">API Access</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Configuración del acceso a la API del sistema para nuevos usuarios e integraciones.</p>
                </div>
                <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">API Access</label>
                    <select value={data.api_access} onChange={e => setData('api_access', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                    >
                        <option value="enabled_not_default">Enabled - New users will NOT be provided API access until enabled</option>
                        <option value="enabled_default">Enabled - New users will be provided API access by default</option>
                        <option value="disabled">Disabled - No API Access, billing integrations will not work</option>
                    </select>
                </div>
            </div>

            {/* Google reCAPTCHA Section */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                <div className="border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Google reCAPTCHA</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Protección contra ataques de fuerza bruta en el formulario de inicio de sesión.</p>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-850 bg-slate-950/80">
                    <input type="checkbox" id="recaptcha_failed_logins" checked={data.recaptcha_failed_logins} onChange={e => setData('recaptcha_failed_logins', e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <label htmlFor="recaptcha_failed_logins" className="text-xs text-slate-300 font-semibold cursor-pointer">
                        Google reCAPTCHA on failed logins
                    </label>
                    <span className="text-[10px] text-slate-500 ml-auto">Habilitar/Deshabilitar</span>
                </div>

                {data.recaptcha_failed_logins && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Recaptcha v2 Site Key</label>
                            <input type="text" value={data.recaptcha_site_key} onChange={e => setData('recaptcha_site_key', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                placeholder="Clave de sitio..."
                                required={data.recaptcha_failed_logins}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Recaptcha v2 Secret</label>
                            <input type="password" value={data.recaptcha_secret} onChange={e => setData('recaptcha_secret', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                placeholder="Clave secreta..."
                                required={data.recaptcha_failed_logins}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Facebook App Integration Section */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                <div className="border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Custom Facebook App Integration</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                        If it is preferred to use your own facebook app for stream targets, you may specify the api key and secret in this field. It is required to delete and recreate facebook stream targets after changing this field.
                    </p>
                </div>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[11px] text-indigo-300 font-mono select-all space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block select-none">OAuth Redirect URL:</span>
                    <code>{redirectUrl}</code>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Facebook App ID</label>
                        <input type="text" value={data.facebook_app_id} onChange={e => setData('facebook_app_id', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                            placeholder="Facebook App ID"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Facebook App Secret</label>
                        <input type="password" value={data.facebook_app_secret} onChange={e => setData('facebook_app_secret', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                            placeholder="Facebook App Secret"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Ajustes Misc.
                </button>
            </div>
        </form>
    );
}

function StatisticsSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        stats_retention_days: settings.stats_retention_days || '90',
        enable_metrics: settings.enable_metrics === '1',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({ group: 'statistics', settings: { stats_retention_days: data.stats_retention_days, enable_metrics: data.enable_metrics ? '1' : '0' } }));
        post('/admin/settings');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950">
                <input type="checkbox" id="enable_metrics" checked={data.enable_metrics} onChange={e => setData('enable_metrics', e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                />
                <label htmlFor="enable_metrics" className="text-sm text-slate-300 font-semibold cursor-pointer">
                    Habilitar Métricas
                </label>
            </div>
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Retención de Datos (días)</label>
                <input type="number" value={data.stats_retention_days} onChange={e => setData('stats_retention_days', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                />
            </div>
            <div className="pt-4">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Statistics
                </button>
            </div>
        </form>
    );
}

function VideoPlayersSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        default_audio_player_iframe: settings.default_audio_player_iframe || '',
        default_video_player_iframe: settings.default_video_player_iframe || '',
        enable_clappr: settings.enable_clappr === '1',
        enable_videojs: settings.enable_videojs !== '0', // default: true
        enable_html5_generic: settings.enable_html5_generic !== '0', // default: true
        default_video_player: settings.default_video_player || 'videojs',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        // Validation: if selected default is disabled, auto-fallback to an enabled one
        let defaultPlayer = data.default_video_player;
        if (defaultPlayer === 'videojs' && !data.enable_videojs) {
            defaultPlayer = data.enable_html5_generic ? 'html5_generic' : (data.enable_clappr ? 'clappr' : 'videojs');
        } else if (defaultPlayer === 'clappr' && !data.enable_clappr) {
            defaultPlayer = data.enable_videojs ? 'videojs' : (data.enable_html5_generic ? 'html5_generic' : 'clappr');
        } else if (defaultPlayer === 'html5_generic' && !data.enable_html5_generic) {
            defaultPlayer = data.enable_videojs ? 'videojs' : (data.enable_clappr ? 'clappr' : 'html5_generic');
        }

        transform((data) => ({
            group: 'video_players',
            settings: {
                default_audio_player_iframe: data.default_audio_player_iframe,
                default_video_player_iframe: data.default_video_player_iframe,
                enable_clappr: data.enable_clappr ? '1' : '0',
                enable_videojs: data.enable_videojs ? '1' : '0',
                enable_html5_generic: data.enable_html5_generic ? '1' : '0',
                default_video_player: defaultPlayer,
            },
        }));
        post('/admin/settings');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4">
                <div className="border-b border-slate-900 pb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configuración de Reproductores Activos</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Active o desactive las tecnologías de reproducción disponibles en el sistema.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Video.js Option */}
                    <div className="p-4 rounded-xl border border-slate-900 bg-slate-950 flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="enable_videojs" className="text-xs font-bold text-slate-200 cursor-pointer">Video.js (Moderno)</label>
                            <input 
                                type="checkbox" 
                                id="enable_videojs" 
                                checked={data.enable_videojs} 
                                onChange={e => setData('enable_videojs', e.target.checked)}
                                className="w-4 h-4 accent-indigo-500 rounded"
                            />
                        </div>
                        <span className="text-[10px] text-slate-500 leading-relaxed">Reproductor HTML5 premium con soporte HLS adaptativo y skin oficial de TuiStream.</span>
                    </div>

                    {/* Clappr Option */}
                    <div className="p-4 rounded-xl border border-slate-900 bg-slate-950 flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="enable_clappr" className="text-xs font-bold text-slate-200 cursor-pointer">Clappr Player</label>
                            <input 
                                type="checkbox" 
                                id="enable_clappr" 
                                checked={data.enable_clappr} 
                                onChange={e => setData('enable_clappr', e.target.checked)}
                                className="w-4 h-4 accent-indigo-500 rounded"
                            />
                        </div>
                        <span className="text-[10px] text-slate-500 leading-relaxed">Reproductor extensible desarrollado por Globo.com, altamente personalizable vía plugins.</span>
                    </div>

                    {/* Generic HTML5 Option */}
                    <div className="p-4 rounded-xl border border-slate-900 bg-slate-950 flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="enable_html5_generic" className="text-xs font-bold text-slate-200 cursor-pointer">HTML5 Genérico</label>
                            <input 
                                type="checkbox" 
                                id="enable_html5_generic" 
                                checked={data.enable_html5_generic} 
                                onChange={e => setData('enable_html5_generic', e.target.checked)}
                                className="w-4 h-4 accent-indigo-500 rounded"
                            />
                        </div>
                        <span className="text-[10px] text-slate-500 leading-relaxed">Etiqueta &lt;video&gt; nativa del navegador. Ultra-liviano y compatible con controles nativos del OS.</span>
                    </div>
                </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4">
                <div className="border-b border-slate-900 pb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Reproductor Predeterminado del Sistema</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Seleccione cuál de los reproductores activos se cargará por defecto para los usuarios.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Select Video.js as default */}
                    <label className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                        data.default_video_player === 'videojs' 
                            ? 'bg-indigo-500/10 border-indigo-500/30' 
                            : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                    } ${!data.enable_videojs ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-2">
                            <input 
                                type="radio" 
                                name="default_video_player" 
                                value="videojs"
                                disabled={!data.enable_videojs}
                                checked={data.default_video_player === 'videojs'}
                                onChange={e => setData('default_video_player', e.target.value)}
                                className="w-3.5 h-3.5 accent-indigo-500"
                            />
                            <span className="text-xs font-extrabold text-white">Video.js (Recomendado)</span>
                        </div>
                        <span className="text-[9px] text-slate-500">Diseño oscuro premium oficial del panel de TuiStream.</span>
                    </label>

                    {/* Select Clappr as default */}
                    <label className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                        data.default_video_player === 'clappr' 
                            ? 'bg-indigo-500/10 border-indigo-500/30' 
                            : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                    } ${!data.enable_clappr ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-2">
                            <input 
                                type="radio" 
                                name="default_video_player" 
                                value="clappr"
                                disabled={!data.enable_clappr}
                                checked={data.default_video_player === 'clappr'}
                                onChange={e => setData('default_video_player', e.target.value)}
                                className="w-3.5 h-3.5 accent-indigo-500"
                            />
                            <span className="text-xs font-extrabold text-white">Clappr</span>
                        </div>
                        <span className="text-[9px] text-slate-500">Ideal si requieres plugins de terceros para broadcasting.</span>
                    </label>

                    {/* Select HTML5 Generic as default */}
                    <label className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                        data.default_video_player === 'html5_generic' 
                            ? 'bg-indigo-500/10 border-indigo-500/30' 
                            : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                    } ${!data.enable_html5_generic ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-2">
                            <input 
                                type="radio" 
                                name="default_video_player" 
                                value="html5_generic"
                                disabled={!data.enable_html5_generic}
                                checked={data.default_video_player === 'html5_generic'}
                                onChange={e => setData('default_video_player', e.target.value)}
                                className="w-3.5 h-3.5 accent-indigo-500"
                            />
                            <span className="text-xs font-extrabold text-white">HTML5 Nativo</span>
                        </div>
                        <span className="text-[9px] text-slate-500">Carga inmediata sin scripts adicionales. Controls estándar.</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Default Audio Player — iframe</label>
                    <textarea value={data.default_audio_player_iframe} onChange={e => setData('default_audio_player_iframe', e.target.value)}
                        rows={3}
                        placeholder='<iframe src="..." width="100%" height="60" frameborder="0"></iframe>'
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Código HTML iframe para reproductor de audio por defecto.</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Default Video Player — iframe</label>
                    <textarea value={data.default_video_player_iframe} onChange={e => setData('default_video_player_iframe', e.target.value)}
                        rows={3}
                        placeholder='<iframe src="..." width="100%" height="360" frameborder="0"></iframe>'
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Código HTML iframe para reproductor de video por defecto.</p>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Video Players
                </button>
            </div>
        </form>
    );
}

function AlbumsSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        itunes_enabled: settings.itunes_enabled === '1',
        lastfm_enabled: settings.lastfm_enabled === '1',
        lastfm_api_key: settings.lastfm_api_key || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            group: 'albums',
            settings: {
                itunes_enabled: data.itunes_enabled ? '1' : '0',
                lastfm_enabled: data.lastfm_enabled ? '1' : '0',
                lastfm_api_key: data.lastfm_api_key,
            },
        }));
        post('/admin/settings');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950">
                <input type="checkbox" id="itunes_enabled" checked={data.itunes_enabled} onChange={e => setData('itunes_enabled', e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                />
                <label htmlFor="itunes_enabled" className="text-sm text-slate-300 font-semibold cursor-pointer">
                    Habilitar iTunes
                </label>
                <span className="text-xs text-slate-500 ml-auto">No requiere clave API — límite de 20 llamadas/min</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950">
                <input type="checkbox" id="lastfm_enabled" checked={data.lastfm_enabled} onChange={e => setData('lastfm_enabled', e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                />
                <label htmlFor="lastfm_enabled" className="text-sm text-slate-300 font-semibold cursor-pointer">
                    Habilitar Last.fm
                </label>
                <span className="text-xs text-slate-500 ml-auto">Requiere clave API de LastFM</span>
            </div>
            {data.lastfm_enabled && (
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Clave API LastFM</label>
                    <input type="text" value={data.lastfm_api_key} onChange={e => setData('lastfm_api_key', e.target.value)}
                        placeholder="Ingresa tu API Key de Last.fm"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                    />
                </div>
            )}
            <div className="pt-4">
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Albums
                </button>
            </div>
        </form>
    );
}

function PluginsSettings({ settings }: { settings: Record<string, string> }) {
    const { data, setData, post, processing, transform } = useForm({
        media_service_nginx_rtmp: settings.media_service_nginx_rtmp === '1',
        media_service_icecast: settings.media_service_icecast === '1',
        media_service_shoutcast: settings.media_service_shoutcast === '1',
        autodj_service_liquidsoap: settings.autodj_service_liquidsoap === '1',
        nginx_rtmp_image: settings.nginx_rtmp_image || 'tiangolo/nginx-rtmp:latest',
        icecast_image: settings.icecast_image || 'libretime/icecast:2.5.0',
        shoutcast_image: settings.shoutcast_image || 'khartool/shoutcast-x64:2.6.1.777-3.19.1',
        liquidsoap_image: settings.liquidsoap_image || 'savonet/liquidsoap:v2.2.5',
        
        // Nginx RTMP official settings
        nginx_rtmp_httpport: settings.nginx_rtmp_httpport || '80',
        nginx_rtmp_rtmpport: settings.nginx_rtmp_rtmpport || '1935',
        nginx_rtmp_transcoder_preset: settings.nginx_rtmp_transcoder_preset || 'ultrafast',
        nginx_rtmp_log_output: settings.nginx_rtmp_log_output || 'No',

        // Icecast 2 KH official settings
        icecast_executable: settings.icecast_executable || '/usr/bin/icecast',
        icecast_share_path: settings.icecast_share_path || '/usr/share/icecast',
        icecast_admin_user: settings.icecast_admin_user || 'admin',

        // Shoutcast 2 official settings
        shoutcast_default_version: settings.shoutcast_default_version || '2.6+',

        // Liquidsoap official settings
        liquidsoap_performance: settings.liquidsoap_performance || 'Balanced',
        liquidsoap_aac_encoder: settings.liquidsoap_aac_encoder || 'mpeg4_aac_lc',
        liquidsoap_afterburner: settings.liquidsoap_afterburner || 'enabled',
        liquidsoap_log_output: settings.liquidsoap_log_output || 'No',
        liquidsoap_dj_port: settings.liquidsoap_dj_port || '6800',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            group: 'plugins',
            settings: {
                media_service_nginx_rtmp: data.media_service_nginx_rtmp ? '1' : '0',
                media_service_icecast: data.media_service_icecast ? '1' : '0',
                media_service_shoutcast: data.media_service_shoutcast ? '1' : '0',
                autodj_service_liquidsoap: data.autodj_service_liquidsoap ? '1' : '0',
                nginx_rtmp_image: data.nginx_rtmp_image,
                icecast_image: data.icecast_image,
                shoutcast_image: data.shoutcast_image,
                liquidsoap_image: data.liquidsoap_image,
                nginx_rtmp_httpport: data.nginx_rtmp_httpport,
                nginx_rtmp_rtmpport: data.nginx_rtmp_rtmpport,
                nginx_rtmp_transcoder_preset: data.nginx_rtmp_transcoder_preset,
                nginx_rtmp_log_output: data.nginx_rtmp_log_output,
                icecast_executable: data.icecast_executable,
                icecast_share_path: data.icecast_share_path,
                icecast_admin_user: data.icecast_admin_user,
                shoutcast_default_version: data.shoutcast_default_version,
                liquidsoap_performance: data.liquidsoap_performance,
                liquidsoap_aac_encoder: data.liquidsoap_aac_encoder,
                liquidsoap_afterburner: data.liquidsoap_afterburner,
                liquidsoap_log_output: data.liquidsoap_log_output,
                liquidsoap_dj_port: data.liquidsoap_dj_port,
            },
        }));
        post('/admin/settings');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* MEDIA SERVICES SECTION */}
            <div className="space-y-6">
                <div className="border-b border-slate-900 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Media Services</h3>
                    <p className="text-xs text-slate-500 mt-1">Configuración técnica de motores de streaming de salida principal</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Nginx RTMP Settings Card */}
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="media_service_nginx_rtmp" 
                                    checked={data.media_service_nginx_rtmp} 
                                    onChange={e => setData('media_service_nginx_rtmp', e.target.checked)} 
                                    className="w-4.5 h-4.5 accent-indigo-500 rounded" 
                                />
                                <div>
                                    <label htmlFor="media_service_nginx_rtmp" className="text-sm text-slate-200 font-bold cursor-pointer">Nginx RTMP</label>
                                    <span className="block text-[10px] text-slate-500 mt-0.5">Video Streaming engine with Live Streaming capabilities.</span>
                                </div>
                            </div>
                        </div>

                        {data.media_service_nginx_rtmp && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Imagen Docker</label>
                                    <input type="text" value={data.nginx_rtmp_image} onChange={e => setData('nginx_rtmp_image', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">HTTP Stat Port</label>
                                    <input type="number" value={data.nginx_rtmp_httpport} onChange={e => setData('nginx_rtmp_httpport', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                        placeholder="80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">RTMP Port</label>
                                    <input type="number" value={data.nginx_rtmp_rtmpport} onChange={e => setData('nginx_rtmp_rtmpport', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                        placeholder="1935"
                                    />
                                    <p className="text-[9px] text-slate-500 mt-1">Puerto RTMP para ingest de video. OBS/encoders usan este puerto.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Transcoder Preset Default</label>
                                    <select value={data.nginx_rtmp_transcoder_preset} onChange={e => setData('nginx_rtmp_transcoder_preset', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        {['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'].map(preset => (
                                            <option key={preset} value={preset}>{preset}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Log TV Output</label>
                                    <select value={data.nginx_rtmp_log_output} onChange={e => setData('nginx_rtmp_log_output', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        <option value="No">No</option>
                                        <option value="SI">SI</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Icecast 2 KH Settings Card */}
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="media_service_icecast" 
                                    checked={data.media_service_icecast} 
                                    onChange={e => setData('media_service_icecast', e.target.checked)} 
                                    className="w-4.5 h-4.5 accent-indigo-500 rounded" 
                                />
                                <div>
                                    <label htmlFor="media_service_icecast" className="text-sm text-slate-200 font-bold cursor-pointer">Icecast 2 KH</label>
                                    <span className="block text-[10px] text-slate-500 mt-0.5">Audio Streaming Engine supporting MP3, AAC & OGG. Icecast 2 KH is a branch of Icecast with the latest features & functionality.</span>
                                </div>
                            </div>
                        </div>

                        {data.media_service_icecast && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Imagen Docker</label>
                                    <input type="text" value={data.icecast_image} onChange={e => setData('icecast_image', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Admin User</label>
                                    <input type="text" value={data.icecast_admin_user} onChange={e => setData('icecast_admin_user', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                        placeholder="admin"
                                    />
                                    <p className="text-[9px] text-slate-500 mt-1">Usuario administrador del panel Icecast.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Executable (Ruta)</label>
                                    <input type="text" value={data.icecast_executable} onChange={e => setData('icecast_executable', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                    />
                                    <p className="text-[9px] text-slate-500 mt-1">Ruta al binario de Icecast dentro del contenedor Docker.</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Icecast Share Path</label>
                                    <input type="text" value={data.icecast_share_path} onChange={e => setData('icecast_share_path', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                    />
                                    <p className="text-[9px] text-slate-500 mt-1">Directorio compartido de recursos y plantillas HTML de Icecast.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shoutcast 2 Settings Card */}
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="media_service_shoutcast" 
                                    checked={data.media_service_shoutcast} 
                                    onChange={e => setData('media_service_shoutcast', e.target.checked)} 
                                    className="w-4.5 h-4.5 accent-indigo-500 rounded" 
                                />
                                <div>
                                    <label htmlFor="media_service_shoutcast" className="text-sm text-slate-200 font-bold cursor-pointer">SHOUTcast 2</label>
                                    <span className="block text-[10px] text-slate-500 mt-0.5">Audio Streaming service supporting MP3 and AAC with native SSL support.</span>
                                </div>
                            </div>
                        </div>

                        {data.media_service_shoutcast && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Imagen Docker</label>
                                    <input type="text" value={data.shoutcast_image} onChange={e => setData('shoutcast_image', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Default Version for New Services</label>
                                    <select value={data.shoutcast_default_version} onChange={e => setData('shoutcast_default_version', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        <option value="2.6+">2.6+</option>
                                        <option value="2.5+">2.5+</option>
                                    </select>
                                    <p className="text-[9px] text-slate-500 mt-1">Versión de Shoutcast a usar para nuevos servicios.</p>
                                </div>
                                <div className="md:col-span-2 p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5 text-[10px] text-slate-400 select-none">
                                    <p className="font-semibold text-white">Información del Contenedor Docker:</p>
                                    <p>• <strong className="text-indigo-400">Imagen:</strong> khartool/shoutcast-x64 (Alpine Linux)</p>
                                    <p>• <strong className="text-pink-400">Puerto interno:</strong> 8000 — Puerto externo: 8005</p>
                                    <p>• <strong className="text-emerald-400">Config:</strong> /opt/shoutcast/sc_serv.conf</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AUTODJ SERVICES SECTION */}
            <div className="space-y-6">
                <div className="border-b border-slate-900 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">AutoDJ Services</h3>
                    <p className="text-xs text-slate-500 mt-1">Configuración técnica de orquestadores de listas de reproducción automatizadas</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Liquidsoap Settings Card */}
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="autodj_service_liquidsoap" 
                                    checked={data.autodj_service_liquidsoap} 
                                    onChange={e => setData('autodj_service_liquidsoap', e.target.checked)} 
                                    className="w-4.5 h-4.5 accent-indigo-500 rounded" 
                                />
                                <div>
                                    <label htmlFor="autodj_service_liquidsoap" className="text-sm text-slate-200 font-bold cursor-pointer">Liquidsoap</label>
                                    <span className="block text-[10px] text-slate-500 mt-0.5">AutoDJ - Supports mp3, aac, aac+. Multi-DJ capable. Highly Recommended.</span>
                                </div>
                            </div>
                        </div>

                        {data.autodj_service_liquidsoap && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Imagen Docker</label>
                                    <input type="text" value={data.liquidsoap_image} onChange={e => setData('liquidsoap_image', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Performance</label>
                                    <select value={data.liquidsoap_performance} onChange={e => setData('liquidsoap_performance', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        <option value="Balanced">Balanced</option>
                                        <option value="Less Memory">Less Memory</option>
                                        <option value="Less CPU">Less CPU</option>
                                        <option value="Disabled">Disabled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">AAC Encoder Type</label>
                                    <select value={data.liquidsoap_aac_encoder} onChange={e => setData('liquidsoap_aac_encoder', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        <option value="mpeg4_aac_lc">mpeg4_aac_lc</option>
                                        <option value="mpeg4_he_aac_v2">mpeg4_he_aac_v2</option>
                                        <option value="mpeg4_he_aac">mpeg4_he_aac</option>
                                    </select>
                                    <p className="text-[9px] text-slate-500 mt-1">(Advanced Users Only) Refer to FDK AAC Documentation for more information.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Afterburner</label>
                                    <select value={data.liquidsoap_afterburner} onChange={e => setData('liquidsoap_afterburner', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        <option value="enabled">enabled</option>
                                        <option value="disable">disable</option>
                                    </select>
                                    <p className="text-[9px] text-slate-500 mt-1">Afterburner increases the audio quality but also the required processing power for AAC.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Log Output</label>
                                    <select value={data.liquidsoap_log_output} onChange={e => setData('liquidsoap_log_output', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                    <p className="text-[9px] text-slate-500 mt-1">Enable or disable log file output for the liquidsoap process, useful only for debugging purposes.</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">DJ Input Start Port</label>
                                    <input type="number" value={data.liquidsoap_dj_port} onChange={e => setData('liquidsoap_dj_port', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                        placeholder="6800"
                                    />
                                    <p className="text-[9px] text-slate-500 mt-1">Puerto de entrada inicial para transmisiones de Djs remotos.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button type="submit" disabled={processing}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-650 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Save className="w-4.5 h-4.5" /> Guardar Ajustes Oficiales
                </button>
            </div>
        </form>
    );
}

function BackupsSettings({ settings }: { settings: Record<string, string> }) {
    const [backups, setBackups] = useState<Array<{ name: string; size: string; size_mb: number; created_at: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadBackups = () => {
        setLoading(true);
        fetch('/admin/api/backups', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(data => setBackups(data.backups || []))
            .catch(() => setMessage({ type: 'error', text: 'Error al cargar backups' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadBackups();
    }, []);

    const createBackup = () => {
        setCreating(true);
        setMessage(null);
        fetch('/admin/api/backups/create', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Content-Type': 'application/json',
            },
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setMessage({ type: 'success', text: data.message });
                    loadBackups();
                } else {
                    setMessage({ type: 'error', text: data.message });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al crear backup' }))
            .finally(() => setCreating(false));
    };

    const deleteBackup = (name: string) => {
        if (!confirm(`¿Eliminar el backup "${name}"?`)) return;
        setDeleting(name);
        setMessage(null);
        fetch('/admin/api/backups/delete', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setMessage({ type: 'success', text: data.message });
                    loadBackups();
                } else {
                    setMessage({ type: 'error', text: data.error || 'Error al eliminar' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al eliminar backup' }))
            .finally(() => setDeleting(null));
    };

    const downloadBackup = (name: string) => {
        window.open(`/admin/api/backups/download?name=${encodeURIComponent(name)}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Backups del Sistema</h3>
                    <p className="text-xs text-slate-500 mt-1">Crea, descarga y gestiona copias de seguridad de la base de datos y archivos.</p>
                </div>
                <button
                    onClick={createBackup}
                    disabled={creating}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                >
                    <Save className="w-3.5 h-3.5" />
                    {creating ? 'Creando...' : 'Crear Backup Ahora'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
                    message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    <span className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {message.text}
                </div>
            )}

            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Copias de Seguridad</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Se conservan las últimas 10 copias. Las más antiguas se eliminan automáticamente.</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{backups.length} backup(s)</span>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Cargando backups...</div>
                ) : backups.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Database className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm">No hay backups creados aún.</p>
                        <p className="text-[10px] mt-1 text-slate-600">Haz clic en "Crear Backup Ahora" para generar tu primera copia de seguridad.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-900">
                                    <th className="text-left py-2 text-slate-500 font-semibold uppercase tracking-wider">Archivo</th>
                                    <th className="text-left py-2 text-slate-500 font-semibold uppercase tracking-wider">Tamaño</th>
                                    <th className="text-left py-2 text-slate-500 font-semibold uppercase tracking-wider">Fecha</th>
                                    <th className="text-right py-2 text-slate-500 font-semibold uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map(backup => (
                                    <tr key={backup.name} className="border-b border-slate-900/50 hover:bg-slate-900/30 transition-colors">
                                        <td className="py-3 font-mono text-slate-300">{backup.name}</td>
                                        <td className="py-3 text-slate-400">{backup.size}</td>
                                        <td className="py-3 text-slate-400">{backup.created_at}</td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => downloadBackup(backup.name)}
                                                    className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                                                >
                                                    Descargar
                                                </button>
                                                <button
                                                    onClick={() => deleteBackup(backup.name)}
                                                    disabled={deleting === backup.name}
                                                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-500/20 disabled:opacity-50 transition-all"
                                                >
                                                    {deleting === backup.name ? '...' : 'Eliminar'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Información</h4>
                <ul className="space-y-2 text-[11px] text-slate-400">
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        Cada backup incluye: base de datos completa (PostgreSQL) + archivos de storage (uploads, estaciones).
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        Los backups se almacenan en <code className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">storage/app/backups/</code> dentro del contenedor.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        Se recomienda descargar los backups periódicamente a un lugar externo al servidor.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        Para restaurar, extrae el ZIP y vuelca el SQL en PostgreSQL, luego copia los archivos de storage.
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { activeSection, settings, sections, flash } = usePage<any>().props as PageProps;

    const renderSection = () => {
        switch (activeSection) {
            case 'general': return <GeneralSettings settings={settings} />;
            case 'services': return <ServicesSettings settings={settings} />;
            case 'email': return <EmailSettings settings={settings} />;
            case 'html': return <HtmlSettings settings={settings} />;
            case 'misc': return <MiscSettings settings={settings} />;
            case 'statistics': return <StatisticsSettings settings={settings} />;
            case 'video_players': return <VideoPlayersSettings settings={settings} />;
            case 'albums': return <AlbumsSettings settings={settings} />;
            case 'plugins': return <PluginsSettings settings={settings} />;
            case 'backups': return <BackupsSettings settings={settings} />;
            default: return <GeneralSettings settings={settings} />;
        }
    };

    return (
        <AdminLayout currentPage="settings">
            <Head title="Ajustes - Admin TuiStream" />

            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {flash.success}
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-xl">
                        <Settings className="w-5 h-5" />
                    </div>
                    Ajustes
                </h1>
                <p className="text-sm text-slate-500 mt-1">Configuración global del sistema TuiStream</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sub Sidebar */}
                <aside className="w-full lg:w-56 shrink-0">
                    <nav className="space-y-1">
                        {Object.entries(sections).map(([key, label]) => {
                            const Icon = sectionIcons[key] || Wrench;
                            const isActive = activeSection === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => router.visit(`/admin/settings/${key}`)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                                        isActive
                                            ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                                    {label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <div className="flex-1 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6">
                    <h2 className="text-base font-bold text-slate-200 mb-6">{sections[activeSection]}</h2>
                    {renderSection()}
                </div>
            </div>
        </AdminLayout>
    );
}
