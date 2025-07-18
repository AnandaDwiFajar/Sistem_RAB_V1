import React, { useState, useMemo } from 'react';
import { ChevronRight, Calculator, HelpCircle } from 'lucide-react';
import { CALCULATION_SCHEMAS } from '../utils/calculationSchemas';

const CalculationSimulatorView = () => {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedSchemaId, setSelectedSchemaId] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [result, setResult] = useState(null);

    const groupedSchemas = useMemo(() => {
        return Object.values(CALCULATION_SCHEMAS).reduce((acc, schema) => {
            if (schema.isSimple) return acc;
            const group = schema.group || 'Lainnya';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(schema);
            return acc;
        }, {});
    }, []);

    const handleSelectGroup = (groupName) => {
        setSelectedGroup(groupName);
        setSelectedSchemaId(null);
        setResult(null);
    };
    
    const handleSelectSchema = (schemaId) => {
        setSelectedSchemaId(schemaId);
        setInputValues({});
        setResult(null);
    };

    const handleInputChange = (inputKey, value) => {
        setInputValues(prev => ({ ...prev, [inputKey]: value }));
    };

    const handleCalculate = () => {
        const schema = Object.values(CALCULATION_SCHEMAS).find(s => s.id === selectedSchemaId);
        if (!schema || !schema.calculate) return;

        const inputs = schema.inputs.reduce((acc, input) => {
            const value = inputValues[input.key];
            acc[input.key] = value !== undefined && value !== '' ? parseFloat(value) : parseFloat(input.defaultValue);
            return acc;
        }, {});

        const calculatedResult = schema.calculate(inputs);
        setResult(calculatedResult);
    };

    const currentSchema = selectedSchemaId ? Object.values(CALCULATION_SCHEMAS).find(s => s.id === selectedSchemaId) : null;

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Simulasi dan Penjelasan Kalkulasi</h1>
                <p className="text-gray-600 mt-1">Pilih grup kalkulasi untuk memulai simulasi.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Kolom Kiri: Daftar Grup dan Skema */}
                <div className="md:col-span-1 space-y-4">
                    {Object.keys(groupedSchemas).map(groupName => (
                        <div key={groupName} className="bg-white rounded-lg shadow-sm">
                            <button
                                onClick={() => handleSelectGroup(groupName)}
                                className="w-full text-left p-4 font-semibold text-lg text-gray-700 hover:bg-gray-50 flex justify-between items-center"
                            >
                                {groupName}
                                <ChevronRight className={`transform transition-transform ${selectedGroup === groupName ? 'rotate-90' : ''}`} size={20} />
                            </button>
                            {selectedGroup === groupName && (
                                <div className="p-4 border-t border-gray-200">
                                    <ul className="space-y-2">
                                        {groupedSchemas[groupName].map(schema => (
                                            <li key={schema.id}>
                                                <button
                                                    onClick={() => handleSelectSchema(schema.id)}
                                                    className={`w-full text-left p-2 rounded-md text-sm ${selectedSchemaId === schema.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}
                                                >
                                                    {schema.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Kolom Kanan: Detail dan Form Kalkulasi */}
                <div className="md:col-span-2">
                    {currentSchema ? (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                                <Calculator className="mr-3 text-blue-600" size={24}/>
                                {currentSchema.name}
                            </h2>
                            <p className="text-gray-600 mb-6 flex items-start">
                                <HelpCircle className="mr-2 mt-1 text-gray-400 flex-shrink-0" size={16}/>
                                <span>{currentSchema.description}</span>
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {currentSchema.inputs.map(input => (
                                    <div key={input.key}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={input.key}>
                                            {input.label} <span className="text-gray-500">({input.unitSymbol})</span>
                                        </label>
                                        <input
                                            type={input.type || 'number'}
                                            id={input.key}
                                            value={inputValues[input.key] || ''}
                                            placeholder={`Contoh: ${input.defaultValue}`}
                                            onChange={(e) => handleInputChange(input.key, e.target.value)}
                                            className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 mt-6">
                                <button
                                    onClick={handleCalculate}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                                >
                                    Hitung
                                </button>
                                {result !== undefined && result !== null && (
                                    <div className="bg-green-100 border border-green-200 p-3 rounded-md">
                                        <p className="font-semibold text-green-800">{currentSchema.output.label}: <span className="font-bold">{Number(result).toLocaleString('id-ID', { maximumFractionDigits: 4 })}</span> {currentSchema.output.unitSymbol}</p>
                                    </div>
                                )}
                                {result === null && (
                                    <div className="bg-red-100 border border-red-200 p-3 rounded-md">
                                        <p className="font-semibold text-red-800">Hasil tidak valid. Periksa kembali input Anda.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-white p-6 rounded-lg shadow text-center">
                           <Calculator size={48} className="text-gray-300 mb-4" />
                           <h3 className="text-xl font-semibold text-gray-700">Pilih Kalkulasi</h3>
                           <p className="text-gray-500 mt-2">Pilih salah satu jenis kalkulasi dari panel di sebelah kiri untuk melihat detail dan memulai simulasi.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalculationSimulatorView;