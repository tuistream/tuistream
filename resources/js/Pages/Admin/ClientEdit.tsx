import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    User, Mail, Lock, Save, ArrowLeft, Users,
    Phone, AtSign, ShieldCheck, UserCog, ToggleLeft
} from 'lucide-react';
import AdminLayout from './Layout';

interface ClientData {
    id: number;
    username: string;
    name: string;
    phone: string;
    email: string;
    role: 'client' | 'admin';
    status: 'active' | 'disabled';
    api_access: 'active' | 'disabled';
}

interface PageProps {
    client: ClientData;
}

type FormField = {
    username: string;
    name: string;
    phone: string;
    email: string;
    password: string;
    status: 'active' | 'disabled';
    api_access: 'active' | 'disabled';
    role: 'client' | 'admin';
};

const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all';

const selectClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none';

const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5';

const errorClass = 'text-[10px] text-red-400 mt-1';

export default function ClientEdit() {
    const { client } = usePage<any>().props as PageProps;

    const { data, setData, post, processing, errors } = useForm<FormField>({
        username: client.username || '',
        name: client.name,
        phone: client.phone || '',
        email: client.email,
        password: '',
        status: client.status || 'active',
        api_access: client.api_access || 'disabled',
        role: client.role || 'client',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/clients/${client.id}/edit`);
    };

    return (
        <AdminLayout currentPage="clients">
            <Head title="Editar Cliente - Admin TuiStream" />

            <div className="mb-6">
                <Link
                    href={`/admin/clients/${client.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a los detalles del cliente
                </Link>
            </div>

            <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Editar Cliente: {client.name}</h1>
                        <p className="text-sm text-slate-500 mt-1">Actualizar los datos del cliente o su contraseña</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Section: Información de acceso */}
                        <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <AtSign className="w-3 h-3" /> Información de Acceso
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Nombre de usuario</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            placeholder="ej. juanperez"
                                            className={inputClass}
                                        />
                                        <AtSign className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600" />
                                    </div>
                                    {errors.username && <p className={errorClass}>{errors.username}</p>}
                                </div>

                                <div>
                                    <label className={labelClass}>Nueva contraseña</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Dejar en blanco para mantener la actual"
                                            className={inputClass}
                                        />
                                        <Lock className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600" />
                                    </div>
                                    {errors.password && <p className={errorClass}>{errors.password}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section: Datos personales */}
                        <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Datos Personales
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Nombre completo <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            className={inputClass}
                                            required
                                        />
                                        <User className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600" />
                                    </div>
                                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Correo electrónico <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="correo@ejemplo.com"
                                                className={inputClass}
                                                required
                                            />
                                            <Mail className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600" />
                                        </div>
                                        {errors.email && <p className={errorClass}>{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className={labelClass}>Número de teléfono</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="+1 (555) 000-0000"
                                                className={inputClass}
                                            />
                                            <Phone className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600" />
                                        </div>
                                        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Configuración de cuenta */}
                        <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <UserCog className="w-3 h-3" /> Configuración de Cuenta
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Estado */}
                                <div>
                                    <label className={labelClass}>Estado <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value as 'active' | 'disabled')}
                                            className={selectClass}
                                        >
                                            <option value="active">Activo</option>
                                            <option value="disabled">Desactivado</option>
                                        </select>
                                        <ToggleLeft className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                                    </div>
                                    {errors.status && <p className={errorClass}>{errors.status}</p>}
                                </div>

                                {/* Acceso API */}
                                <div>
                                    <label className={labelClass}>Acceso a API <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={data.api_access}
                                            onChange={(e) => setData('api_access', e.target.value as 'active' | 'disabled')}
                                            className={selectClass}
                                        >
                                            <option value="disabled">Desactivado</option>
                                            <option value="active">Activo</option>
                                        </select>
                                        <ShieldCheck className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                                    </div>
                                    {errors.api_access && <p className={errorClass}>{errors.api_access}</p>}
                                </div>

                                {/* Tipo de cuenta */}
                                <div>
                                    <label className={labelClass}>Tipo de cuenta <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value as 'client' | 'admin')}
                                            className={selectClass}
                                        >
                                            <option value="client">Cliente</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                        <Users className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                                    </div>
                                    {errors.role && <p className={errorClass}>{errors.role}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Password note */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start gap-2.5">
                            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-slate-300">Seguridad de la Cuenta</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                    Si ingresa una nueva contraseña, la anterior dejará de ser válida inmediatamente.
                                    Deje el campo vacío para mantener la contraseña actual.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                            >
                                <Save className="w-4 h-4" /> Guardar Cambios
                            </button>
                            <Link
                                href={`/admin/clients/${client.id}`}
                                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
