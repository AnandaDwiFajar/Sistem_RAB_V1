/* eslint-disable require-jsdoc, camelcase, no-unused-vars, react/prop-types */
import { useState, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

export const useCashFlowSummary = (currentView) => {
    const { userId } = useAuth();
    const { showToast } = useUI();

    // State for the selected month filter
    const [selectedMonth, setSelectedMonth] = useState('');
    // State to hold the fetched summary data
    const [summaryData, setSummaryData] = useState(null);
    // Loading state specific to this summary
    const [isLoading, setIsLoading] = useState(false);

    // Effect to set the default selected month to the current month on initial mount
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        setSelectedMonth(`${year}-${month}`);
    }, []); // This effect correctly runs only once on mount

    // Effect to fetch data when the view is active and filters change
    useEffect(() => {
        // We only fetch if the view is correct and we have the necessary IDs.
        if (currentView === 'cashFlowSummary' && userId && selectedMonth) {
            setIsLoading(true);
            // We don't clear data here anymore, to avoid UI flashing if a re-fetch occurs.
            
            apiService.fetchCashFlowSummaryByMonthApi(userId, selectedMonth)
                .then(data => {
                    setSummaryData(data);
                })
                .catch(error => {
                    console.error("useCashFlowSummary - Error fetching summary:", error);
                    showToast('error', `Gagal memuat ringkasan arus kas: ${error.message}`);
                    // Set a default structure on error to prevent the view from crashing
                    setSummaryData({
                        selectedMonth: selectedMonth,
                        overallSummary: { totalOverallIncome: 0, totalOverallExpenses: 0, totalOverallNetCashFlow: 0 },
                        projectMonthlySummaries: [],
                        availableMonths: summaryData?.availableMonths || [] // try to preserve old available months
                    });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [currentView, userId, selectedMonth, showToast]); 


    return {
        selectedMonth,
        setSelectedMonth,
        summaryData,
        isLoading,
    };
};
