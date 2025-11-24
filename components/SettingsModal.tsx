
import React, { useState, useEffect } from 'react';
import { Client, EconomicTemplates, AppSettings } from '../types';
import { XMarkIcon, PlusCircleIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'numeracion' | 'clientes' | 'rutas' | 'plantillas' | 'mandato';

const PLACEHOLDERS = ['{{CLIENT_FULL_NAME}}', '{{CLIENT_NIF}}', '{{CLIENT_ADDRESS}}', '{{ASUNTO}}', '{{GESTOR_NAME}}', '{{GESTOR_DNI}}', '{{GESTOR_COLEGIADO_NUM}}', '{{GESTOR_COLEGIO}}', '{{GESTOR_DESPACHO}}', '{{GESTOR_DESPACHO_DIRECCION}}', '{{CURRENT_CITY}}', '{{CURRENT_DAY}}', '{{CURRENT_MONTH}}', '{{CURRENT_YEAR}}'];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { appSettings, savedClients, economicTemplates, updateSettings, saveClient, deleteClient, updateEconomicTemplates } = useAppContext();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('numeracion');
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(appSettings);
  const [clientSearchNif, setClientSearchNif] = useState('');
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [clientEditData, setClientEditData] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [localTemplates, setLocalTemplates] = useState<EconomicTemplates>({});
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
        setLocalSettings(appSettings);
        setLocalTemplates(JSON.parse(JSON.stringify(economicTemplates)));
        if (Object.keys(economicTemplates).length > 0) setSelectedTemplateKey(Object.keys(economicTemplates)[0]);
        setClientSearchNif(''); setFoundClient(null); setClientEditData(null); setClientToDelete(null);
    }
  }, [isOpen, appSettings, economicTemplates]);

  if (!isOpen || !localSettings) return null;

  const handleSettingsSave = () => { if (localSettings) updateSettings(localSettings); };
  const handleClientSearch = () => {
    const client = savedClients.find(c => c.nif.toLowerCase() === clientSearchNif.toLowerCase());
    setFoundClient(client || null); setClientEditData(client || null);
    if (!client) addToast('No se encontró ningún cliente con ese NIF.', 'warning');
  };
  const handleClientUpdate = () => { if(clientEditData) { saveClient(clientEditData); setFoundClient(null); } };
  const handleConfirmDelete = () => { if (clientToDelete) { deleteClient(clientToDelete.id); setFoundClient(null); setClientSearchNif(''); setClientToDelete(null); }};

  const handleTemplateLineChange = (index: number, field: 'concept' | 'amount', value: string | number) => {
    const updated = { ...localTemplates };
    updated[selectedTemplateKey][index] = { ...updated[selectedTemplateKey][index], [field]: value };
    setLocalTemplates(updated); updateEconomicTemplates(updated);
  };
  const handleTemplateLineToggle = (index: number) => {
    const updated = { ...localTemplates };
    updated[selectedTemplateKey][index].included = !updated[selectedTemplateKey][index].included;
    setLocalTemplates(updated); updateEconomicTemplates(updated);
  };
  const handleAddTemplateLine = () => {
    const updated = { ...localTemplates, [selectedTemplateKey]: [...localTemplates[selectedTemplateKey], { concept: '', amount: 0, included: true }]};
    setLocalTemplates(updated); updateEconomicTemplates(updated);
  };

  const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
    <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === tabName ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{label}</button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-slate-800">Configuración</h2><button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button></div>
        <div className="p-6">
            <div className="flex space-x-2 mb-6 border-b pb-4 overflow-x-auto"><TabButton tabName="numeracion" label="Numeración" /><TabButton tabName="rutas" label="Rutas" /><TabButton tabName="clientes" label="Clientes" /><TabButton tabName="plantillas" label="Plantillas" /><TabButton tabName="mandato" label="Mandato" /></div>
            {activeTab === 'numeracion' && <div><h3 className="text-lg font-semibold mb-2">Numeración de Expedientes</h3><p className="text-sm text-slate-600 mb-4">Establece el número para el próximo expediente.</p><div className="flex items-center space-x-2"><span className="font-mono">GEMAT-</span><input type="number" value={localSettings.fileCounter} onChange={e => setLocalSettings(prev => prev ? ({ ...prev, fileCounter: Number(e.target.value) }) : null)} className="w-32 px-3 py-2 border rounded-md" /><button onClick={handleSettingsSave} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button></div></div>}
            {activeTab === 'rutas' && <div><h3 className="text-lg font-semibold mb-2">Rutas de Guardado</h3><p className="text-sm text-slate-600 mb-4">Define la carpeta principal para documentos y ficheros.</p><div className="flex items-center space-x-2"><input type="text" value={localSettings.generalSavePath} onChange={e => setLocalSettings(prev => prev ? ({...prev, generalSavePath: e.target.value}) : null)} className="w-full px-3 py-2 border rounded-md" placeholder="Ej: C:\\GESTORIA\\EXPEDIENTES\\" /><button onClick={handleSettingsSave} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button></div></div>}
            {activeTab === 'mandato' && <div><h3 className="text-lg font-semibold mb-2">Plantilla del Mandato</h3><p className="text-sm text-slate-600 mb-4">Edita el texto base del mandato. Usa placeholders para datos dinámicos.</p><textarea rows={12} value={localSettings.mandatoBody} onChange={e => setLocalSettings(prev => prev ? ({...prev, mandatoBody: e.target.value}) : null)} className="w-full font-mono text-xs p-2 border rounded-md" /><div className="text-xs text-slate-500 mt-2"><p className="font-semibold">Placeholders:</p><div className="flex flex-wrap gap-x-2">{PLACEHOLDERS.map(p => <code key={p} className="bg-slate-100 px-1 rounded">{p}</code>)}</div></div><button onClick={handleSettingsSave} className="mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Plantilla</button></div>}
            {activeTab === 'clientes' && <div><h3 className="text-lg font-semibold mb-2">Gestión de Clientes</h3><div className="flex gap-2 mb-4"><input type="text" value={clientSearchNif} onChange={e => setClientSearchNif(e.target.value)} placeholder="Buscar por NIF/CIF..." className="flex-grow px-3 py-2 border rounded-md" /><button onClick={handleClientSearch} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg">Buscar</button></div>{foundClient && clientEditData && <div className="bg-slate-50 p-4 rounded-lg space-y-3"><h4 className="font-semibold">{foundClient.surnames}, {foundClient.firstName}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input type="text" value={clientEditData.surnames} onChange={e => setClientEditData({...clientEditData, surnames: e.target.value})} placeholder="Apellidos" className="w-full px-2 py-1 border rounded" /><input type="text" value={clientEditData.firstName} onChange={e => setClientEditData({...clientEditData, firstName: e.target.value})} placeholder="Nombre" className="w-full px-2 py-1 border rounded" /><input type="text" value={clientEditData.nif} onChange={e => setClientEditData({...clientEditData, nif: e.target.value})} placeholder="NIF" className="w-full px-2 py-1 border rounded" /><input type="text" value={clientEditData.address} onChange={e => setClientEditData({...clientEditData, address: e.target.value})} placeholder="Dirección" className="w-full px-2 py-1 border rounded md:col-span-2" /><input type="text" value={clientEditData.city} onChange={e => setClientEditData({...clientEditData, city: e.target.value})} placeholder="Localidad" className="w-full px-2 py-1 border rounded" /><input type="text" value={clientEditData.province} onChange={e => setClientEditData({...clientEditData, province: e.target.value})} placeholder="Provincia" className="w-full px-2 py-1 border rounded" /><input type="text" value={clientEditData.postalCode} onChange={e => setClientEditData({...clientEditData, postalCode: e.target.value})} placeholder="Cód. Postal" className="w-full px-2 py-1 border rounded" /><input type="text" value={clientEditData.phone} onChange={e => setClientEditData({...clientEditData, phone: e.target.value})} placeholder="Teléfono" className="w-full px-2 py-1 border rounded" /><input type="email" value={clientEditData.email} onChange={e => setClientEditData({...clientEditData, email: e.target.value})} placeholder="Email" className="w-full px-2 py-1 border rounded md:col-span-2" /></div><div className="flex gap-2 justify-end pt-2"><button onClick={() => setClientToDelete(foundClient)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-sm">Eliminar</button><button onClick={handleClientUpdate} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1 px-3 rounded-lg text-sm">Guardar</button></div></div>}</div>}
            {activeTab === 'plantillas' && <div><h3 className="text-lg font-semibold mb-2">Editor de Plantillas Económicas</h3><p className="text-sm text-slate-600 mb-4">Ajusta los conceptos e importes por tipo de expediente.</p><div className="mb-4"><label htmlFor="template-select" className="block text-sm font-medium text-slate-700 mb-1">Selecciona plantilla:</label><select id="template-select" value={selectedTemplateKey} onChange={e => setSelectedTemplateKey(e.target.value)} className="w-full px-3 py-2 border rounded-md">{Object.keys(localTemplates).map(key => (<option key={key} value={key}>{key}</option>))}</select></div><div className="space-y-2 max-h-60 overflow-y-auto pr-2">{localTemplates[selectedTemplateKey]?.map((line, index) => (<div key={index} className="grid grid-cols-12 gap-2 items-center"><div className="col-span-1 flex items-center justify-center"><input type="checkbox" checked={line.included} onChange={() => handleTemplateLineToggle(index)} className="h-5 w-5 rounded border-slate-400 text-sky-600 focus:ring-sky-500" title={line.included ? 'Activado' : 'Desactivado'}/></div><div className="col-span-6"><input type="text" placeholder="Concepto" value={line.concept} onChange={e => handleTemplateLineChange(index, 'concept', e.target.value)} className={`w-full px-2 py-1 border rounded-md ${!line.included && 'opacity-60 bg-slate-50'}`} /></div><div className="col-span-5"><input type="number" placeholder="Importe" value={line.amount || ''} onChange={e => handleTemplateLineChange(index, 'amount', parseFloat(e.target.value) || 0)} className={`w-full px-2 py-1 border rounded-md ${!line.included && 'opacity-60 bg-slate-50'}`} /></div></div>))}</div><button onClick={handleAddTemplateLine} className="mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm"><PlusCircleIcon/><span className="ml-2">Añadir Línea</span></button></div>}
        </div>
      </div>
        {clientToDelete && <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={(e) => { e.stopPropagation(); setClientToDelete(null); }}><div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-start space-x-4"><div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-100 text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div><div><h3 className="text-lg font-semibold text-slate-900">Confirmar Eliminación</h3><p className="text-sm text-slate-600 mt-2">¿Seguro que quieres eliminar a <strong className="text-slate-800">{clientToDelete.surnames}{clientToDelete.firstName && `, ${clientToDelete.firstName}`}</strong>?</p><p className="text-sm text-red-600 mt-1 font-semibold">Esta acción no se puede deshacer.</p></div></div><div className="flex justify-end space-x-3 mt-6"><button onClick={() => setClientToDelete(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancelar</button><button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Eliminar</button></div></div></div>}
    </div>
  );
};

export default SettingsModal;
