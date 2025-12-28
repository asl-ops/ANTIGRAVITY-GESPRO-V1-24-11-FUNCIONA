import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Client as ClientV2, ClientCreateInput } from '@/types/client';
import { searchClients, createClient } from '@/services/clientService';
import { isMostlyNumeric, normalizeText } from '@/utils/normalize';
import { Search, X } from 'lucide-react';

type Props = {
    valueClientId?: string | null;
    valueLabel?: string; // texto mostrado (ej: snapshot actual)
    placeholder?: string;
    disabled?: boolean;

    // cuando el usuario selecciona un cliente del dropdown
    onSelect: (client: ClientV2) => void;

    // si se usa como filtro, puede interesar "limpiar selección"
    onClear?: () => void;

    // modo filtro: si quieres permitir escribir sin seleccionar
    allowFreeText?: boolean;
    onFreeTextChange?: (text: string) => void;

    // alta rápida
    enableQuickCreate?: boolean;
    defaultClientType?: 'PARTICULAR' | 'EMPRESA';
    onQuickCreate?: (created: ClientV2) => void;

    limit?: number;
};

function useDebounced<T>(value: T, ms = 250): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

export const ClientTypeahead: React.FC<Props> = ({
    valueClientId,
    valueLabel,
    placeholder = 'Buscar cliente por nombre o documento…',
    disabled,
    onSelect,
    onClear,
    allowFreeText = false,
    onFreeTextChange,
    enableQuickCreate = true,
    defaultClientType = 'PARTICULAR',
    onQuickCreate,
    limit = 10,
}) => {
    const [input, setInput] = useState(valueLabel ?? '');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<ClientV2[]>([]);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);

    // si cambia desde fuera (ej: editar expediente), sincroniza
    useEffect(() => {
        setInput(valueLabel ?? '');
    }, [valueLabel, valueClientId]);

    const debounced = useDebounced(input, 250);

    const shouldSearch = useMemo(() => {
        const q = debounced.trim();
        if (!q) return false;
        const numeric = isMostlyNumeric(q);
        if (numeric) return q.replace(/\s/g, '').length >= 3;
        return normalizeText(q).length >= 2;
    }, [debounced]);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!shouldSearch || disabled) {
                setItems([]);
                setLoading(false);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await searchClients({ q: debounced.trim(), limit });
                if (cancelled) return;
                setItems(res.items ?? []);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message ?? 'Error buscando clientes');
                setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [debounced, shouldSearch, disabled, limit]);

    // cerrar dropdown al click fuera
    useEffect(() => {
        function onDocMouseDown(ev: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(ev.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, []);

    const showQuickCreate = useMemo(() => {
        if (!enableQuickCreate) return false;
        const q = debounced.trim();
        if (!q) return false;
        if (!shouldSearch) return false;
        if (items.length > 0) return false; // si ya hay resultados, no estorbes
        return true;
    }, [enableQuickCreate, debounced, shouldSearch, items.length]);

    const handleChange = (v: string) => {
        setInput(v);
        setOpen(true);
        if (allowFreeText && onFreeTextChange) onFreeTextChange(v);
        if (!v && onClear) onClear();
    };

    const pick = (c: ClientV2) => {
        onSelect(c);
        // Label mejorado: NOMBRE — DOCUMENTO — TELÉFONO
        const parts = [c.nombre];
        if (c.documento) parts.push(c.documento);
        if (c.telefono) parts.push(c.telefono);
        setInput(parts.join(' — '));
        setOpen(false);
    };

    const quickCreate = async () => {
        const q = debounced.trim();
        if (!q) return;

        // heurística simple: si es mostly numérico lo tratamos como documento
        const numeric = isMostlyNumeric(q);
        const payload: ClientCreateInput = numeric
            ? { tipo: defaultClientType, nombre: q, documento: q }
            : { tipo: defaultClientType, nombre: q };

        setLoading(true);
        setError(null);
        try {
            const created = await createClient(payload);
            pick(created);
            onQuickCreate?.(created);
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo crear el cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    disabled={disabled}
                    value={input}
                    placeholder={placeholder}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                {(valueClientId || input) && onClear && (
                    <button
                        type="button"
                        onClick={() => {
                            setInput('');
                            onClear();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {open && (shouldSearch || showQuickCreate || loading || error) && !disabled && (
                <div className="absolute z-50 left-0 right-0 mt-1 border border-slate-200 rounded-lg bg-white shadow-lg overflow-hidden max-h-80">
                    {loading && (
                        <div className="px-4 py-3 text-sm text-slate-600">Buscando…</div>
                    )}

                    {!loading && error && (
                        <div className="px-4 py-3 text-sm text-red-600">{error}</div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <ul className="overflow-auto max-h-72">
                            {items.map((c) => (
                                <li key={c.id} className="border-b border-slate-100 last:border-b-0">
                                    <button
                                        type="button"
                                        onClick={() => pick(c)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="font-semibold text-slate-900">{c.nombre}</div>
                                        <div className="text-xs text-slate-600 mt-1">
                                            {c.documento ? `Doc: ${c.documento}` : 'Sin documento'}
                                            {c.telefono ? ` · Tel: ${c.telefono}` : ''}
                                            {c.email ? ` · ${c.email}` : ''}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!loading && !error && showQuickCreate && (
                        <div className="border-t border-slate-200">
                            <button
                                type="button"
                                onClick={quickCreate}
                                className="w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors text-sky-700 font-semibold"
                            >
                                + Crear cliente "{debounced.trim()}"
                            </button>
                            <div className="px-4 pb-3 text-xs text-slate-500">
                                Se creará con datos mínimos. Podrás completar la ficha después.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
