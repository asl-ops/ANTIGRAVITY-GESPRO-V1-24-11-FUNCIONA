import { EconomicTemplates } from '@/types';

export const INITIAL_ECONOMIC_TEMPLATES: EconomicTemplates = {
    'GE-MAT': [
        { concept: 'Honorarios Gestoría', amount: 150.00, included: true },
        { concept: 'Tasa DGT Matriculación', amount: 99.77, included: true },
        { concept: 'Impuesto Matriculación (Modelo 576)', amount: 0.00, included: true },
        { concept: 'Impuesto Circulación (IVTM)', amount: 0.00, included: true },
        { concept: 'Placas de Matrícula', amount: 30.00, included: true },
        { concept: 'Envío Documentación', amount: 10.00, included: false },
    ],
    'FI-TRI': [
        { concept: 'Honorarios Trimestrales', amount: 90.00, included: true },
        { concept: 'Suplidos Software', amount: 15.00, included: true },
    ],
    'FI-CONTA': [
        { concept: 'Honorarios Contabilidad Mensual', amount: 250.00, included: true },
        { concept: 'Legalización Libros', amount: 50.00, included: false },
        { concept: 'Depósito Cuentas Anuales', amount: 100.00, included: false },
    ]
};