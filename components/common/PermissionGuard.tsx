import { useUser } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { StaffPermissionEngine } from '../staff creat/StaffPermissionEngine';

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
    const check = async () => {
      if (!isLoaded) return;
      const allowed = await StaffPermissionEngine.hasAccess(requiredPermission, !!isSignedIn);
      setHasPermission(allowed);
    };
    check();
  }, [isSignedIn, isLoaded, requiredPermission]);

  if (hasPermission === null) return null;

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
