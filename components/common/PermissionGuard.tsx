import React from 'react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard
 * Logic removed by user request for re-implementation.
 * Currently allows all children to be rendered.
 */
export const PermissionGuard = ({
  children,
  requiredPermission,
  fallback = null
}: PermissionGuardProps) => {
  return <>{children}</>;
};
