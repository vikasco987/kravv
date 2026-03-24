import { Ionicons } from "@expo/vector-icons";
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { rf, s, vs } from "../../utils/responsive";

import { useAuth } from "@clerk/clerk-expo";
import { getRecentCompanyProfile } from "../../services/companyService";

interface ItemWiseSalesDetailProps {
  itemName: string;
  bills: any[];
  onBack: () => void;
}

const ItemWiseSalesDetail = ({ itemName, bills, onBack }: ItemWiseSalesDetailProps) => {
  const { getToken } = useAuth();
  const [previewBill, setPreviewBill] = React.useState<any | null>(null);
  const [companyProfile, setCompanyProfile] = React.useState<any>(null);
  const viewShotRef = React.useRef<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const token = await getToken();
      if (token) {
        const profile = await getRecentCompanyProfile(token);
        setCompanyProfile(profile);
      }
    };
    fetchProfile();
  }, []);

  const downloadBill = async () => {
    try {
      if (!viewShotRef.current) return;
      const uri = await captureRef(viewShotRef, {
        format: "jpg",
        quality: 0.9,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Download failed:", error);
      Alert.alert("Error", "Could not capture bill image.");
    }
  };

  // Find all instances of this item in today's bills
  const itemSalesList = bills.flatMap(bill => {
    const foundItems = (bill.items || []).filter((it: any) => it.name === itemName);
    return foundItems.map((it: any) => ({
      ...it,
      billId: bill.billNumber || bill._id || "N/A",
      createdAt: bill.createdAt,
      totalBillAmount: bill.total,
      fullBill: bill // Keep the original bill record for preview
    }));
  });

  // If we are in "Bill Photo" mode (Preview)
  if (previewBill) {
    let calcSubtotal = 0;
    let calcTax = 0;
    (previewBill.items || []).forEach((it: any) => {
       const qty = Number(it.qty || it.quantity || 1);
       const rate = Number(it.rate || it.price || 0);
       const gst = Number(it.gst || 0);
       
       if (it.taxableAmount !== undefined && it.gstPaid !== undefined) {
          calcSubtotal += Number(it.taxableAmount);
          calcTax += Number(it.gstPaid);
       } else {
          // Assume rate * qty is taxable (Exclusive) as per user's 40 + 28% example
          const taxable = qty * rate;
          const tax = (taxable * gst) / 100;
          calcSubtotal += taxable;
          calcTax += tax;
       }
    });

    // Sum of subtotal and tax for exact total match
    const displayTotal = calcSubtotal + calcTax;

    return (
      <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
        <View style={[styles.header, { backgroundColor: '#333' }]}>
          <TouchableOpacity onPress={() => setPreviewBill(null)} style={{ paddingRight: s(15) }}>
             <Ionicons name="arrow-back" size={rf(28)} color="#fff" />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { marginLeft: 0 }]} numberOfLines={1}>Bill Photo</Text>

          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={downloadBill}
          >
            <Ionicons name="download-outline" size={rf(22)} color="#fff" />
            <Text style={styles.pdfBtnText}>PDF</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.billPreviewContainer}>
          <View ref={viewShotRef} style={styles.receiptPaper}>
            {/* Receipt Header */}
            <View style={styles.center}>
              <Text style={styles.receiptBrand}>{companyProfile?.companyName || "KRAVY RESTRO"}</Text>
              <Text style={styles.receiptMeta}>{companyProfile?.companyAddress || "New Delhi, India"}</Text>
              <Text style={styles.receiptMeta}>Mob: {companyProfile?.companyPhone || "+91 9999999999"}</Text>
              {companyProfile?.gstNumber ? (
                <Text style={[styles.receiptMeta, { fontWeight: 'bold', marginTop: vs(5) }]}>GSTIN: {companyProfile.gstNumber}</Text>
              ) : null}
            </View>

            <View style={styles.receiptDivider} />

            {/* Bill Meta */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Bill No:</Text>
              <Text style={styles.metaValue}>{previewBill.billNumber || previewBill._id}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{new Date(previewBill.createdAt).toLocaleString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Order Type:</Text>
              <Text style={styles.metaValue}>{previewBill.tableName || "Dine-in"}</Text>
            </View>

            <View style={styles.receiptDivider} />

            {/* Items Table */}
            <View style={styles.tableHead}>
              <Text style={[styles.tableCol, { flex: 2, fontWeight: 'bold' }]}>Item</Text>
              <Text style={[styles.tableCol, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>Qty</Text>
              <Text style={[styles.tableCol, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>Amt</Text>
            </View>

            <View style={[styles.receiptDivider, { borderBottomWidth: 0.5 }]} />

            {(previewBill.items || []).map((it: any, idx: number) => (
              <View key={idx} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.tableCol}>{it.name}</Text>
                  {it.gst ? <Text style={[styles.receiptMeta, { fontSize: rf(10), color: '#666', textAlign: 'left' }]}>GST: {it.gst}%</Text> : null}
                </View>
                <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>{it.qty}</Text>
                <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>₹{((it.qty || 1) * (it.rate || it.price || 0)).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.receiptDivider} />

            {/* Totals */}
            <View style={styles.billTotals}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Subtotal</Text>
                <Text style={styles.totalLineValue}>₹{calcSubtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Tax / GST</Text>
                <Text style={styles.totalLineValue}>₹{calcTax.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalLine, { marginTop: vs(10), borderTopWidth: 1, paddingTop: vs(10) }]}>
                <Text style={[styles.totalLineLabel, { fontSize: rf(18), fontWeight: 'bold', color: '#000' }]}>GRAND TOTAL</Text>
                <Text style={[styles.totalLineValue, { fontSize: rf(20), fontWeight: 'bold', color: '#000' }]}>₹{displayTotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={[styles.receiptDivider, { marginTop: vs(30) }]} />
            <Text style={styles.thanksText}>THANK YOU! VISIT AGAIN</Text>
            <Text style={styles.powerBy}>Powered by Kravy</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={rf(28)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{itemName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.summaryText}>Total {itemSalesList.length} sales found</Text>

        {itemSalesList.length > 0 ? (
          itemSalesList.map((sale, index) => {
            const dateObj = new Date(sale.createdAt);
            const formattedDate = dateObj.toLocaleDateString();
            const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const qty = Number(sale.qty || sale.quantity || 0);
            const price = Number(sale.rate || sale.price || 0);
            const gst = Number(sale.gst || 0);
            const total = qty * price;
            const gstAmount = (total * gst) / 100;

            return (
              <View key={index} style={styles.saleCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.billIdText}>Bill ID: {sale.billId}</Text>
                  <Text style={styles.timeText}>{formattedTime} | {formattedDate}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>₹{price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Qty</Text>
                    <Text style={styles.detailValue}>{qty}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>GST ({gst}%)</Text>
                    <Text style={styles.detailValue}>₹{gstAmount.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Price</Text>
                  <Text style={styles.totalValue}>₹{(total + gstAmount).toFixed(2)}</Text>
                </View>

                {/* Preview Button */}
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => setPreviewBill(sale.fullBill)}
                >
                  <Ionicons name="eye-outline" size={rf(18)} color="#fff" style={{ marginRight: s(5) }} />
                  <Text style={styles.previewBtnText}>Preview Bill</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.center}>
            <Text style={{ color: '#666' }}>No details found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: vs(100),
    paddingTop: vs(30),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    backgroundColor: '#4F46E5'
  },
  headerTitle: {
    marginLeft: s(20),
    color: '#fff',
    fontSize: rf(18),
    fontWeight: 'bold',
    flex: 1
  },
  container: {
    padding: s(20),
    paddingBottom: vs(80)
  },
  summaryText: {
    fontSize: rf(14),
    color: '#6B7280',
    marginBottom: vs(15),
    fontWeight: '500'
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: s(16),
    padding: s(20),
    marginBottom: vs(15),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12)
  },
  billIdText: {
    fontSize: rf(14),
    color: '#1F2937',
    fontWeight: 'bold'
  },
  timeText: {
    fontSize: rf(12),
    color: '#9CA3AF'
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: vs(12)
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(12)
  },
  detailItem: {
    alignItems: 'flex-start'
  },
  detailLabel: {
    fontSize: rf(11),
    color: '#9CA3AF',
    marginBottom: vs(4),
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: rf(15),
    color: '#1F2937',
    fontWeight: '600'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: s(10),
    borderRadius: s(8),
    marginBottom: vs(15)
  },
  totalLabel: {
    fontSize: rf(14),
    color: '#4F46E5',
    fontWeight: 'bold'
  },
  totalValue: {
    fontSize: rf(18),
    color: '#4F46E5',
    fontWeight: '900'
  },
  previewBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
    borderRadius: s(10)
  },
  previewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: rf(14)
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: s(8),
    marginRight: s(20)
  },
  pdfBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: rf(14),
    marginLeft: s(5)
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Bill Photo Preview Styles
  billPreviewContainer: {
    padding: s(20),
    paddingBottom: vs(100),
    alignItems: 'center'
  },
  receiptPaper: {
    backgroundColor: '#fff',
    width: '100%',
    padding: s(20),
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    borderRadius: 2
  },
  receiptBrand: {
    fontSize: rf(26),
    fontWeight: '900',
    color: '#000',
    marginBottom: vs(5)
  },
  receiptMeta: {
    fontSize: rf(12),
    color: '#333'
  },
  receiptDivider: {
    borderBottomWidth: 1.5,
    borderColor: '#000',
    borderStyle: 'dashed',
    marginVertical: vs(15)
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(5)
  },
  metaLabel: {
    fontSize: rf(13),
    color: '#555',
    fontWeight: '600'
  },
  metaValue: {
    fontSize: rf(13),
    color: '#000',
    fontWeight: '700'
  },
  tableHead: {
    flexDirection: 'row',
    paddingBottom: vs(5)
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: vs(8)
  },
  tableCol: {
    fontSize: rf(14),
    color: '#000'
  },
  billTotals: {
    marginTop: vs(15)
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(5)
  },
  totalLineLabel: {
    fontSize: rf(15),
    color: '#333'
  },
  totalLineValue: {
    fontSize: rf(15),
    color: '#000',
    fontWeight: '600'
  },
  thanksText: {
    textAlign: 'center',
    fontSize: rf(16),
    fontWeight: '800',
    color: '#000',
    marginTop: vs(10)
  },
  powerBy: {
    textAlign: 'center',
    fontSize: rf(10),
    color: '#888',
    marginTop: vs(10),
    fontStyle: 'italic'
  }
});

export default ItemWiseSalesDetail;
