import React, { useState, useEffect } from 'react';
import AIAssistantToggle from './AIAssistantToggle';

export default function AIAssistantPage() {
  const [userPlan, setUserPlan] = useState('basic');
  const [quotaUsed, setQuotaUsed] = useState(0);

  // Mock data for now - in real app this would come from user context
  useEffect(() => {
    // TODO: Fetch real user plan and quota usage
    const checkUserPlan = async () => {
      try {
        // const response = await fetch('/api/user/plan');
        // const data = await response.json();
        // setUserPlan(data.plan);
        // setQuotaUsed(data.quotaUsed);
        
        // For now, use localStorage to simulate quota tracking
        const usedQuota = parseInt(localStorage.getItem('ai_quota_used') || '0');
        setQuotaUsed(usedQuota);
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    checkUserPlan();
  }, []);

  const handleExecuteAction = async (action) => {
    console.log('Executing action:', action);
    
    // Increment quota for basic chat usage
    if (action.type === 'chat_basic') {
      const newQuota = quotaUsed + 1;
      setQuotaUsed(newQuota);
      localStorage.setItem('ai_quota_used', newQuota.toString());
    }

    // For now, always return success
    return { success: true };
  };

  const handleUpgrade = () => {
    console.log('User wants to upgrade to premium');
    // TODO: Implement upgrade flow
    alert('Función de upgrade en desarrollo. Contacta soporte para activar AI Premium.');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Asistente AI para Heladerías
        </h1>
        <p className="text-gray-600">
          Gestiona tu heladería de forma inteligente con nuestro asistente AI
        </p>
      </div>

      <AIAssistantToggle 
        userPlan={userPlan}
        quotaUsed={quotaUsed}
        onUpgrade={handleUpgrade}
        onExecuteAction={handleExecuteAction}
      />
    </div>
  );
}