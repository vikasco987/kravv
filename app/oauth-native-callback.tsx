import { useClerk } from "@clerk/clerk-expo";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

export default function OAuthNativeCallback() {
  const { setActive } = useClerk();
  const { createdSessionId } = useLocalSearchParams();

  useEffect(() => {
    if (createdSessionId && setActive) {
      setActive({ session: createdSessionId as string });
    }
  }, [createdSessionId, setActive]);

  return <Redirect href="/(tabs)/menu" />;
}
