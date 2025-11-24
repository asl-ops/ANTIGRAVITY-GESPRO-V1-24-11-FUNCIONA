

import React from 'react';
import { XMarkIcon, ClipboardIcon } from './icons';

interface RemoteAccessInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

const RemoteAccessInfo: React.FC<RemoteAccessInfoProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const localIp = window.location.hostname;
  const port = window.location.port || '80';
  const remoteUrl = `http://${localIp}:${port}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar: ', err);
        alert('No se pudo copiar');
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Conectar desde otro equipo</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button>
        </div>
        
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Paso 1: Iniciar el Servidor en Modo Red</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Para que otros dispositivos puedan acceder a la aplicación, necesitas iniciar el servidor de desarrollo con un parámetro especial. Cierra el servidor actual (con <code className="bg-slate-200 px-1 rounded">Ctrl+C</code> en la terminal) y ejecútalo con el siguiente comando:
                </p>
                <div className="relative bg-slate-800 text-white p-3 rounded-lg font-mono text-sm">
                    <code>npm run dev -- --host</code>
                    <button onClick={() => handleCopy('npm run dev -- --host')} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white" title="Copiar comando">
                        <ClipboardIcon />
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Paso 2: Acceder desde el otro equipo</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Una vez que el servidor esté corriendo en modo red, abre el navegador en tu otro ordenador o dispositivo y escribe la siguiente dirección. Asegúrate de que ambos equipos estén conectados a la <strong className="font-semibold">misma red Wi-Fi o local</strong>.
                </p>
                 <div className="relative bg-slate-100 p-3 rounded-lg font-mono text-sm text-slate-900">
                    <code>{remoteUrl}</code>
                     <button onClick={() => handleCopy(remoteUrl)} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-sky-600" title="Copiar dirección">
                        <ClipboardIcon />
                    </button>
                </div>
            </div>

            <div className="border-t pt-4">
                <p className="text-xs text-slate-500">
                    <strong>Nota:</strong> Si la dirección no funciona, puede que necesites buscar la dirección IP "IPv4" de tu ordenador en la configuración de red de tu sistema operativo.
                </p>
            </div>

            <div className="flex justify-end pt-2">
                <button 
                    onClick={onClose}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Entendido
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteAccessInfo;