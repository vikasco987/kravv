import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import { rf, s, vs } from "../../utils/responsive";

interface Props {
  onClose: () => void;
  businessName: string;
  tableId?: string;
  tableName?: string;
  qrUrl: string;
}

const { width } = Dimensions.get("window");

export default function QRMenuTemplateView({ onClose, businessName, tableName, qrUrl }: Props) {
  const viewShotRef = useRef<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dynamic Fields
  const [customName, setCustomName] = useState(businessName || "My Restaurant");
  const [tagline, setTagline] = useState("A Place to Feel at Home");
  const [logoEmoji, setLogoEmoji] = useState("☕");
  const [customTableNo, setCustomTableNo] = useState(tableName || "00");
  const [showTableNo, setShowTableNo] = useState(true);

  const emojis = ["☕", "🍔", "🍕", "🥘", "🍦", "🍗"];

  const handleDownload = async () => {
    if (!viewShotRef.current) return;
    setIsDownloading(true);
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share or Save QR Menu",
        UTI: "public.png"
      });
    } catch (err) {
      console.log("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>QR Template Editor</Text>
          <Text style={styles.headerSub}>Customize your menu card</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={rf(20)} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
        {/* PREVIEW SECTION */}
        <View style={styles.previewSection}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <LinearGradient
              colors={["#0f0c29", "#302b63", "#24243e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.logoEmoji}>{logoEmoji}</Text>
                <Text style={styles.cardTitle}>{customName}</Text>
                <Text style={styles.cardTagline}>{tagline}</Text>
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerStar}>❋</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.scanText}>📱 SCAN TO VIEW OUR MENU</Text>

              {/* QR Section */}
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  {/* Corners */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  <QRCode value={qrUrl} size={s(150)} backgroundColor="#fff" />
                </View>
              </View>

              {/* Info */}
              <View style={styles.infoPill}>
                <Text style={styles.infoPillIcon}>📷</Text>
                <Text style={styles.infoPillText}>POINT CAMERA TO ORDER</Text>
              </View>

              {/* Features */}
              <View style={styles.featuresRow}>
                {[
                  { i: "🍵", l: "CHAI" },
                  { i: "🍕", l: "PIZZA" },
                  { i: "🍜", l: "SNACKS" },
                  { i: "🍽️", l: "THALI" }
                ].map((f, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Text style={styles.featureIcon}>{f.i}</Text>
                    <Text style={styles.featureLabel}>{f.l}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.bottomDivider} />

              <Text style={styles.footerText}>
                POWERED BY <Text style={styles.footerBrand}>{customName}</Text> {showTableNo && `• TABLE ${customTableNo}`}
              </Text>
            </LinearGradient>
          </ViewShot>
        </View>

        {/* EDITOR SECTION */}
        <View style={styles.editorSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>RESTAURANT NAME</Text>
            <TextInput
              style={styles.input}
              value={customName}
              onChangeText={setCustomName}
              placeholder="e.g. The Grand Cafe"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
              <Text style={styles.label}>TABLE NUMBER</Text>
              <TextInput
                style={styles.input}
                value={customTableNo}
                onChangeText={setCustomTableNo}
                placeholder="e.g. 01"
                placeholderTextColor="#475569"
              />
            </View>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                onPress={() => setShowTableNo(!showTableNo)}
                style={[styles.toggleBtn, showTableNo && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleBtnText, showTableNo && styles.toggleBtnTextActive]}>
                  {showTableNo ? "HIDE TABLE" : "SHOW TABLE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SLOGAN / TAGLINE</Text>
            <TextInput
              style={styles.input}
              value={tagline}
              onChangeText={setTagline}
              placeholder="e.g. Best coffee in town"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>LOGO EMOJI</Text>
            <View style={styles.emojiRow}>
              {emojis.map(e => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setLogoEmoji(e)}
                  style={[styles.emojiBtn, logoEmoji === e && styles.emojiBtnActive]}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <Feather name="download" size={rf(16)} color="#0F172A" />
                  <Text style={styles.downloadBtnText}>DOWNLOAD MENU CARD</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", // Slate 900
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingTop: Platform.OS === "android" ? vs(50) : vs(20),
    paddingBottom: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTitle: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#fff",
    textTransform: "uppercase",
    fontStyle: "italic",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: vs(2),
  },
  closeBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: s(20),
    paddingBottom: vs(40),
  },
  previewSection: {
    alignItems: "center",
    marginBottom: vs(24),
  },
  card: {
    width: width - s(40),
    maxWidth: 400,
    borderRadius: s(32),
    padding: s(24),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: vs(8),
  },
  logoEmoji: {
    fontSize: rf(32),
    marginBottom: vs(8),
  },
  cardTitle: {
    fontSize: rf(20),
    fontWeight: "900",
    color: "#FBBF24", // yellow-400
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: vs(4),
  },
  cardTagline: {
    fontSize: rf(8),
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: vs(16),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(251, 191, 36, 0.3)",
  },
  dividerStar: {
    color: "#FBBF24",
    fontSize: rf(10),
    marginHorizontal: s(8),
  },
  scanText: {
    fontSize: rf(9),
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: vs(16),
  },
  qrContainer: {
    marginBottom: vs(24),
  },
  qrBox: {
    backgroundColor: "#fff",
    borderRadius: s(24),
    padding: s(16),
    borderWidth: 4,
    borderColor: "rgba(251, 191, 36, 0.2)",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: s(20),
    height: s(20),
    borderColor: "#FBBF24",
    borderWidth: 0,
  },
  topLeft: {
    top: -4, left: -4,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderTopLeftRadius: s(16),
  },
  topRight: {
    top: -4, right: -4,
    borderTopWidth: 4, borderRightWidth: 4,
    borderTopRightRadius: s(16),
  },
  bottomLeft: {
    bottom: -4, left: -4,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderBottomLeftRadius: s(16),
  },
  bottomRight: {
    bottom: -4, right: -4,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderBottomRightRadius: s(16),
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.2)",
    borderRadius: s(20),
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    marginBottom: vs(24),
    gap: s(6),
  },
  infoPillIcon: {
    fontSize: rf(12),
  },
  infoPillText: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: s(10),
    marginBottom: vs(20),
  },
  featureItem: {
    alignItems: "center",
    opacity: 0.6,
  },
  featureIcon: {
    fontSize: rf(18),
    marginBottom: vs(4),
  },
  featureLabel: {
    fontSize: rf(6),
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 0.5,
  },
  bottomDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: vs(12),
  },
  footerText: {
    fontSize: rf(7),
    color: "rgba(255, 255, 255, 0.3)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  footerBrand: {
    color: "rgba(251, 191, 36, 0.6)",
    fontWeight: "900",
  },
  editorSection: {
    backgroundColor: "#1E293B",
    borderRadius: s(24),
    padding: s(20),
  },
  inputGroup: {
    marginBottom: vs(16),
  },
  row: {
    flexDirection: "row",
    gap: s(12),
    marginBottom: vs(16),
  },
  label: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: vs(8),
  },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: s(12),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    color: "#fff",
    fontSize: rf(11),
    fontWeight: "600",
  },
  toggleContainer: {
    justifyContent: "flex-end",
  },
  toggleBtn: {
    height: vs(42),
    paddingHorizontal: s(12),
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: s(12),
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#FBBF24",
    borderColor: "#FBBF24",
  },
  toggleBtnText: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  toggleBtnTextActive: {
    color: "#0F172A",
  },
  emojiRow: {
    flexDirection: "row",
    gap: s(8),
  },
  emojiBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiBtnActive: {
    backgroundColor: "#FBBF24",
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: rf(16),
  },
  actionRow: {
    marginTop: vs(16),
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    backgroundColor: "#FBBF24",
    paddingVertical: vs(16),
    borderRadius: s(16),
  },
  downloadBtnText: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 2,
  }
});
