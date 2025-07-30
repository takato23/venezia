// Componente POS Ultra-Rápido para empleados
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  MinusIcon, 
  ShoppingCartIcon,
  CreditCardIcon,
  CashIcon,
  QrCodeIcon,
  BanknotesIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

// Hook para sonidos de feedback
const useSound = () => {
  const sounds = useRef({
    add: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/