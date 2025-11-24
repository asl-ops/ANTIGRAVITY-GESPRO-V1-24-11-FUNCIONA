
import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { XMarkIcon } from './icons';

interface SavedClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelect: (client: Client) => void;
}

const SavedClientsModal: React.FC<SavedClientsModalProps> = ({ isOpen, onClose, clients, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };
  
  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName} ${client.surnames}`.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    return fullName.includes(searchTermLower) || client.nif.toLowerCase().includes(searchTermLower);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">Seleccionar Cliente Guardado</h3>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-800">
            <XMarkIcon />
          </button>
        </div>

        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o Identificador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-80">
          <ul className="divide-y divide-slate-200">
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <li
                  key={client.id}
                  onClick={() => onSelect(client)}
                  className="p-4 hover:bg-slate-100 cursor-pointer transition-colors duration-150 rounded-lg"
                >
                  <p className="font-semibold text-slate-800">{client.surnames}{client.firstName ? `, ${client.firstName}` : ''}</p>
                  <p className="text-sm text-slate-600">{client.nif}</p>
                  <p className="text-sm text-slate-500">{[client.address, client.city, client.province].filter(Boolean).join(', ')}</p>
                </li>
              ))
            ) : (
              <p className="text-center text-slate-500 p-4">
                {clients.length === 0 
                    ? 'No hay clientes guardados.' 
                    : 'No se encontraron clientes con ese criterio.'
                }
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SavedClientsModal;