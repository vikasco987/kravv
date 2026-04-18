import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { PublicMenuView } from '../../components/menu/PublicMenuView';

export default function PublicMenuScreen() {
  const { clerkId, tableId } = useLocalSearchParams();
  
  if (!clerkId) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PublicMenuView clerkId={clerkId as string} tableId={tableId as string} />
    </>
  );
}

