import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
}

/**
 * A wrapper component that only renders its children if the logged-in staff
 * has the required permission. Works for both Admin (no staff_session) 
 * and Staff (filtered by permissions array).
 */
export const PermissionGuard = ({ 
  children, 
  requiredPermission, 
  fallback = null 
}: PermissionGuardProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('staff_session');
        
        // If no staff_session, assume it's the Admin/Owner who has all permissions
        if (!sessionStr) {
          setHasPermission(true);
          return;
        }

        const staffData = JSON.parse(sessionStr);
        const userPermissions = staffData.permissions || [];

        // Check if the required permission is in the staff's permissions list
        const allowed = userPermissions.some((p: string) => 
          p.toLowerCase().includes(requiredPermission.toLowerCase())
        );

        setHasPermission(allowed);
      } catch (error) {
        console.error("Permission check error:", error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [requiredPermission]);

  // While checking, render nothing or fallback
  if (hasPermission === null) return null;

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
