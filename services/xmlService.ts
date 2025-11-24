import { CaseRecord, Client, Vehicle } from '../types';

export const generateHermesXml = (client: Client, vehicle: Vehicle, fileNumber: string): string => {
  const now = new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  
  const splitSurnames = (surnames: string): { first: string; second: string } => {
    if (!surnames) return { first: '', second: '' };
    const parts = surnames.trim().split(/\s+/);
    return {
      first: parts.shift() || '',
      second: parts.join(' ')
    };
  };

  const { first: firstSurname, second: secondSurname } = splitSurnames(client.surnames);

  // NOTE: Many fields are placeholders as they are not available in the current app's data model.
  // This demonstrates the structure and where real data would be injected.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HermesEnvio xmlns="http://www.dgt.es/hermes/v1" version="1.0">
  <Encabezado>
    <Remitente>
      <NIF>B12345678</NIF>
      <RazonSocial>Gestoría Arcos, S.L.</RazonSocial>
      <CodigoColaborador>GA001234</CodigoColaborador>
    </Remitente>
    <FechaHora>${now}</FechaHora>
    <NumeroLote>${new Date().toISOString().slice(0, 10)}-0001</NumeroLote>
  </Encabezado>

  <Expedientes>
    <Expediente id="${fileNumber}" tipoTramite="MAT" subtipo="ORDINARIA" oficinaDGT="SE">
      <Solicitante>
        <PersonaFisica>
          <NIF>${client.nif || ''}</NIF>
          <Nombre>${client.firstName || ''}</Nombre>
          <PrimerApellido>${firstSurname || client.surnames}</PrimerApellido>
          <SegundoApellido>${secondSurname}</SegundoApellido>
          <Domicilio>
            <Via>${client.address || ''}</Via>
            <Numero></Numero>
            <Piso></Piso>
            <Municipio>${client.city || ''}</Municipio>
            <Provincia>${client.province || ''}</Provincia>
            <CP></CP>
          </Domicilio>
          <Contacto>
            <Email>${client.email || ''}</Email>
            <Telefono>${client.phone || ''}</Telefono>
          </Contacto>
        </PersonaFisica>
      </Solicitante>

      <Vehiculo>
        <Bastidor>${vehicle.vin || ''}</Bastidor>
        <IdentificadorEITV>NIVE-ES-0000-0000-0000</IdentificadorEITV>
        <Marca>${vehicle.brand || ''}</Marca>
        <Modelo>${vehicle.model || ''}</Modelo>
        <Variante></Variante>
        <Version></Version>
        <Tipo>Turismo</Tipo>
        <Combustible>${vehicle.fuelType || ''}</Combustible>
        <PotenciaKW></PotenciaKW>
        <Plazas>5</Plazas>
        <MMA></MMA>
        <Color></Color>
        <Procedencia>NACIONAL</Procedencia>
        <FechaMatriculacion>${vehicle.year || ''}</FechaMatriculacion>
      </Vehiculo>

      <Documentacion>
        <Documento tipo="FACTURA" nombre="factura.pdf">
          <ContenidoBase64>...</ContenidoBase64>
        </Documento>
        <Documento tipo="IDENTIDAD_TITULAR" nombre="dni.jpg">
          <ContenidoBase64>...</ContenidoBase64>
        </Documento>
      </Documentacion>

      <Tasas>
        <Tasa codigo="1.1">
          <Importe>99.77</Importe>
          <NRC>00000000000000000000</NRC>
        </Tasa>
      </Tasas>

      <Consentimientos>
        <TratamientoDatosTitular>SI</TratamientoDatosTitular>
        <NotificacionElectronica>SI</NotificacionElectronica>
      </Consentimientos>

      <Observaciones>
        Matriculación ordinaria para expediente ${fileNumber}.
      </Observaciones>
    </Expediente>
  </Expedientes>
</HermesEnvio>`;

  return xml;
};

// Based on Hermes import specifications
const HERMES_HEADERS = [
    // Titular
    "NIF", "Nombre", "Primer Apellido", "Segundo Apellido", "Razón Social",
    "Domicilio", "Municipio", "Provincia", "Código Postal",
    // Vehículo - Identificación
    "Bastidor", "Marca (D.1)", "Modelo", "Tipo", "Variante", "Versión", "Fabricante (A.1)",
    // Vehículo - Clasificación
    "Servicio", "Carrocería (J.1)", "Categoría EU (J)", "Código ITV",
    // Vehículo - Importación
    "Importado", "País de primera matriculación", "Subasta",
    // Vehículo - Datos Técnicos
    "Cilindrada (P.1)", "Potencia (kW) (P.2)", "Tipo de combustible (P.3)",
    "Emisiones de CO2 (V.7)", "Nivel de emisiones Euro (V.9)", "MMA O MTMA (F.1)",
    "Masa en orden de marcha (F.2)", "Número de plazas (S.1)",
    "Número de ejes", "Distancia entre ejes (M.1)",
    "Vía anterior (F.7)", "Vía posterior (F.7.1)",
    "Consumo eléctrico Wh/km", "Fecha de caducidad de ITV",
];

const escapeCsvField = (field: any): string => {
    const str = String(field ?? '');
    if (/[";,\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const splitSurnamesForCsv = (surnames: string): { first: string; second: string } => {
    if (!surnames) return { first: '', second: '' };
    const parts = surnames.trim().split(/\s+/);
    return {
        first: parts.shift() || '',
        second: parts.join(' ')
    };
};

export const generateHermesFileContent = (cases: CaseRecord[]): string => {
    const rows = cases.map(caseRecord => {
        const { client, vehicle } = caseRecord;
        const { first: firstSurname, second: secondSurname } = splitSurnamesForCsv(client.surnames);

        const dataRow = {
            "NIF": client.nif,
            "Nombre": client.firstName,
            "Primer Apellido": firstSurname,
            "Segundo Apellido": secondSurname,
            "Razón Social": client.firstName ? '' : client.surnames,
            "Domicilio": client.address,
            "Municipio": client.city,
            "Provincia": client.province,
            "Código Postal": client.postalCode,
            "Bastidor": vehicle.vin,
            "Marca (D.1)": vehicle.brand,
            "Modelo": vehicle.model,
            "Tipo": '', "Variante": '', "Versión": '', "Fabricante (A.1)": '',
            "Servicio": '', "Carrocería (J.1)": '', "Categoría EU (J)": '', "Código ITV": '',
            "Importado": '', "País de primera matriculación": '', "Subasta": '',
            "Cilindrada (P.1)": vehicle.engineSize,
            "Potencia (kW) (P.2)": '',
            "Tipo de combustible (P.3)": vehicle.fuelType,
            "Emisiones de CO2 (V.7)": '', "Nivel de emisiones Euro (V.9)": '',
            "MMA O MTMA (F.1)": '', "Masa en orden de marcha (F.2)": '', "Número de plazas (S.1)": '',
            "Número de ejes": '', "Distancia entre ejes (M.1)": '',
            "Vía anterior (F.7)": '', "Vía posterior (F.7.1)": '',
            "Consumo eléctrico Wh/km": '', "Fecha de caducidad de ITV": '',
        };
        
        return HERMES_HEADERS.map(header => dataRow[header as keyof typeof dataRow]);
    });

    const csvContent = [
        HERMES_HEADERS.join(';'),
        ...rows.map(row => row.map(escapeCsvField).join(';'))
    ].join('\n');

    return '\uFEFF' + csvContent; // Add BOM for Excel UTF-8 compatibility
};
