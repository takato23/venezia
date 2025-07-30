import React, { useState, useEffect } from 'react';
import { 
  Tag,
  Percent,
  Gift,
  Calendar,
  Users,
  DollarSign,
  Truck,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const CouponManager = ({ onCouponChange }) => {
  const { success, error, warning, info } = useToast();
  
  // Estados
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [couponStats, setCouponStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Tipos de cupones
  const couponTypes = [
    { value: 'percentage', label: 'Porcentaje', icon: Percent },
    { value: 'fixed', label: 'Monto fijo', icon: DollarSign },
    { value: 'freeShipping', label: 'Envío gratis', icon: Truck },
    { value: 'buyOneGetOne', label: '2x1', icon: Gift },
    { value: 'productDiscount', label: 'Descuento en producto', icon: ShoppingBag }
  ];

  // Cargar cupones
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const response = await fetch('/api/shop/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      error('Error', 'No se pudieron cargar los cupones');
    }
  };

  // Crear/Editar cupón
  const saveCoupon = async (couponData) => {
    setLoading(true);
    try {
      const url = selectedCoupon 
        ? `/api/shop/coupons/${selectedCoupon.id}`
        : '/api/shop/coupons';
      
      const response = await fetch(url, {
        method: selectedCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });

      if (response.ok) {
        success(
          selectedCoupon ? 'Cupón actualizado' : 'Cupón creado',
          `El cupón ${couponData.code} se ${selectedCoupon ? 'actualizó' : 'creó'} correctamente`
        );
        loadCoupons();
        setShowCouponModal(false);
        setSelectedCoupon(null);
        
        if (onCouponChange) onCouponChange();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el cupón');
      }
    } catch (err) {
      error('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cupón
  const deleteCoupon = async (couponId) => {
    if (!window.confirm('¿Está seguro de eliminar este cupón?')) return;
    
    try {
      const response = await fetch(`/api/shop/coupons/${couponId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success('Cupón eliminado', 'El cupón se eliminó correctamente');
        loadCoupons();
      }
    } catch (err) {
      error('Error', 'No se pudo eliminar el cupón');
    }
  };

  // Activar/Desactivar cupón
  const toggleCouponStatus = async (coupon) => {
    try {
      const response = await fetch(`/api/shop/coupons/${coupon.id}/toggle`, {
        method: 'PUT'
      });

      if (response.ok) {
        info(
          coupon.isActive ? 'Cupón desactivado' : 'Cupón activado',
          `El cupón ${coupon.code} ahora está ${coupon.isActive ? 'inactivo' : 'activo'}`
        );
        loadCoupons();
      }
    } catch (err) {
      error('Error', 'No se pudo cambiar el estado del cupón');
    }
  };

  // Duplicar cupón
  const duplicateCoupon = (coupon) => {
    const duplicated = {
      ...coupon,
      id: null,
      code: `${coupon.code}_COPY`,
      usageCount: 0,
      isActive: false
    };
    setSelectedCoupon(duplicated);
    setShowCouponModal(true);
  };

  // Ver estadísticas
  const viewStats = async (couponId) => {
    try {
      const response = await fetch(`/api/shop/coupons/${couponId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setCouponStats(data);
        setShowStatsModal(true);
      }
    } catch (err) {
      error('Error', 'No se pudieron cargar las estadísticas');
    }
  };

  // Validar cupón
  const validateCoupon = async (code, orderData) => {
    try {
      const response = await fetch('/api/shop/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderData })
      });

      const data = await response.json();
      
      if (response.ok) {
        return { valid: true, ...data };
      } else {
        return { valid: false, error: data.error };
      }
    } catch (err) {
      return { valid: false, error: 'Error al validar el cupón' };
    }
  };

  // Filtrar cupones
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && coupon.isActive) ||
                         (filterStatus === 'inactive' && !coupon.isActive) ||
                         (filterStatus === 'expired' && new Date(coupon.expiryDate) < new Date());
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Gestión de Cupones y Promociones
          </h3>
          
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setSelectedCoupon(null);
              setShowCouponModal(true);
            }}
          >
            Nuevo Cupón
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Tag}
            />
          </div>
          
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="expired">Expirados</option>
          </Select>
        </div>
      </div>

      {/* Lista de cupones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map(coupon => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            onEdit={() => {
              setSelectedCoupon(coupon);
              setShowCouponModal(true);
            }}
            onDelete={() => deleteCoupon(coupon.id)}
            onToggle={() => toggleCouponStatus(coupon)}
            onDuplicate={() => duplicateCoupon(coupon)}
            onViewStats={() => viewStats(coupon.id)}
          />
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'No se encontraron cupones con los filtros aplicados'
              : 'No hay cupones creados aún'
            }
          </p>
        </div>
      )}

      {/* Modal de cupón */}
      <Modal
        isOpen={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setSelectedCoupon(null);
        }}
        title={selectedCoupon?.id ? 'Editar Cupón' : 'Nuevo Cupón'}
        size="lg"
      >
        <CouponForm
          coupon={selectedCoupon}
          onSave={saveCoupon}
          onCancel={() => {
            setShowCouponModal(false);
            setSelectedCoupon(null);
          }}
          loading={loading}
        />
      </Modal>

      {/* Modal de estadísticas */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Estadísticas del Cupón"
      >
        {couponStats && <CouponStats stats={couponStats} />}
      </Modal>
    </div>
  );
};

