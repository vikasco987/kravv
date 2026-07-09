import React, { useEffect, useState } from 'react';
import { Dimensions, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const isNewerVersion = (current: string, latest: string) => {
  if (!current || !latest) return false;
  const currParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currParts.length, latestParts.length); i++) {
    const c = currParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export default function ForceUpdateChecker() {
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [updateUrl, setUpdateUrl] = useState("market://details?id=com.vikas9095.kravy");

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch("https://play.google.com/store/apps/details?id=com.vikas9095.kravy&hl=en&gl=US");
        const html = await response.text();
        
        const match = html.match(/\[\[\["([0-9]+\.[0-9]+\.[0-9]+)"\]\]/);
        
        if (match && match[1]) {
          const latestVersion = match[1];
          const currentVersion = Constants.expoConfig?.version || '1.0.0';
          
          if (isNewerVersion(currentVersion, latestVersion)) {
            setIsUpdateRequired(true);
          }
        }
      } catch (error) {
        console.log("Play Store version check failed:", error);
      }
    };

    checkVersion();
  }, []);

  const handleUpdatePress = async () => {
    const marketUrl = updateUrl.includes("market://") ? updateUrl : "market://details?id=com.vikas9095.kravy";
    const webUrl = "https://play.google.com/store/apps/details?id=com.vikas9095.kravy";

    try {
      // Pehle try karenge ki seedha Play Store App open ho jaye
      const canOpen = await Linking.canOpenURL(marketUrl);
      if (canOpen) {
        await Linking.openURL(marketUrl);
      } else {
        // Agar Play Store App nahi hai phone me, toh browser me khol denge
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      // Kisi bhi error ke case mein safe fallback browser link par
      await Linking.openURL(webUrl);
    }
  };

  if (!isUpdateRequired) {
    return null; // Component chup-chap hidden rahega jab tak zaroorat na ho
  }

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Top Header Graphic/Gradient */}
          <LinearGradient
            colors={['#4F46E5', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGraphic}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="rocket" size={54} color="#FFF" />
            </View>
          </LinearGradient>

          {/* Content Area */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Update Available!</Text>
            <Text style={styles.message}>
              We've added new features and fixed bugs to make Kravy even better. Update now to enjoy the best experience.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.updateButton}
              onPress={handleUpdatePress}
            >
              <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>UPDATE NOW</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.85)', // Dark premium overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  headerGraphic: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  contentContainer: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  updateButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
