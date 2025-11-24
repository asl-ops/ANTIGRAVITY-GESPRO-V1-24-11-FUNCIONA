import React from 'react';
import { Client, FileConfig, User } from '../types';

interface PrintableMandatoProps {
  client: Client;
  fileConfig: FileConfig;
  asunto: string;
  mandatoBody: string;
  users: User[];
  currentUser: User;
}

const PrintableMandato: React.FC<PrintableMandatoProps> = ({ client, fileConfig, asunto, mandatoBody, users, currentUser }) => {
    
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('es-ES', { month: 'long' });
    const year = today.getFullYear();

    const fullName = [client.firstName, client.surnames].filter(Boolean).join(' ');
    const fullAddress = [client.address, client.city, client.postalCode, client.province].filter(Boolean).join(', ');
    const gestor = users.find(u => u.id === fileConfig.responsibleUserId) || currentUser;

    const replacements: Record<string, string> = {
        '{{CLIENT_FULL_NAME}}': fullName || '_________________________',
        '{{CLIENT_NIF}}': client.nif || '_________________________',
        '{{CLIENT_ADDRESS}}': fullAddress || '_________________________',
        '{{ASUNTO}}': asunto.split('\n').filter(line => line.trim() !== '').map(line => `<p class="asunto-line">• ${line}</p>`).join(''),
        '{{GESTOR_NAME}}': gestor.name,
        // Add more gestor details if needed, e.g., from a more detailed User type
        '{{GESTOR_DNI}}': '27524375E', // Placeholder, should be in User type
        '{{GESTOR_COLEGIADO_NUM}}': '421', // Placeholder
        '{{GESTOR_COLEGIO}}': 'GRANADA, JAÉN Y ALMERÍA', // Placeholder
        '{{GESTOR_DESPACHO}}': 'ALMERIA GESTORIA ARCOS SLU', // Placeholder
        '{{GESTOR_DESPACHO_DIRECCION}}': 'ALMERIA, calle PUERTA PURCHENA n° 2 C.P. 04003', // Placeholder
        '{{CURRENT_CITY}}': 'ALMERIA',
        '{{CURRENT_DAY}}': String(day),
        '{{CURRENT_MONTH}}': month,
        '{{CURRENT_YEAR}}': String(year),
    };

    const processedBody = Object.entries(replacements).reduce((body, [key, value]) => {
        // Use a global regex to replace all occurrences
        return body.replace(new RegExp(key, 'g'), value);
    }, mandatoBody);

    return (
        <div className="mandato-page bg-white text-black font-serif">
            <header className="flex items-stretch mb-8" style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}>
                <div className="w-1/3 flex justify-center items-center p-2">
                    <div className="relative h-24 w-24">
                        <span style={{ fontFamily: 'serif', fontSize: '5rem', color: '#374151', position: 'absolute', top: '-1rem', left: '0' }}>g</span>
                        <span style={{ fontFamily: 'serif', fontSize: '1.75rem', color: '#6b7280', position: 'absolute', top: '0.25rem', left: '0.75rem' }}>O'A</span>
                        <div style={{
                            position: 'absolute',
                            width: '3rem',
                            height: '0.75rem',
                            backgroundColor: '#a12336',
                            bottom: '2.2rem',
                            left: '0.5rem',
                            clipPath: 'polygon(0% 50%, 10% 0%, 90% 20%, 100% 70%, 90% 100%, 10% 90%)',
                            transform: 'rotate(-5deg)'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            width: '2rem',
                            height: '1.25rem',
                            borderBottom: '6px solid #374151',
                            borderRadius: '0 0 50% 50%',
                            bottom: '0.5rem',
                            left: '1.25rem'
                        }}></div>
                    </div>
                </div>
                <div className="w-1/3 text-white text-center font-sans font-bold text-xs leading-tight p-2 flex flex-col justify-center" style={{ backgroundColor: '#a12336' }}>
                    <p>CONSEJO GENERAL</p>
                    <p>DE COLEGIOS DE</p>
                    <p>GESTORES</p>
                    <p>ADMINISTRATIVOS</p>
                    <p>DE ESPAÑA</p>
                </div>
                <div className="w-1/3 flex justify-center items-center p-2">
                    <svg width="80" height="85" viewBox="0 0 80 90" fill="none" stroke="#374151" strokeWidth="1">
                        <path d="M10 20 L20 10 L30 20 L40 5 L50 20 L60 10 L70 20 M10 20 L40 28 L70 20" strokeWidth="1.5" />
                        <path d="M10,28 C10,60 40,85 40,85 C40,85 70,60 70,28 Z" strokeWidth="1.5" />
                        <path d="M40,28 L40,85 M10,50 L70,50" />
                        <path d="M20,35 L60,75 M60,35 L20,75" strokeDasharray="2 2" />
                        <path d="M20 70 A 20 20 0 0 0 60 70" />
                        <circle cx="40" cy="45" r="8" />
                    </svg>
                </div>
            </header>
            
            <main className="space-y-3 print-justify" dangerouslySetInnerHTML={{ __html: processedBody.replace(/\n/g, '<br />') }} />

            <footer className="mt-4 space-y-4">
                 <div>
                    <p className="text-center">
                        En ALMERIA a {day} de {month} de {year}
                    </p>
                    <div style={{ height: '160px' }} />
                    <p className="text-center">EL MANDANTE</p>
                </div>
                
                 <div>
                    <p className="text-center">
                        En ALMERIA a {day} de {month} de {year}
                    </p>
                    <div className="h-12" />
                    <p className="text-center">LA MANDATARIA</p>
                </div>
            </footer>
        </div>
    );
};

export default PrintableMandato;