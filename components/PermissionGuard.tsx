import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
}

export const PermissionGuard = ({
  children,
  requiredPermission,
  fallback = null
}: PermissionGuardProps) => {
  const { isSignedIn, isLoaded } = useUser();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const checkPermission = async () => {
      try {
        // 1. If Owner is signed in via Clerk, they have full access
        if (isSignedIn) {
          setHasPermission(true);
          return;
        }

        // 2. Check for Staff Session
        const sessionStr = await AsyncStorage.getItem('staff_session');
        if (!sessionStr) {
          // If no staff session and no clerk session, it's a Guest
          setHasPermission(false);
          return;
        }

        const staffData = JSON.parse(sessionStr);
        const userPermissions = staffData.permissions || [];

        // 3. Match against requiredPermission
        const allowed = userPermissions.some((p: string) =>
          p.toLowerCase().trim() === requiredPermission.toLowerCase().trim() ||
          p.toLowerCase().includes(requiredPermission.toLowerCase().trim())
        );

        setHasPermission(allowed);
      } catch (error) {
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [requiredPermission, isSignedIn, isLoaded]);

  if (hasPermission === null) return null;

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
