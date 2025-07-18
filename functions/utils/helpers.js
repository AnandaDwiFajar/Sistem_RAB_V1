// functions/utils/helpers.js

const formatCurrency = (amount) => {
  // Convert amount to a number, handling both string and number inputs
  const numberAmount = Number(amount);
  if (isNaN(numberAmount)) {
    return 'Rp 0'; // Return a default value if conversion fails
  }
  // Format to Indonesian Rupiah without decimal places
  return `Rp ${numberAmount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Handle both Firestore Timestamp objects and standard ISO date strings
        const date = dateString._seconds ? new Date(dateString._seconds * 1000) : new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Tanggal Tidak Valid';
        }

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'Tanggal Tidak Valid';
    }
};

module.exports = {
    formatCurrency,
    formatDate,
};
