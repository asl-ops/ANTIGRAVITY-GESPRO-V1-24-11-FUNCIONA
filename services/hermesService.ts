
import { Client, Vehicle, HermesResponse } from '../types';

// Helper to simulate network latency
const mockApiCall = (delay = 2000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

interface MatriculacionPayload {
  client: Client;
  vehicle: Vehicle;
  fileNumber: string;
}

interface InformePayload {
  vin: string;
  fileNumber: string;
}


export const iniciarMatriculacion = async (payload: MatriculacionPayload): Promise<HermesResponse> => {
  await mockApiCall();
  const { client, vehicle, fileNumber } = payload;
  
  if (!client.nif || !(client.surnames || client.firstName)) {
    return {
      success: false,
      message: "Error: Faltan datos del cliente (Identificador, Nombre)."
    };
  }

  if (!vehicle.vin || !vehicle.brand) {
    return {
      success: false,
      message: "Error: Faltan datos del vehículo (VIN, Marca)."
    };
  }

  return {
    success: true,
    message: `Matriculación para expediente ${fileNumber} enviada.`,
    transactionId: `TRN-${Date.now()}`
  };
};

export const iniciarTransferencia = async (payload: MatriculacionPayload): Promise<HermesResponse> => {
  await mockApiCall(2500); // Slightly longer for transfer
  const { client, vehicle, fileNumber } = payload;
  
  if (!client.nif || !(client.surnames || client.firstName)) {
    return {
      success: false,
      message: "Error: Faltan datos del cliente (Identificador, Nombre)."
    };
  }

  if (!vehicle.vin) {
    return {
      success: false,
      message: "Error: El Nº de Bastidor (VIN) es requerido para la transferencia."
    };
  }
  
  return {
    success: true,
    message: `Transferencia para expediente ${fileNumber} aceptada.`,
    transactionId: `TRN-${Date.now()}`
  };
};

export const solicitarInformeDGT = async (payload: InformePayload): Promise<HermesResponse> => {
  await mockApiCall(1500); // Shorter for report request
  const { vin } = payload;

  if (!vin) {
    return {
      success: false,
      message: "Error: Se requiere el Nº de Bastidor (VIN) para solicitar un informe."
    };
  }

  return {
    success: true,
    message: `Informe para el vehículo con VIN ${vin} solicitado con éxito.`,
    reportUrl: `https://sede.dgt.gob.es/fake-report/${vin}`
  };
};
