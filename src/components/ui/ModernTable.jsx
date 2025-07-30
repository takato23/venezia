import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import clsx from 'clsx';

const ModernTable = ({
  columns,
  data,
  loading = false,
  pageSize = 10,
  showSearch = true,
  showFilters = true,
  onRefresh,
  onExport,
  className = '',
  emptyMessage = 'No hay datos disponibles',
  gradient = 'blue'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  // Gradientes por tipo
  const gradients = {
    blue: 'from-blue-500/10 to-indigo-500/10',
    green: 'from-emerald-500/10 to-teal-500/10',
    purple: 'from-purple-500/10 to-pink-500/10',
    orange: 'from-orange-500/10 to-red-500/10',
  };

  // Filtrar datos por búsqueda
  const filteredData = data?.filter(row => 
    Object.values(row).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  // Ordenar datos
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue > bValue ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Manejadores
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedData.map((_, index) => index));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter(i => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx('relative', className)}
    >
      {/* Container con glassmorphism */}
      <div className={clsx(
        'backdrop-blur-md bg-white/80 dark:bg-gray-900/80',
        'border border-gray-200/50 dark:border-gray-700/50',
        'rounded-2xl shadow-xl overflow-hidden'
      )}>
        {/* Header con controles */}
        <div className={clsx(
          'p-6 border-b border-gray-200/50 dark:border-gray-700/50',
          'bg-gradient-to-r', gradients[gradient]
        )}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Búsqueda */}
            {showSearch && (
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={clsx(
                    'pl-10 pr-4 py-2 w-full sm:w-64',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'rounded-lg focus:ring-2 focus:ring-blue-500/50',
                    'transition-all duration-200'
                  )}
                />
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              {showFilters && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:bg-white/70 dark:hover:bg-gray-800/70',
                    'transition-all duration-200'
                  )}
                >
                  <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </motion.button>
              )}
              
              {onRefresh && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRefresh}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:bg-white/70 dark:hover:bg-gray-800/70',
                    'transition-all duration-200'
                  )}
                >
                  <RefreshCw className={clsx(
                    'h-4 w-4 text-gray-600 dark:text-gray-400',
                    loading && 'animate-spin'
                  )} />
                </motion.button>
              )}
              
              {onExport && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onExport}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:bg-white/70 dark:hover:bg-gray-800/70',
                    'transition-all duration-200'
                  )}
                >
                  <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="p-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                    className={clsx(
                      'p-4 text-left font-medium text-gray-700 dark:text-gray-300',
                      column.sortable !== false && 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
                      'transition-colors duration-200'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable !== false && (
                        <div className="flex flex-col">
                          <ChevronUp className={clsx(
                            'h-3 w-3 -mb-1',
                            sortColumn === column.key && sortDirection === 'asc'
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          )} />
                          <ChevronDown className={clsx(
                            'h-3 w-3',
                            sortColumn === column.key && sortDirection === 'desc'
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          )} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200/50 dark:border-gray-700/50">
                    <td className="p-4">
                      <div className="h-4 w-4 bg-gray-200/50 dark:bg-gray-700/50 rounded animate-pulse" />
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="p-4">
                        <div className="h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={columns.length + 1} className="p-12 text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-500 dark:text-gray-400"
                    >
                      <div className="mb-4 text-6xl opacity-20">📋</div>
                      <p>{emptyMessage}</p>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                // Data rows con animación
                <AnimatePresence>
                  {paginatedData.map((row, rowIndex) => (
                    <motion.tr
                      key={rowIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: rowIndex * 0.05 }}
                      className={clsx(
                        'border-b border-gray-200/50 dark:border-gray-700/50',
                        'hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
                        'transition-colors duration-200',
                        selectedRows.includes(rowIndex) && 'bg-blue-50/50 dark:bg-blue-900/20'
                      )}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(rowIndex)}
                          onChange={() => handleSelectRow(rowIndex)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      {columns.map((column) => (
                        <td key={column.key} className="p-4 text-gray-700 dark:text-gray-300">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {startIndex + 1} - {Math.min(startIndex + pageSize, filteredData.length)} de {filteredData.length}
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:bg-white/70 dark:hover:bg-gray-800/70',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:bg-white/70 dark:hover:bg-gray-800/70',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          'w-8 h-8 rounded-lg text-sm font-medium',
                          'transition-all duration-200',
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70'
                        )}
                      >
                        {page}
                      </motion.button>
                    );
                  })}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:bg-white/70 dark:hover:bg-gray-800/70',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:bg-white/70 dark:hover:bg-gray-800/70',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                >
                  <ChevronsRight className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ModernTable;