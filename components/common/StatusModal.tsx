import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

interface StatusModalProps {
  visible: boolean;
  onClose: () => void;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  buttonText?: string;
}

const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  onClose,
  type,
  title,
  message,
  buttonText = "OK",
}) => {
  const getIcon = (): React.ComponentProps<typeof Ionicons>["name"] => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "info":
        return "information-circle";
      default:
        return "information-circle";
    }
  };

  const getColors = (): [string, string] => {
    switch (type) {
      case "success":
        return ["#00b09b", "#96c93d"];
      case "error":
        return ["#FF5F6D", "#FFC371"];
      case "info":
        return ["#2193b0", "#6dd5ed"];
      default:
        return ["#FF5F6D", "#FFC371"];
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={getColors()}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={getIcon()} size={60} color="#fff" />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <LinearGradient
                colors={getColors()}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 25,
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  content: {
    padding: 25,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  button: {
    width: "100%",
    height: 55,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

export default StatusModal;
