import { CaseRecord, CaseStats, RevenueStats, TopClient } from '@/types';

/**
 * Calculate comprehensive case statistics
 */
export const calculateCaseStats = (cases: CaseRecord[]): CaseStats => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const stats: CaseStats = {
        total: cases.length,
        byStatus: {},
        byPrefix: {},
        thisMonth: 0,
        lastMonth: 0,
        avgProcessingTime: 0
    };

    let totalProcessingDays = 0;
    let completedCases = 0;

    cases.forEach(caseRecord => {
        // Count by status
        stats.byStatus[caseRecord.status] = (stats.byStatus[caseRecord.status] || 0) + 1;

        // Count by prefix (or category if no prefix)
        const prefix = caseRecord.prefixId || caseRecord.fileConfig.category;
        stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + 1;

        // Count this month
        const createdDate = new Date(caseRecord.createdAt);
        if (createdDate >= thisMonthStart) {
            stats.thisMonth++;
        }

        // Count last month
        if (createdDate >= lastMonthStart && createdDate <= lastMonthEnd) {
            stats.lastMonth++;
        }

        // Calculate processing time for completed cases
        if (caseRecord.status.toLowerCase().includes('completado') ||
            caseRecord.status.toLowerCase().includes('finalizado')) {
            const created = new Date(caseRecord.createdAt);
            const updated = new Date(caseRecord.updatedAt);
            const days = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            totalProcessingDays += days;
            completedCases++;
        }
    });

    // Calculate average processing time
    if (completedCases > 0) {
        stats.avgProcessingTime = Math.round(totalProcessingDays / completedCases);
    }

    return stats;
};

/**
 * Calculate revenue statistics
 */
export const calculateRevenueStats = (cases: CaseRecord[]): RevenueStats => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const stats: RevenueStats = {
        total: 0,
        byPrefix: {},
        thisMonth: 0,
        lastMonth: 0
    };

    cases.forEach(caseRecord => {
        const revenue = caseRecord.economicData.totalAmount || 0;
        const prefix = caseRecord.prefixId || caseRecord.fileConfig.category;
        const createdDate = new Date(caseRecord.createdAt);

        // Total revenue
        stats.total += revenue;

        // Revenue by prefix
        stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + revenue;

        // This month revenue
        if (createdDate >= thisMonthStart) {
            stats.thisMonth += revenue;
        }

        // Last month revenue
        if (createdDate >= lastMonthStart && createdDate <= lastMonthEnd) {
            stats.lastMonth += revenue;
        }
    });

    return stats;
};

/**
 * Get top clients by case count and revenue
 */
export const getTopClients = (cases: CaseRecord[], limit: number = 5): TopClient[] => {
    const clientMap = new Map<string, TopClient>();

    cases.forEach(caseRecord => {
        const clientId = caseRecord.client.id;
        const clientName = `${caseRecord.client.firstName} ${caseRecord.client.surnames}`.trim();
        const revenue = caseRecord.economicData.totalAmount || 0;

        if (clientMap.has(clientId)) {
            const existing = clientMap.get(clientId)!;
            existing.caseCount++;
            existing.totalRevenue += revenue;
        } else {
            clientMap.set(clientId, {
                clientId,
                clientName,
                caseCount: 1,
                totalRevenue: revenue
            });
        }
    });

    // Convert to array and sort by case count
    return Array.from(clientMap.values())
        .sort((a, b) => b.caseCount - a.caseCount)
        .slice(0, limit);
};

/**
 * Get cases created in date range
 */
export const getCasesInDateRange = (
    cases: CaseRecord[],
    startDate: Date,
    endDate: Date
): CaseRecord[] => {
    return cases.filter(caseRecord => {
        const createdDate = new Date(caseRecord.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
    });
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};
