// Helper function to get status color classes
export const getStatusColorClasses = (status: string): string => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('pendiente documentación') || statusLower.includes('pendiente documentacion')) {
        return 'border-l-4 border-yellow-500 bg-yellow-50 hover:bg-yellow-100';
    }
    if (statusLower.includes('pendiente pago')) {
        return 'border-l-4 border-orange-500 bg-orange-50 hover:bg-orange-100';
    }
    if (statusLower.includes('tramitación') || statusLower.includes('tramitacion') || statusLower.includes('proceso')) {
        return 'border-l-4 border-blue-500 bg-blue-50 hover:bg-blue-100';
    }
    if (statusLower.includes('finalizado') || statusLower.includes('completado')) {
        return 'border-l-4 border-green-500 bg-green-50 hover:bg-green-100';
    }
    if (statusLower.includes('archivado') || statusLower.includes('cerrado')) {
        return 'border-l-4 border-gray-400 bg-gray-50 hover:bg-gray-100';
    }

    // Default
    return 'border-l-4 border-slate-300 hover:bg-slate-50';
};

// Helper function for list view row background
export const getStatusRowColorClasses = (status: string): string => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('pendiente documentación') || statusLower.includes('pendiente documentacion')) {
        return 'bg-yellow-50 hover:bg-yellow-100';
    }
    if (statusLower.includes('pendiente pago')) {
        return 'bg-orange-50 hover:bg-orange-100';
    }
    if (statusLower.includes('tramitación') || statusLower.includes('tramitacion') || statusLower.includes('proceso')) {
        return 'bg-blue-50 hover:bg-blue-100';
    }
    if (statusLower.includes('finalizado') || statusLower.includes('completado')) {
        return 'bg-green-50 hover:bg-green-100';
    }
    if (statusLower.includes('archivado') || statusLower.includes('cerrado')) {
        return 'bg-gray-50 hover:bg-gray-100';
    }

    // Default
    return 'hover:bg-slate-50';
};
