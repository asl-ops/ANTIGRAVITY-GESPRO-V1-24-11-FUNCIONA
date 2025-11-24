import { EconomicLineItem, TemplateEconomicLineItem } from '@/types';

/**
 * Convert template economic line to full EconomicLineItem with required fields
 */
export const templateToEconomicLine = (
    templateLine: TemplateEconomicLineItem,
    conceptId: string = `concept_${Date.now()}_${Math.random()}`,
    type: 'suplido' | 'honorario' = 'honorario'
): EconomicLineItem => {
    return {
        id: `line_${Date.now()}_${Math.random()}`,
        conceptId,
        concept: templateLine.concept,
        type,
        amount: templateLine.amount
    };
};

/**
 * Create a new economic line item with all required fields
 */
export const createEconomicLine = (
    concept: string,
    amount: number,
    type: 'suplido' | 'honorario' = 'honorario',
    conceptId?: string
): EconomicLineItem => {
    return {
        id: `line_${Date.now()}_${Math.random()}`,
        conceptId: conceptId || `concept_${Date.now()}_${Math.random()}`,
        concept,
        type,
        amount
    };
};
