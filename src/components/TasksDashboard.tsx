
import React, { useState, useMemo } from 'react';
import { User, CaseRecord, Task } from '../types';
import { ClipboardListIcon, ArrowLeftIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';

interface AggregatedTask {
  task: Task;
  parentCase: CaseRecord;
}

const UserAvatar: React.FC<{ userId: string; users: User[] }> = ({ userId, users }) => {
  const user = users.find(u => u.id === userId);
  if (!user) return <div className="h-6 w-6 rounded-full bg-slate-300" title="Usuario desconocido"></div>;
  return (
    <span title={user.name} className={`flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full text-white text-sm font-bold ${user.avatarColor}`}>{user.initials}</span>
  );
};

interface TasksDashboardProps {
    onUpdateTaskStatus: (fileNumber: string, taskId: string, isCompleted: boolean) => void;
    onGoToCase: (caseRecord: CaseRecord) => void;
    onReturnToDashboard: () => void;
}

const TasksDashboard: React.FC<TasksDashboardProps> = ({ onUpdateTaskStatus, onGoToCase, onReturnToDashboard }) => {
    const { caseHistory, users } = useAppContext();
    const [filterByUserId, setFilterByUserId] = useState<string>('all');
    
    const pendingTasks: AggregatedTask[] = useMemo(() => {
        const allPendingTasks: AggregatedTask[] = caseHistory.flatMap(c => 
            c.tasks?.filter(t => !t.isCompleted).map(t => ({ task: t, parentCase: c })) || []
        );
        
        const filtered = filterByUserId === 'all'
            ? allPendingTasks
            : allPendingTasks.filter(item => item.task.assignedToUserId === filterByUserId);

        return filtered.sort((a, b) => new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime());

    }, [caseHistory, filterByUserId]);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex items-center gap-4">
                    <button onClick={onReturnToDashboard} className="p-2 text-slate-600 hover:text-sky-600" title="Volver"><ArrowLeftIcon /></button>
                    <div className="text-sky-600"><ClipboardListIcon /></div>
                    <div>
                       <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tareas Pendientes</h1>
                       <p className="text-slate-600 mt-1">Todas las tareas activas de todos los expedientes.</p>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-md">
                     <div className="p-4 sm:p-6 border-b flex justify-between items-center gap-4">
                        <div className="flex items-baseline space-x-2"><h2 className="text-lg font-semibold">Tareas Pendientes</h2><span className="font-bold text-sky-600">{pendingTasks.length}</span></div>
                        <div className="flex items-center gap-2"><label htmlFor="user-filter" className="text-sm font-medium">Filtrar:</label><select id="user-filter" value={filterByUserId} onChange={(e) => setFilterByUserId(e.target.value)} className="bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-8 text-sm"><option value="all">Todos</option>{users.map(user => (<option key={user.id} value={user.id}>{user.name}</option>))}</select></div>
                    </div>

                    <div className="p-6 bg-slate-50 space-y-4">
                       {pendingTasks.length > 0 ? (
                            pendingTasks.map(({ task, parentCase }) => (
                                <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border flex items-start gap-4">
                                    <input type="checkbox" checked={task.isCompleted} onChange={(e) => onUpdateTaskStatus(parentCase.fileNumber, task.id, e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-400 text-sky-600 focus:ring-sky-500 cursor-pointer flex-shrink-0" />
                                    <div className="flex-grow"><p>{task.text}</p><div className="text-xs text-slate-500 mt-2 flex items-center gap-4"><span><strong>Exp:</strong> {parentCase.fileNumber} ({parentCase.client.surnames})</span><span><strong>Creada:</strong> {new Date(task.createdAt).toLocaleDateString('es-ES')}</span></div></div>
                                    <div className="flex flex-col items-center gap-2"><UserAvatar userId={task.assignedToUserId} users={users} /><button onClick={() => onGoToCase(parentCase)} className="text-xs bg-slate-200 hover:bg-slate-300 font-semibold py-1 px-2 rounded-md">Ir al Exp.</button></div>
                                </div>
                            ))
                       ) : (
                           <div className="text-center py-12 text-slate-500"><h3 className="text-xl font-semibold">¡Todo al día!</h3><p className="mt-2">No hay tareas pendientes con el filtro seleccionado.</p></div>
                       )}
                    </div>
                </div>
                 <footer className="text-center mt-12 text-slate-500 text-sm"><p>&copy; {new Date().getFullYear()} Gestor de Expedientes Pro.</p></footer>
            </div>
        </div>
    );
};

export default TasksDashboard;
