// src/components/CashFlowSummaryView.js
import React from 'react';
import { PieChart, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const CashFlowSummaryView = ({
    cashFlowSummaryData,
    isLoadingSummary,
    selectedMonth,
    setSelectedMonth,
}) => {
    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    const formatMonthDisplay = (monthYear) => {
        if (!monthYear) return "Pilih Bulan";
        const [year, month] = monthYear.split('-');
        if (isNaN(new Date(year, parseInt(month, 10) - 1))) return "Tanggal Tidak Valid";
        const date = new Date(year, parseInt(month, 10) - 1);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    };

    if (isLoadingSummary) {
        return (
            <div className="flex items-center justify-center mt-10 p-6">
                <Loader2 className="animate-spin h-10 w-10 text-sky-500" />
                <p className="ml-3 text-lg text-gray-600">Memuat Arus Kas...</p>
            </div>
        );
    }

    if (!cashFlowSummaryData || !cashFlowSummaryData.overallSummary) {
        return (
            <div className="p-6 bg-white border border-gray-200 shadow-xl rounded-lg text-center">
                <PieChart size={48} className="mx-auto mb-4 text-sky-500"/>
                <h2 className="text-2xl font-semibold text-sky-600 mb-3">Ringkasan Total RAB Bulanan</h2>
                <label htmlFor="month-filter-placeholder" className="text-sm text-gray-600 mr-2">Filter Bulan:</label>
                <select
                    id="month-filter-placeholder"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="p-2 my-2 rounded bg-gray-50 text-gray-700 border border-gray-300 focus:ring-sky-500 focus:border-sky-500 min-w-[180px]"
                >
                    <option value={selectedMonth || ""}>{formatMonthDisplay(selectedMonth) || "Memuat Bulan..."}</option>
                    {(cashFlowSummaryData?.availableMonths || []).map(month => (
                        <option key={month} value={month}>
                            {formatMonthDisplay(month)}
                        </option>
                    ))}
                </select>
                <p className="text-gray-500 mt-2">
                    {selectedMonth ? `Tidak ada data ringkasan untuk ${formatMonthDisplay(selectedMonth)}.` : "Silakan pilih bulan."}
                </p>
            </div>
        );
    }

    const {
        overallSummary,
        projectMonthlySummaries = [],
        availableMonths = [],
        selectedMonth: processedMonth
    } = cashFlowSummaryData;

    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-3xl font-semibold text-sky-600 mb-3 sm:mb-0 flex items-center">
                        <PieChart size={30} className="mr-3" />Ringkasan Total RAB Bulanan
                    </h2>
                    <div>
                        <label htmlFor="month-filter" className="text-sm text-gray-600 mr-2">Filter Bulan:</label>
                        <select
                            id="month-filter"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className="p-2 rounded bg-gray-50 text-gray-700 border border-gray-300 focus:ring-sky-500 focus:border-sky-500 min-w-[180px]"
                        >
                            {availableMonths.length === 0 && selectedMonth ? (
                                <option value={selectedMonth}>{formatMonthDisplay(selectedMonth)} (Tidak ada data)</option>
                            ) : null}
                            {availableMonths.map(month => (
                                <option key={month} value={month}>
                                    {formatMonthDisplay(month)}
                                </option>
                            ))}
                            {!availableMonths.includes(selectedMonth) && availableMonths.length > 0 && selectedMonth && (
                                 <option value={selectedMonth} disabled hidden>{formatMonthDisplay(selectedMonth)} (Tidak ada data)</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-green-50 border border-green-200 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg text-green-700 font-semibold mb-1">Total Harga Proyek ({formatMonthDisplay(processedMonth)})</h3>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(overallSummary.totalOverallIncome)}</p>
                    </div>
                    <div className="p-6 bg-red-50 border border-red-200 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg text-red-700 font-semibold mb-1">Total Estimasi Biaya ({formatMonthDisplay(processedMonth)})</h3>
                        <p className="text-3xl font-bold text-red-600">{formatCurrency(overallSummary.totalOverallExpenses)}</p>
                    </div>
                    <div className="p-6 bg-sky-50 border border-sky-200 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg text-sky-700 font-semibold mb-1">Estimasi Keuntungan ({formatMonthDisplay(processedMonth)})</h3>
                        <p className={`text-3xl font-bold ${overallSummary.totalOverallNetCashFlow >= 0 ? 'text-sky-600' : 'text-orange-600'}`}>
                            {formatCurrency(overallSummary.totalOverallNetCashFlow)}
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-semibold text-sky-700 mb-4">Arus Kas dari Proyek ({formatMonthDisplay(processedMonth)})</h3>
                {projectMonthlySummaries.length > 0 ? (
                    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                        <table className="w-full min-w-max text-left text-gray-700">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-4">Nama Proyek</th>
                                    <th className="p-4 text-right">Total Harga Per-Proyek</th>
                                    <th className="p-4 text-right">Total Estimasi Per-Proyek</th>
                                    <th className="p-4 text-right">Total Keuntungan Per-Proyek</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectMonthlySummaries
                                .sort((a, b) => a.project_name.localeCompare(b.project_name))
                                .map(projSummary => (
                                    <tr key={projSummary.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-gray-800 font-medium">{projSummary.project_name}</td>
                                        <td className="p-4 text-right text-green-600">{formatCurrency(projSummary.monthly_income)}</td>
                                        <td className="p-4 text-right text-red-600">{formatCurrency(projSummary.monthly_expenses)}</td>
                                        <td className={`p-4 text-right font-semibold ${projSummary.monthly_net_cash_flow >= 0 ? 'text-sky-600' : 'text-orange-600'}`}>
                                            {formatCurrency(projSummary.monthly_net_cash_flow)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-3">Tidak ada aktivitas arus kas yang tercatat untuk proyek apa pun di {formatMonthDisplay(processedMonth)}.</p>
                )}
            </div>
        </div>
    );
};

export default CashFlowSummaryView;