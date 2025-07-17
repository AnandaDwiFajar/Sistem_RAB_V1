// utils/helpers.js
import React from 'react';

export const formatCurrency = (amount, withColor = false) => {
  if (typeof amount !== 'number') return 'Rp 0';
  const formatted = `Rp ${amount.toLocaleString('id-ID')}`;
  if (withColor) {
    if (amount > 0) return <span className="text-green-400">{formatted}</span>;
    if (amount < 0) return <span className="text-red-400">{formatted}</span>;
  }
  return formatted;
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString.split('T')[0].replace(/-/g, '/'));
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch (error) {
        return 'Invalid Date';
    }
};

export const generateId = () => crypto.randomUUID();

export const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};
