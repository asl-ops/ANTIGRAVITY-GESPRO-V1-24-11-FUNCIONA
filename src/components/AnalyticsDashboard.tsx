import React, { useMemo } from 'react';
import { CaseRecord } from '@/types';
import {
    calculateCaseStats,
    calculateRevenueStats,
    getTopClients,
    formatCurrency,
    calculatePercentageChange
} from '@/services/analyticsService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock, Users } from 'lucide-react';

interface AnalyticsDashboardProps {
    cases: CaseRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const StatsCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, change, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-600 font-medium">{title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
                {change !== undefined && (
                    <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        <span>{Math.abs(change)}% vs mes anterior</span>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-full ${color}`}>
                {icon}
            </div>
        </div>
    </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ cases }) => {
    const stats = useMemo(() => calculateCaseStats(cases), [cases]);
    const revenue = useMemo(() => calculateRevenueStats(cases), [cases]);
    const topClients = useMemo(() => getTopClients(cases, 5), [cases]);

    // Prepare data for charts
    const statusData = useMemo(() =>
        Object.entries(stats.byStatus).map(([name, value]) => ({ name, value })),
        [stats.byStatus]
    );

    const prefixData = useMemo(() =>
        Object.entries(stats.byPrefix).map(([name, value]) => ({ name, value })),
        [stats.byPrefix]
    );

    const revenueByPrefixData = useMemo(() =>
        Object.entries(revenue.byPrefix).map(([name, value]) => ({
            name,
            value: Math.round(value)
        })),
        [revenue.byPrefix]
    );

    const caseChange = calculatePercentageChange(stats.thisMonth, stats.lastMonth);
    const revenueChange = calculatePercentageChange(revenue.thisMonth, revenue.lastMonth);

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Analytics</h1>
                    <p className="text-slate-600 mt-2">Análisis y métricas de expedientes</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Total Expedientes"
                        value={stats.total}
                        change={caseChange}
                        icon={<FileText className="w-6 h-6 text-white" />}
                        color="bg-blue-500"
                    />
                    <StatsCard
                        title="Ingresos Totales"
                        value={formatCurrency(revenue.total)}
                        change={revenueChange}
                        icon={<DollarSign className="w-6 h-6 text-white" />}
                        color="bg-emerald-500"
                    />
                    <StatsCard
                        title="Tiempo Promedio"
                        value={`${stats.avgProcessingTime} días`}
                        icon={<Clock className="w-6 h-6 text-white" />}
                        color="bg-amber-500"
                    />
                    <StatsCard
                        title="Este Mes"
                        value={stats.thisMonth}
                        icon={<TrendingUp className="w-6 h-6 text-white" />}
                        color="bg-indigo-500"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Cases by Status */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Expedientes por Estado</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Cases by Prefix */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Expedientes por Prefijo</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={prefixData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#0088FE" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue and Top Clients Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Prefix */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Ingresos por Prefijo</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueByPrefixData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Bar dataKey="value" fill="#00C49F" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Clients */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            Top 5 Clientes
                        </h3>
                        <div className="space-y-4">
                            {topClients.map((client, index) => (
                                <div key={client.clientId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold mr-3">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{client.clientName}</p>
                                            <p className="text-sm text-slate-600">{client.caseCount} expedientes</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-emerald-600">{formatCurrency(client.totalRevenue)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