// Componente CouponCard
const CouponCard = ({ coupon, onEdit, onDelete, onToggle, onDuplicate, onViewStats }) => {
  // Definir couponTypes localmente para el componente
  const couponTypes = [
    { value: 'percentage', label: 'Porcentaje', icon: Percent },
    { value: 'fixed', label: 'Monto fijo', icon: DollarSign },
    { value: 'freeShipping', label: 'Envío gratis', icon: Truck },
    { value: 'buyOneGetOne', label: '2x1', icon: Gift },
    { value: 'productDiscount', label: 'Descuento en producto', icon: ShoppingBag }
  ];
  
  const TypeIcon = couponTypes.find(t => t.value === coupon.type)?.icon || Tag;
  const isExpired = new Date(coupon.expiryDate) < new Date();
  
  return (
    <div className={clsx(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6",
      !coupon.isActive && "opacity-60",
      isExpired && "border-red-300 dark:border-red-800"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-2 rounded-lg",
            coupon.isActive && !isExpired
              ? "bg-venezia-100 dark:bg-venezia-900/20 text-venezia-600 dark:text-venezia-400"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500"
          )}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {coupon.code}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {coupon.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {coupon.isActive && !isExpired ? (
            <Badge variant="success" size="xs">Activo</Badge>
          ) : isExpired ? (
            <Badge variant="danger" size="xs">Expirado</Badge>
          ) : (
            <Badge variant="default" size="xs">Inactivo</Badge>
          )}
        </div>
      </div>

      {/* Detalles del cupón */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
          <span className="font-medium">
            {coupon.type === 'percentage' && `${coupon.value}%`}
            {coupon.type === 'fixed' && `$${coupon.value}`}
            {coupon.type === 'freeShipping' && 'Envío gratis'}
            {coupon.type === 'buyOneGetOne' && '2x1'}
          </span>
        </div>
        
        {coupon.minimumAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Mínimo:</span>
            <span className="font-medium">${coupon.minimumAmount}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Usos:</span>
          <span className="font-medium">
            {coupon.usageCount} / {coupon.maxUses || '∞'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Expira:</span>
          <span className={clsx(
            "font-medium",
            isExpired && "text-red-600 dark:text-red-400"
          )}>
            {new Date(coupon.expiryDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="xs"
          onClick={onViewStats}
          icon={BarChart}
        />
        <Button
          variant="ghost"
          size="xs"
          onClick={onEdit}
          icon={Edit}
        />
        <Button
          variant="ghost"
          size="xs"
          onClick={onDuplicate}
          icon={Copy}
        />
        <Button
          variant="ghost"
          size="xs"
          onClick={onToggle}
          icon={coupon.isActive ? XCircle : CheckCircle}
        />
        <Button
          variant="ghost"
          size="xs"
          onClick={onDelete}
          icon={Trash2}
          className="text-red-600 hover:text-red-700"
        />
      </div>
    </div>
  );
};

// Componente CouponForm
const CouponForm = ({ coupon, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    type: coupon?.type || 'percentage',
    value: coupon?.value || 10,
    minimumAmount: coupon?.minimumAmount || 0,
    maxUses: coupon?.maxUses || null,
    maxUsesPerCustomer: coupon?.maxUsesPerCustomer || 1,
    expiryDate: coupon?.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: coupon?.isActive ?? true,
    applicableProducts: coupon?.applicableProducts || [],
    applicableCategories: coupon?.applicableCategories || [],
    customerTiers: coupon?.customerTiers || []
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Solo mayúsculas, números, guiones y guión bajo';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    if (formData.type === 'percentage' && (formData.value <= 0 || formData.value > 100)) {
      newErrors.value = 'El porcentaje debe estar entre 1 y 100';
    }
    
    if (formData.type === 'fixed' && formData.value <= 0) {
      newErrors.value = 'El monto debe ser mayor a 0';
    }
    
    if (new Date(formData.expiryDate) < new Date()) {
      newErrors.expiryDate = 'La fecha debe ser futura';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Código del cupón"
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
          error={errors.code}
          placeholder="VERANO2024"
          required
        />
        
        <Select
          label="Tipo de descuento"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          options={couponTypes}
        />
      </div>
      
      <Input
        label="Descripción"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        error={errors.description}
        placeholder="Descuento de verano del 20%"
        required
      />
      
      <div className="grid grid-cols-2 gap-4">
        {(formData.type === 'percentage' || formData.type === 'fixed') && (
          <Input
            label={formData.type === 'percentage' ? 'Porcentaje' : 'Monto'}
            type="number"
            value={formData.value}
            onChange={(e) => handleChange('value', parseFloat(e.target.value))}
            error={errors.value}
            min="0"
            max={formData.type === 'percentage' ? "100" : undefined}
            step={formData.type === 'percentage' ? "1" : "0.01"}
            required
          />
        )}
        
        <Input
          label="Compra mínima"
          type="number"
          value={formData.minimumAmount}
          onChange={(e) => handleChange('minimumAmount', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          placeholder="0 = Sin mínimo"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Usos máximos"
          type="number"
          value={formData.maxUses || ''}
          onChange={(e) => handleChange('maxUses', parseInt(e.target.value) || null)}
          min="1"
          placeholder="Ilimitado"
        />
        
        <Input
          label="Por cliente"
          type="number"
          value={formData.maxUsesPerCustomer}
          onChange={(e) => handleChange('maxUsesPerCustomer', parseInt(e.target.value) || 1)}
          min="1"
        />
        
        <Input
          label="Fecha de expiración"
          type="date"
          value={formData.expiryDate}
          onChange={(e) => handleChange('expiryDate', e.target.value)}
          error={errors.expiryDate}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Activar cupón inmediatamente
          </span>
        </label>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {coupon?.id ? 'Actualizar' : 'Crear'} Cupón
        </Button>
      </div>
    </form>
  );
};

// Componente CouponStats
const CouponStats = ({ stats }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalUses}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Usos totales</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.totalDiscount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Descuento total</p>
        </div>
      </div>
      
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          ${stats.generatedRevenue.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ingresos generados
        </p>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Últimos usos
        </h4>
        <div className="space-y-2">
          {stats.recentUses?.map((use, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {use.customerName}
              </span>
              <span className="text-gray-900 dark:text-white">
                ${use.orderTotal} ({new Date(use.usedAt).toLocaleDateString()})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CouponManager;