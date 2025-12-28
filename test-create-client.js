// Script para crear un cliente de prueba directamente en Firestore
// Ejecutar desde consola del navegador en http://localhost:5173

import { createClient } from './src/services/clientService';

async function createTestClient() {
    try {
        const client = await createClient({
            tipo: 'PARTICULAR',
            nombre: 'PRUEBA QA UNO',
            documento: '26201234X',
            telefono: '600123456',
            email: 'prueba@test.com'
        });
        console.log('✅ Cliente creado:', client);
        return client;
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createTestClient();
