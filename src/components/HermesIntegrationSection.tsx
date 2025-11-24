
import React from 'react';
import { LinkIcon } from './icons';

interface HermesIntegrationSectionProps {
  onOpen: () => void;
}

const HermesIntegrationSection: React.FC<HermesIntegrationSectionProps> = ({ onOpen }) => {
  return (
    <div 
      className="bg-white p-6 rounded-xl shadow-md cursor-pointer group hover:bg-sky-50 transition-colors"
      onClick={onOpen}
      title="Abrir configuración de envío HERMES"
    >
      <div className="flex items-center">
        <LinkIcon />
        <h2 className="text-xl font-bold text-slate-900 ml-3 group-hover:text-sky-600 transition-colors">Integración HERMES (DGT)</h2>
      </div>
      <p className="text-sm text-slate-600 mt-2 ml-10">
        Configura, genera y simula el envío del fichero XML a la DGT.
      </p>
    </div>
  );
};

export default HermesIntegrationSection;