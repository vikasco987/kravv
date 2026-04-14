import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StaffPermissionEngine } from './StaffPermissionEngine';

/**
 * useStaffPermissions
 * A custom hook to be used in UI components to check for permissions reactively.
 */
export const useStaffPermissions = () => {
  const { isSignedIn: isOwnerSignedIn, isLoaded } = useUser();
  const [isStaffSignedIn, setIsStaffSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStaff = async () => {
      const session = await AsyncStorage.getItem('staff_session');
      setIsStaffSignedIn(!!session);
    };
    checkStaff();
  }, []);

  /**
   * canAccess: Reactive check for a specific individual permission
   */
  const canAccess = async (permissionName: string): Promise<boolean> => {
    if (!isLoaded) return false;
    return await StaffPermissionEngine.hasAccess(permissionName, !!isOwnerSignedIn);
  };

  /**
   * canAccessCategory: Reactive check for a whole category/tab
   */
  const canAccessCategory = async (categoryName: string): Promise<boolean> => {
    if (!isLoaded) return false;
    return await StaffPermissionEngine.hasCategoryAccess(categoryName, !!isOwnerSignedIn);
  };

  /**
   * isOwner: Simple check if the current user is the root owner
   */
  const isOwner = !!isOwnerSignedIn;

  return {
    isLoaded,
    isOwner,
    isStaffSignedIn,
    canAccess,
    canAccessCategory
  };
};
