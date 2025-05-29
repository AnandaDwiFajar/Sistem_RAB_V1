// src/components/CashFlowSummaryView.js
import React from 'react'; // useState, useEffect, useMemo are removed if all data is from props
import { PieChart, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const CashFlowSummaryView = ({
    cashFlowSummaryData, // Expects { selectedMonth, overallSummary, projectMonthlySummaries, availableMonths }
    isLoadingSummary,
    selectedMonth,
    setSelectedMonth,
}) => {

    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    const formatMonthDisplay = (monthYear) => {
        if (!monthYear) return "Select Month";
        const [year, month] = monthYear.split('-');
        if (isNaN(new Date(year, parseInt(month, 10) - 1))) return "Invalid Date";
        const date = new Date(year, parseInt(month, 10) - 1);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    };

    if (isLoadingSummary) {
        return (
            <div className="flex items-center justify-center mt-10 p-6">
                <Loader2 className="animate-spin h-10 w-10 text-sky-500" />
                <p className="ml-3 text-lg text-slate-300">Loading Cash Flow Summary...</p>
            </div>
        );
    }

    if (!cashFlowSummaryData || !cashFlowSummaryData.overallSummary) {
        return (
             <div className="p-6 bg-slate-800 shadow-xl rounded-lg text-center">
                <PieChart size={48} className="mx-auto mb-4 text-sky-600"/>
                <h2 className="text-2xl font-semibold text-sky-400 mb-3">Monthly Cash Flow Summary</h2>
                 <label htmlFor="month-filter-placeholder" className="text-sm text-slate-300 mr-2">Filter by Month:</label>
                 <select
                    id="month-filter-placeholder"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="p-2 my-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-sky-500 focus:border-sky-500 min-w-[150px]"
                 >
                    <option value={selectedMonth}>{formatMonthDisplay(selectedMonth) || "Loading months..."}</option>
                    {(cashFlowSummaryData?.availableMonths || []).map(month => ( // Use optional chaining
                        <option key={month} value={month}>
                            {formatMonthDisplay(month)}
                        </option>
                    ))}
                 </select>
                <p className="text-slate-400 mt-2">
                    {selectedMonth ? `No summary data available for ${formatMonthDisplay(selectedMonth)}.` : "Please select a month."}
                </p>
            </div>
        );
    }

    const {
        overallSummary,
        projectMonthlySummaries = [],
        availableMonths = [],
        selectedMonth: processedMonth // This is the month the backend processed for
    } = cashFlowSummaryData;

    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-3xl font-semibold text-sky-400 mb-3 sm:mb-0 flex items-center">
                        <PieChart size={30} className="mr-3" />Monthly Cash Flow Summary
                    </h2>
                    <div>
                        <label htmlFor="month-filter" className="text-sm text-slate-300 mr-2">Filter by Month:</label>
                        <select
                            id="month-filter"
                            value={selectedMonth} // This is the App.js selectedMonth state
                            onChange={handleMonthChange}
                            className="p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-sky-500 focus:border-sky-500 min-w-[150px]"
                        >
                            {availableMonths.length === 0 && selectedMonth ? (
                                <option value={selectedMonth}>{formatMonthDisplay(selectedMonth)} (No data for any month)</option>
                            ) : null}
                            {availableMonths.map(month => (
                                <option key={month} value={month}>
                                    {formatMonthDisplay(month)}
                                </option>
                            ))}
                            {!availableMonths.includes(selectedMonth) && availableMonths.length > 0 && selectedMonth && (
                                 <option value={selectedMonth} disabled hidden>{formatMonthDisplay(selectedMonth)} (No data this month)</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Cards using overallSummary and processedMonth */}
                    {/* Example: */}
                    <div className="p-6 bg-green-800/50 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg text-green-300 font-semibold mb-1">Total Income ({formatMonthDisplay(processedMonth)})</h3>
                        <p className="text-3xl font-bold text-green-400">{formatCurrency(overallSummary.totalOverallIncome)}</p>
                    </div>
                    {/* Other cards for expenses and net cash flow */}
                    <div className="p-6 bg-red-800/50 rounded-xl shadow-lg text-center">
  <h3 className="text-lg text-red-300 font-semibold mb-1">Total Expenses ({formatMonthDisplay(processedMonth)})</h3>
<p className="text-3xl font-bold text-red-400">{formatCurrency(overallSummary.totalOverallExpenses)}</p>
</div>
<div className="p-6 bg-sky-800/50 rounded-xl shadow-lg text-center">
<h3 className="text-lg text-sky-300 font-semibold mb-1">Net Cash Flow ({formatMonthDisplay(processedMonth)})</h3>
<p className={`text-3xl font-bold ${overallSummary.totalOverallNetCashFlow >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>
{formatCurrency(overallSummary.totalOverallNetCashFlow)}
 </p>
</div>
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-semibold text-sky-300 mb-4">Cash Flow by Project ({formatMonthDisplay(processedMonth)})</h3>
                {projectMonthlySummaries.length > 0 ? (
                    <div className="overflow-x-auto bg-slate-700/50 rounded-lg shadow-lg">
                        {/* Table using projectMonthlySummaries */}
                        <table className="w-full min-w-max text-left text-slate-300">
 <thead className="bg-slate-800 text-slate-400">
 <tr>
 <th className="p-4">Project Name</th>
<th className="p-4 text-right">Monthly Income</th>
 <th className="p-4 text-right">Monthly Expenses</th>
 <th className="p-4 text-right">Monthly Net Cash Flow</th>
</tr>
 </thead>
 <tbody>
 {projectMonthlySummaries
.sort((a, b) => a.project_name.localeCompare(b.project_name))
.map(projSummary => (
<tr key={projSummary.id} className="border-b border-slate-600 hover:bg-slate-600/50 transition-colors">
<td className="p-4 text-white font-medium">{projSummary.project_name}</td>
<td className="p-4 text-right text-green-400">{formatCurrency(projSummary.monthly_income)}</td>
 <td className="p-4 text-right text-red-400">{formatCurrency(projSummary.monthly_expenses)}</td>
<td className={`p-4 text-right font-semibold ${projSummary.monthly_net_cash_flow >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>
 {formatCurrency(projSummary.monthly_net_cash_flow)}
 </td>
</tr>
 ))}
</tbody>
</table>
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-3">No cash flow activity recorded for any project in {formatMonthDisplay(processedMonth)}.</p>
                )}
            </div>
        </div>
    );
};

export default CashFlowSummaryView;