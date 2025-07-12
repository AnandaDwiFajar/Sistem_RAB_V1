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
