import { useEffect, useRef, useState, useCallback } from 'react';
import { saveDraft, deleteDraft } from '@/services/draftService';
import { CaseRecord } from '@/types';
import { useToast } from './useToast';

interface UseAutoSaveOptions {
    fileNumber: string;
    userId: string;
    data: Partial<CaseRecord>;
    enabled?: boolean;
    interval?: number; // milliseconds
    onSave?: () => void;
    onError?: (error: Error) => void;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const useAutoSave = ({
    fileNumber,
    userId,
    data,
    enabled = true,
    interval = 30000, // 30 seconds
    onSave,
    onError
}: UseAutoSaveOptions) => {
    const [status, setStatus] = useState<AutoSaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const previousDataRef = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { addToast } = useToast();

    // Deep comparison using JSON stringify
    const hasChanges = useCallback(() => {
        const currentData = JSON.stringify(data);
        return currentData !== previousDataRef.current;
    }, [data]);

    // Save draft function
    const save = useCallback(async (autoSaved: boolean = true) => {
        if (!enabled || !fileNumber || !userId) return;

        try {
            setStatus('saving');
            await saveDraft(fileNumber, userId, data, autoSaved);

            previousDataRef.current = JSON.stringify(data);
            setLastSaved(new Date());
            setStatus('saved');

            if (onSave) onSave();

            // Reset to idle after 2 seconds
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Auto-save error:', error);
            setStatus('error');
            if (onError) onError(error as Error);

            if (!autoSaved) {
                addToast('Error al guardar borrador', 'error');
            }
        }
    }, [enabled, fileNumber, userId, data, onSave, onError, addToast]);

    // Manual save
    const saveNow = useCallback(() => {
        save(false);
    }, [save]);

    // Clear draft
    const clearDraft = useCallback(async () => {
        try {
            await deleteDraft(fileNumber, userId);
            previousDataRef.current = '';
            setLastSaved(null);
            setStatus('idle');
            addToast('Borrador eliminado', 'success');
        } catch (error) {
            console.error('Error clearing draft:', error);
            addToast('Error al eliminar borrador', 'error');
        }
    }, [fileNumber, userId, addToast]);

    // Auto-save effect
    useEffect(() => {
        if (!enabled) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set up new timeout
        timeoutRef.current = setTimeout(() => {
            if (hasChanges()) {
                save(true);
            }
        }, interval);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [enabled, interval, hasChanges, save]);

    // Save on unmount if there are changes
    useEffect(() => {
        return () => {
            if (hasChanges() && enabled) {
                // Fire and forget - don't wait for promise
                saveDraft(fileNumber, userId, data, true).catch(console.error);
            }
        };
    }, []); // Empty deps - only on unmount

    return {
        status,
        lastSaved,
        saveNow,
        clearDraft,
        hasUnsavedChanges: hasChanges()
    };
};
