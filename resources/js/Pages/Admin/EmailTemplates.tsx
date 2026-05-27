import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Mail, Plus, Save, Trash2, Eye, Send, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';
import AdminLayout from './Layout';

interface TemplateItem {
    id: number;
    name: string;
    subject: string;
    body: string;
    type: 'audio' | 'video' | 'generic';
    is_active: boolean;
    created_at: string;
}

interface StationItem {
    id: number;
    name: string;
    type: string;
    client_name: string;
    client_email: string;
    port: number;
    stream_key: string;
    frontend: string;
    slug: string;
}

interface PageProps {
    templates: TemplateItem[];
    stations: StationItem[];
    defaultVariables: string[];
    flash: {
        success?: string;
        error?: string;
    };
}

export default function EmailTemplates() {
    const { templates, stations, defaultVariables, flash } = usePage<any>().props as PageProps;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState({ subject: '', body: '' });
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [sendingTemplateId, setSendingTemplateId] = useState<number | null>(null);
    const [selectedStationId, setSelectedStationId] = useState<number | ''>('');
    const [sendEmail, setSendEmail] = useState('');

    const { data, setData, post, processing, reset } = useForm({
        name: '',
        subject: '',
        body: '',
        type: 'generic' as 'audio' | 'video' | 'generic',
        variables: [] as string[],
    });

    const handleCreate = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/email-templates', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const handleUpdate = (e: FormEvent, id: number) => {
        e.preventDefault();
        router.put(`/admin/email-templates/${id}`, {
            name: data.name,
            subject: data.subject,
            body: data.body,
            type: data.type,
            variables: data.variables,
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingId(null);
                reset();
            },
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Eliminar la plantilla "${name}"?`)) {
            router.delete(`/admin/email-templates/${id}`);
        }
    };

    const openEdit = (template: TemplateItem) => {
        setEditingId(template.id);
        setData({
            name: template.name,
            subject: template.subject,
            body: template.body,
            type: template.type as any,
            variables: [],
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingId(null);
        reset();
        setIsModalOpen(true);
    };

    const handlePreview = async (template: TemplateItem) => {
        const res = await fetch(`/admin/email-templates/${template.id}/preview`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        const json = await res.json();
        setPreviewContent(json);
        setPreviewOpen(true);
    };

    const openSend = (templateId: number) => {
        setSendingTemplateId(templateId);
        setSelectedStationId('');
        setSendEmail('');
        setSendModalOpen(true);
    };

    const handleSend = (e: FormEvent) => {
        e.preventDefault();
        if (!sendingTemplateId || !selectedStationId || !sendEmail) return;
        router.post(`/admin/email-templates/${sendingTemplateId}/send`, {
            station_id: selectedStationId,
            to_email: sendEmail,
        }, {
            onSuccess: () => {
                setSendModalOpen(false);
                setSendingTemplateId(null);
            },
        });
    };

    const insertVariable = (variable: string) => {
        setData('body', data.body + `{{${variable}}}`);
    };

    return (
        <AdminLayout currentPage="email-templates">
            <Head title="Plantillas de Email - Admin TuiStream" />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {flash.error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                            <Mail className="w-5 h-5" />
                        </div>
                        Plantillas de Email
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Gestionar plantillas para enviar credenciales de streaming</p>
                </div>
                <button
                    onClick={openCreate}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" /> Nueva Plantilla
                </button>
            </div>

            {/* Variables Helper */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-4 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Variables disponibles</p>
                <div className="flex flex-wrap gap-2">
                    {defaultVariables.map((v) => (
                        <button
                            key={v}
                            onClick={() => insertVariable(v)}
                            className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-slate-950 border border-slate-800 text-indigo-400 rounded-lg hover:border-indigo-500/30 transition-all"
                            title="Insertar en editor"
                        >
                            {'{{' + v + '}}'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Templates Table */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                {templates.length === 0 ? (
                    <div className="text-center py-16">
                        <Mail className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold text-base">No hay plantillas registradas</p>
                        <p className="text-xs text-slate-500 mt-1">Crea tu primera plantilla para enviar credenciales a clientes.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">Plantilla</th>
                                    <th className="p-4">Asunto</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {templates.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-900/30 transition-all text-sm">
                                        <td className="p-4">
                                            <p className="font-bold text-slate-200">{t.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{t.created_at}</p>
                                        </td>
                                        <td className="p-4 text-slate-300 text-xs max-w-xs truncate">{t.subject}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                t.type === 'audio'
                                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                    : t.type === 'video'
                                                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                                        : 'bg-slate-950 text-slate-500 border border-slate-900'
                                            }`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                t.is_active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-slate-950 text-slate-500 border border-slate-900'
                                            }`}>
                                                {t.is_active ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handlePreview(t)}
                                                    className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 rounded-lg transition-all"
                                                    title="Previsualizar"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => openSend(t.id)}
                                                    className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 rounded-lg transition-all"
                                                    title="Enviar a cliente"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(t)}
                                                    className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/20 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id, t.name)}
                                                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
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

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={editingId ? (e) => handleUpdate(e, editingId) : handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nombre</label>
                                    <input type="text" required value={data.name} onChange={e => setData('name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tipo</label>
                                    <select value={data.type} onChange={e => setData('type', e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                                    >
                                        <option value="generic">Genérica</option>
                                        <option value="audio">Audio</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Asunto</label>
                                <input type="text" required value={data.subject} onChange={e => setData('subject', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Cuerpo (usa las variables de arriba)
                                </label>
                                <textarea required value={data.body} onChange={e => setData('body', e.target.value)}
                                    rows={10}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200 font-mono"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing}
                                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Vista Previa</h3>
                            <button onClick={() => setPreviewOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Asunto</label>
                                <p className="text-sm text-slate-200 mt-1 p-3 bg-slate-950 border border-slate-800 rounded-xl">{previewContent.subject}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Cuerpo</label>
                                <div className="text-sm text-slate-200 mt-1 p-3 bg-slate-950 border border-slate-800 rounded-xl whitespace-pre-wrap font-mono">{previewContent.body}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Modal */}
            {sendModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Enviar Credenciales</h3>
                            <button onClick={() => setSendModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Estación</label>
                                <select required value={selectedStationId} onChange={e => {
                                    const id = parseInt(e.target.value);
                                    setSelectedStationId(id);
                                    const station = stations.find((s: StationItem) => s.id === id);
                                    if (station) setSendEmail(station.client_email);
                                }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                                >
                                    <option value="">Seleccionar estación...</option>
                                    {stations.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.client_name})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Correo destino</label>
                                <input type="email" required value={sendEmail} onChange={e => setSendEmail(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-200"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setSendModalOpen(false)}
                                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit"
                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    <Send className="w-4 h-4" /> Enviar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
