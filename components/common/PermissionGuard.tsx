import { useUser } from '@clerk/clerk-expo';
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
    // Only Owner (Clerk user) has full access, Staff access is disabled as requested.
    setHasPermission(isSignedIn);
  }, [isSignedIn, isLoaded]);

  if (hasPermission === null) return null;

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
