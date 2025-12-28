// Script de debugging para Firebase Storage
// Ejecutar esto en la consola del navegador para diagnosticar problemas

console.log('=== Firebase Storage Debug ===');

// 1. Verificar que Firebase está inicializado
import { auth, storage, db } from './services/firebase';

console.log('✓ Firebase importado correctamente');
console.log('Auth:', auth);
console.log('Storage:', storage);
console.log('DB:', db);

// 2. Verificar autenticación
console.log('\n--- Estado de Autenticación ---');
console.log('Usuario actual:', auth.currentUser);
if (auth.currentUser) {
    console.log('✓ Usuario autenticado:', auth.currentUser.uid);
} else {
    console.log('✗ No hay usuario autenticado');
}

// 3. Verificar bucket de Storage
console.log('\n--- Configuración de Storage ---');
console.log('Storage bucket:', storage.app.options.storageBucket);

// 4. Intentar una operación simple de storage
import { ref, uploadBytes } from 'firebase/storage';

const testUpload = async () => {
    try {
        console.log('\n--- Test de Subida ---');
        const testFile = new Blob(['test content'], { type: 'text/plain' });
        const testRef = ref(storage, 'test/test.txt');
        console.log('Intentando subir archivo de prueba...');
        await uploadBytes(testRef, testFile);
        console.log('✓ Subida exitosa!');
    } catch (error) {
        console.error('✗ Error en la subida:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
    }
};

// Ejecutar test
await testUpload();
