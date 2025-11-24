

import React, { useState } from 'react';
import { Task, User, AttachedDocument, FileConfig, Client } from '../types';
import { ClipboardListIcon, PlusCircleIcon, TrashIcon } from './icons';

interface TasksSectionProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  currentUser: User;
  caseResponsibleUserId: string;
  attachments?: AttachedDocument[];
  fileConfig?: FileConfig;
  client?: Client;
}

const UserAvatar: React.FC<{ userId: string; users: User[] }> = ({ userId, users }) => {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  return (
    <span
      title={user.name}
      className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-bold ${user.avatarColor}`}
    >
      {user.initials}
    </span>
  );
};

const TasksSection: React.FC<TasksSectionProps> = ({ tasks, setTasks, users, currentUser, caseResponsibleUserId }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [assignedTo, setAssignedTo] = useState(caseResponsibleUserId);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      isCompleted: false,
      assignedToUserId: assignedTo,
      createdByUserId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
    setAssignedTo(caseResponsibleUserId); // Reset to default responsible
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };
  
  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  const getCreationInfo = (task: Task) => {
      const creator = users.find(u => u.id === task.createdByUserId);
      const date = new Date(task.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      return `Creada por ${creator?.initials || '??'} el ${date}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center mb-6">
        <ClipboardListIcon />
        <h2 className="text-xl font-bold text-slate-900 ml-3">Tareas y Anotaciones</h2>
      </div>

      <div className="space-y-4">
        {/* Input for new task */}
        <div className="flex items-start space-x-2">
            <textarea
                rows={2}
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                placeholder="Añadir nueva tarea o anotación..."
                className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
            <button
                onClick={handleAddTask}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold p-2 rounded-lg h-full flex items-center"
                aria-label="Añadir Tarea"
            >
                <PlusCircleIcon />
            </button>
        </div>
        <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Asignar a:</label>
            <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="bg-white border border-slate-300 rounded-md py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            >
                {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
        </div>
      </div>
        
      <div className="mt-6 border-t border-slate-200 pt-4 space-y-3">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className={`flex items-start space-x-3 p-2 rounded-md transition-colors ${task.isCompleted ? 'bg-slate-100' : ''}`}>
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => handleToggleTask(task.id)}
                className="mt-1 h-5 w-5 rounded border-slate-400 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <div className="flex-grow">
                <p className={`text-sm text-slate-800 ${task.isCompleted ? 'line-through text-slate-500' : ''}`}>
                  {task.text}
                </p>
                <p className="text-xs text-slate-500 mt-1">{getCreationInfo(task)}</p>
              </div>
              <UserAvatar userId={task.assignedToUserId} users={users} />
              <button onClick={() => handleRemoveTask(task.id)} className="text-slate-400 hover:text-red-500">
                <TrashIcon />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500 text-sm py-4">No hay tareas pendientes.</p>
        )}
      </div>
    </div>
  );
};

export default TasksSection;
