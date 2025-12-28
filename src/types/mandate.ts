export interface MandateData {
    mandante: {
        nombre: string;
        dni: string;
        representante?: {
            nombre: string;
            dni: string;
        };
        empresa?: string; // En representación de
        cif?: string;
        domicilio: {
            poblacion: string;
            calle: string;
            numero: string;
            cp: string;
        };
    };
    mandatario: {
        nombre_1: string;
        dni_1: string;
        col_1: string;
        nombre_2?: string;
        dni_2?: string;
        col_2?: string;
        colegio: string;
        despacho: string;
        domicilio: {
            poblacion: string;
            calle: string;
            numero: string;
            cp: string;
        };
    };
    asunto: {
        linea_1: string;
        linea_2?: string;
    };
    firma: {
        lugar: string;
        fecha: Date;
    };
}

// Configuración del mandatario que se guardará en AppSettings
export interface MandatarioConfig {
    nombre_1: string;
    dni_1: string;
    col_1: string;
    nombre_2?: string;
    dni_2?: string;
    col_2?: string;
    colegio: string;
    despacho: string;
    domicilio: {
        poblacion: string;
        calle: string;
        numero: string;
        cp: string;
    };
}
