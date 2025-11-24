import { TemplateEconomicLineItem, EconomicTemplates } from '../types';

const createLine = (concept: string, amount: number = 0, included: boolean = true): TemplateEconomicLineItem => ({
    concept,
    amount,
    included,
});

export const INITIAL_ECONOMIC_TEMPLATES: EconomicTemplates = {
    'Matriculación Nacional': [
        createLine('Honorarios Profesionales', 150),
        createLine('Tasas DGT', 99.77),
        createLine('Impuesto de Matriculación', 0, false),
        createLine('Placas de Matrícula', 20),
        createLine('Suplidos Colegio Gestores', 15),
    ],
    'Transferencia': [
        createLine('Honorarios Profesionales', 120),
        createLine('Tasas DGT', 55.70),
        createLine('Impuesto de Transmisiones', 0, false),
        createLine('Suplidos Colegio Gestores', 15),
    ],
    'Informe DGT': [
        createLine('Honorarios Profesionales', 25),
        createLine('Tasas DGT', 8.67),
    ],
    'Duplicado Permiso': [
        createLine('Honorarios Profesionales', 50),
        createLine('Tasas DGT', 20.81),
    ],
    'Baja Definitiva': [
        createLine('Honorarios Profesionales', 60),
        createLine('Tasas DGT', 0), // Often free, can be adjusted
    ],
    'Matriculación Múltiple (mismo titular)': [
        createLine('Honorarios Profesionales', 150),
        createLine('Tasas DGT', 99.77),
        createLine('Impuesto de Matriculación', 0, false),
        createLine('Placas de Matrícula', 20),
        createLine('Suplidos Colegio Gestores', 15),
    ],
    'Importación UE': [
        createLine('Honorarios Profesionales', 250),
        createLine('Tasas DGT', 99.77),
        createLine('Impuesto de Matriculación', 0, false),
        createLine('Ficha Reducida / COC'),
        createLine('Suplidos Colegio Gestores', 15),
    ],
};
