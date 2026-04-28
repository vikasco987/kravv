import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { rf, s, vs } from "../../utils/responsive";

import { useAuth } from "@clerk/clerk-expo";
import { getRecentCompanyProfile } from "../../services/companyService";
import { SimpleBill } from "../../utils/SimpleBill";

interface ItemWiseSalesDetailProps {
  itemName: string;
  bills: any[];
  onBack: () => void;
}

const ItemWiseSalesDetail = ({ itemName, bills, onBack }: ItemWiseSalesDetailProps) => {
  const { getToken } = useAuth();
  const [previewBill, setPreviewBill] = React.useState<any | null>(null);
  const [companyProfile, setCompanyProfile] = React.useState<any>(null);
  const [settings, setSettings] = React.useState({
    tax_enabled: false,
    tax_rate: 0,
    per_product_tax: false,
    discount_enabled: false,
    discount_rate: 0,
    service_charge_enabled: false,
    service_charge_rate: 0,
    service_gst_enabled: false,
    service_gst_rate: 0,
    delivery_charge_enabled: false,
    delivery_charge_amount: 0,
    delivery_gst_enabled: false,
    delivery_gst_rate: 0,
    packaging_charge_enabled: false,
    packaging_charge_amount: 0,
    packaging_gst_enabled: false,
    packaging_gst_rate: 0,
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedItems, setEditedItems] = React.useState<any[]>([]);
  const [editedSettings, setEditedSettings] = React.useState<any>(null);
  const viewShotRef = React.useRef<any>(null);

  React.useEffect(() => {
    const fetchInfo = async () => {
      const token = await getToken();
      if (token) {
        const profile = await getRecentCompanyProfile(token);
        setCompanyProfile(profile);
      }

      const s = await AsyncStorage.multiGet([
        'tax_enabled', 'tax_rate', 'per_product_tax',
        'discount_enabled', 'discount_rate',
        'service_charge_enabled', 'service_charge_rate',
        'service_gst_enabled', 'service_gst_rate',
        'delivery_charge_enabled', 'delivery_charge_amount',
        'delivery_gst_enabled', 'delivery_gst_rate',
        'packaging_charge_enabled', 'packaging_charge_amount',
        'packaging_gst_enabled', 'packaging_gst_rate'
      ]);
      const sMap: Record<string, string | null> = {};
      s.forEach(([k, v]) => sMap[k] = v);

      setSettings({
        tax_enabled: sMap['tax_enabled'] === 'true',
        tax_rate: parseFloat(sMap['tax_rate'] || "0"),
        per_product_tax: sMap['per_product_tax'] === 'true',
        discount_enabled: sMap['discount_enabled'] === 'true',
        discount_rate: parseFloat(sMap['discount_rate'] || "0"),
        service_charge_enabled: sMap['service_charge_enabled'] === 'true',
        service_charge_rate: parseFloat(sMap['service_charge_rate'] || "0"),
        service_gst_enabled: sMap['service_gst_enabled'] === 'true',
        service_gst_rate: parseFloat(sMap['service_gst_rate'] || "0"),
        delivery_charge_enabled: sMap['delivery_charge_enabled'] === 'true',
        delivery_charge_amount: parseFloat(sMap['delivery_charge_amount'] || "0"),
        delivery_gst_enabled: sMap['delivery_gst_enabled'] === 'true',
        delivery_gst_rate: parseFloat(sMap['delivery_gst_rate'] || "0"),
        packaging_charge_enabled: sMap['packaging_charge_enabled'] === 'true',
        packaging_charge_amount: parseFloat(sMap['packaging_charge_amount'] || "0"),
        packaging_gst_enabled: sMap['packaging_gst_enabled'] === 'true',
        packaging_gst_rate: parseFloat(sMap['packaging_gst_rate'] || "0"),
      });
    };
    fetchInfo();
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

  const handlePrint = async () => {
    if (!previewBill) return;
    try {
      Alert.alert("Re-print Bill", "Do you want to print this bill again?", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Print", 
          onPress: async () => {
            const token = await getToken();
            if (!token) return;
            
            // Map items to CartItem format for SimpleBill
            const cartItems = (previewBill.items || []).map((it: any) => ({
              id: it.productId || it.itemId || it._id || Math.random().toString(),
              name: it.name,
              price: it.price || it.rate || 0,
              quantity: it.qty || it.quantity || 1,
              gst: it.gst,
              taxType: it.taxType || it.taxStatus || "Without Tax"
            }));

            await SimpleBill(cartItems, token, "unknown", {
              billId: previewBill._id || previewBill.id,
              customerName: previewBill.customerName,
              phone: previewBill.customerPhone,
              tableName: previewBill.tableName,
              paymentMode: previewBill.paymentMode
            });
          }
        }
      ]);
    } catch (e) {
      console.error("Print error:", e);
    }
  };

  const handleEditOpen = () => {
    setEditedItems(JSON.parse(JSON.stringify(previewBill.items || [])));
    setEditedSettings({ ...settings });
    setIsEditing(true);
  };

  const updateItemQty = (index: number, newQty: number) => {
    const updated = [...editedItems];
    updated[index].qty = Math.max(0, newQty);
    updated[index].quantity = Math.max(0, newQty);
    setEditedItems(updated);
  };

  const updateItemPrice = (index: number, newPrice: string) => {
    const updated = [...editedItems];
    const parsed = parseFloat(newPrice);
    updated[index].rate = isNaN(parsed) ? 0 : parsed;
    updated[index].price = isNaN(parsed) ? 0 : parsed;
    setEditedItems(updated);
  };

  const updateItemName = (index: number, newName: string) => {
    const updated = [...editedItems];
    updated[index].name = newName;
    setEditedItems(updated);
  };

  const updateItemGst = (index: number, newGst: string) => {
    const updated = [...editedItems];
    updated[index].gst = parseFloat(newGst) || 0;
    setEditedItems(updated);
  };

  const saveEditedBill = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      if (editedSettings) {
        await AsyncStorage.multiSet([
          ['discount_rate', String(editedSettings.discount_rate || 0)],
          ['service_charge_rate', String(editedSettings.service_charge_rate || 0)],
          ['delivery_charge_amount', String(editedSettings.delivery_charge_amount || 0)],
          ['packaging_charge_amount', String(editedSettings.packaging_charge_amount || 0)],
          ['discount_enabled', String((editedSettings.discount_rate || 0) > 0)],
          ['service_charge_enabled', String((editedSettings.service_charge_rate || 0) > 0)],
          ['delivery_charge_enabled', String((editedSettings.delivery_charge_amount || 0) > 0)],
          ['packaging_charge_enabled', String((editedSettings.packaging_charge_amount || 0) > 0)],
        ]);
        setSettings(editedSettings);
      }

      const validItems = editedItems.filter((it: any) => (it.qty || it.quantity || 0) > 0);

      const cartItems = validItems.map((it: any) => ({
        id: it.productId || it.itemId || it._id || Math.random().toString(),
        name: it.name,
        price: it.rate !== undefined ? it.rate : (it.price || 0),
        quantity: it.qty !== undefined ? it.qty : (it.quantity || 1),
        gst: it.gst,
        taxType: it.taxType || it.taxStatus || "Without Tax"
      }));

      const res = await SimpleBill(cartItems, token, "unknown", {
        billId: previewBill._id || previewBill.id,
        customerName: previewBill.customerName,
        phone: previewBill.customerPhone,
        tableName: previewBill.tableName,
        paymentMode: previewBill.paymentMode,
        silent: true // Don't print by default on save
      });

      if (res.status === "success") {
        // Update local preview state
        setPreviewBill({ 
          ...previewBill, 
          items: validItems,
          discountAmount: 0,
          discount_amount: 0,
          discount: 0
        });
        setIsEditing(false);
        Alert.alert("Success", "Bill updated successfully.");
      }
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", "Could not save changes.");
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
    let totalItemsTaxable = 0;
    let totalItemsGstAtBase = 0;
    const ratesInCart = new Set<number>();

    (previewBill.items || []).forEach((it: any) => {
      const qty = Number(it.qty || it.quantity || 1);
      const rate = Number(it.rate || it.price || 0);
      const lineTotal = qty * rate;

      // Use the GST rate saved in the item record, or global setting if applicable
      let itemGstRate = settings.tax_enabled ? settings.tax_rate : (settings.per_product_tax ? ((it.gst !== undefined && it.gst !== null) ? Number(it.gst) : 0) : 0);

      ratesInCart.add(itemGstRate);

      let taxable = 0;
      let gst = 0;

      if (it.taxType === "With Tax" || it.taxStatus === "With Tax") {
        taxable = lineTotal / (1 + itemGstRate / 100);
        gst = lineTotal - taxable;
      } else {
        taxable = lineTotal;
        gst = (lineTotal * itemGstRate) / 100;
      }

      totalItemsTaxable += taxable;
      totalItemsGstAtBase += gst;
    });

    // 1. Subtotal (Sum of items)
    const subtotalValue = (previewBill.items || []).reduce((acc: number, it: any) => {
        const itQty = Number(it.qty || it.quantity || 1);
        const itRate = Number(it.rate || it.price || 0);
        return acc + (itQty * itRate);
    }, 0);

    // 2. Discount
    const savedDiscount = (previewBill.discountAmount ?? previewBill.discount_amount ?? previewBill.discount ?? 0);
    const discountAmount = (savedDiscount > 0)
      ? Number(savedDiscount)
      : (settings.discount_enabled ? (totalItemsTaxable * (settings.discount_rate / 100)) : 0);

    const taxableAfterDiscount = totalItemsTaxable - discountAmount;
    
    // 3. Main GST (on items)
    const avgGstRate = totalItemsTaxable > 0 ? (totalItemsGstAtBase / totalItemsTaxable) : 0;
    const finalGstAmount = taxableAfterDiscount * avgGstRate;

    // 4. Service Charge
    let serviceCharge = 0;
    let serviceGst = 0;
    if (settings.service_charge_enabled) {
      serviceCharge = settings.service_charge_rate;
      if (settings.service_gst_enabled) {
        serviceGst = (serviceCharge * settings.service_gst_rate) / 100;
      }
    }

    // 5. Delivery Charge
    let deliveryCharge = 0;
    let deliveryGst = 0;
    if (settings.delivery_charge_enabled) {
      deliveryCharge = settings.delivery_charge_amount;
      if (settings.delivery_gst_enabled) {
        deliveryGst = (deliveryCharge * settings.delivery_gst_rate) / 100;
      }
    }

    // 6. Packaging Charge
    let packagingCharge = 0;
    let packagingGst = 0;
    if (settings.packaging_charge_enabled) {
      packagingCharge = settings.packaging_charge_amount;
      if (settings.packaging_gst_enabled) {
        packagingGst = (packagingCharge * settings.packaging_gst_rate) / 100;
      }
    }

    // 7. Grand Total
    const displayTotal = taxableAfterDiscount + finalGstAmount + serviceCharge + serviceGst + deliveryCharge + deliveryGst + packagingCharge + packagingGst;

    // GST Label
    let gstLabel = "(0%)";
    const uniqueRates = Array.from(ratesInCart);
    if (uniqueRates.length === 1) {
      gstLabel = `(${uniqueRates[0]}%)`;
    } else if (uniqueRates.length > 1) {
      gstLabel = "(Multi)";
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
        <View style={[styles.header, { backgroundColor: '#333' }]}>
          <TouchableOpacity onPress={() => setPreviewBill(null)} style={{ paddingRight: s(15) }}>
            <Ionicons name="arrow-back" size={rf(28)} color="#fff" />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { marginLeft: 0 }]} numberOfLines={1}>Bill Photo</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(12) }}>
            <TouchableOpacity onPress={handlePrint} style={styles.iconActionBtn}>
              <Ionicons name="print-outline" size={rf(22)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEditOpen} style={styles.iconActionBtn}>
              <Ionicons name="create-outline" size={rf(22)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={downloadBill}
            >
              <Ionicons name="download-outline" size={rf(22)} color="#fff" />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isEditing && (
            <View style={styles.editOverlay}>
                <View style={styles.editContainer}>
                    <Text style={styles.editTitle}>Edit Bill Items & Charges</Text>
                    <ScrollView style={{ maxHeight: vs(450) }}>
                        {editedItems.map((it: any, idx: number) => (
                            <View key={idx} style={[styles.editRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                                <TextInput
                                    style={[styles.priceInput, { width: '100%', marginBottom: vs(10) }]}
                                    value={it.name}
                                    onChangeText={(val) => updateItemName(idx, val)}
                                    placeholder="Item Name"
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
                                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: rf(14), color: '#666', marginRight: s(5) }}>₹</Text>
                                        <TextInput
                                          style={[styles.priceInput, { minWidth: s(60) }]}
                                          value={String(it.rate !== undefined ? it.rate : (it.price || 0))}
                                          keyboardType="numeric"
                                          onChangeText={(val) => updateItemPrice(idx, val)}
                                          selectTextOnFocus
                                        />
                                     </View>
                                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: rf(12), color: '#666', marginRight: s(5) }}>GST%</Text>
                                        <TextInput
                                          style={[styles.priceInput, { minWidth: s(50) }]}
                                          value={String(it.gst !== undefined ? it.gst : 0)}
                                          keyboardType="numeric"
                                          onChangeText={(val) => updateItemGst(idx, val)}
                                          selectTextOnFocus
                                        />
                                     </View>
                                   </View>
                                   <View style={styles.editControls}>
                                       <TouchableOpacity onPress={() => updateItemQty(idx, (it.qty !== undefined ? it.qty : (it.quantity || 1)) - 1)} style={styles.qtyBtn}>
                                           <Ionicons name="remove" size={rf(18)} color="#4F46E5" />
                                       </TouchableOpacity>
                                       <Text style={styles.qtyText}>{it.qty !== undefined ? it.qty : (it.quantity || 1)}</Text>
                                       <TouchableOpacity onPress={() => updateItemQty(idx, (it.qty !== undefined ? it.qty : (it.quantity || 1)) + 1)} style={styles.qtyBtn}>
                                           <Ionicons name="add" size={rf(18)} color="#4F46E5" />
                                       </TouchableOpacity>
                                   </View>
                                </View>
                            </View>
                        ))}

                        {editedSettings && (
                          <View style={{ marginTop: vs(15), borderTopWidth: 1, borderColor: '#ccc', paddingTop: vs(15), paddingBottom: vs(20) }}>
                             <Text style={[styles.editTitle, { fontSize: rf(16), textAlign: 'left', marginBottom: vs(15) }]}>Extra Charges</Text>
                             
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10), alignItems: 'center' }}>
                                <Text style={{ fontSize: rf(14), color: '#333', fontWeight: '600' }}>Discount (%)</Text>
                                <TextInput 
                                   style={[styles.priceInput, { minWidth: s(80) }]} 
                                   value={String(editedSettings.discount_rate || 0)} 
                                   keyboardType="numeric"
                                   onChangeText={(val) => setEditedSettings({...editedSettings, discount_rate: parseFloat(val) || 0, discount_enabled: (parseFloat(val) || 0) > 0})}
                                   selectTextOnFocus
                                />
                             </View>
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10), alignItems: 'center' }}>
                                <Text style={{ fontSize: rf(14), color: '#333', fontWeight: '600' }}>Service Charge (₹)</Text>
                                <TextInput 
                                   style={[styles.priceInput, { minWidth: s(80) }]} 
                                   value={String(editedSettings.service_charge_rate || 0)} 
                                   keyboardType="numeric"
                                   onChangeText={(val) => setEditedSettings({...editedSettings, service_charge_rate: parseFloat(val) || 0, service_charge_enabled: (parseFloat(val) || 0) > 0})}
                                   selectTextOnFocus
                                />
                             </View>
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10), alignItems: 'center' }}>
                                <Text style={{ fontSize: rf(14), color: '#333', fontWeight: '600' }}>Delivery Charge (₹)</Text>
                                <TextInput 
                                   style={[styles.priceInput, { minWidth: s(80) }]} 
                                   value={String(editedSettings.delivery_charge_amount || 0)} 
                                   keyboardType="numeric"
                                   onChangeText={(val) => setEditedSettings({...editedSettings, delivery_charge_amount: parseFloat(val) || 0, delivery_charge_enabled: (parseFloat(val) || 0) > 0})}
                                   selectTextOnFocus
                                />
                             </View>
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10), alignItems: 'center' }}>
                                <Text style={{ fontSize: rf(14), color: '#333', fontWeight: '600' }}>Packaging Charge (₹)</Text>
                                <TextInput 
                                   style={[styles.priceInput, { minWidth: s(80) }]} 
                                   value={String(editedSettings.packaging_charge_amount || 0)} 
                                   keyboardType="numeric"
                                   onChangeText={(val) => setEditedSettings({...editedSettings, packaging_charge_amount: parseFloat(val) || 0, packaging_charge_enabled: (parseFloat(val) || 0) > 0})}
                                   selectTextOnFocus
                                />
                             </View>
                          </View>
                        )}
                    </ScrollView>
                    <View style={styles.editActions}>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={[styles.editActionBtn, { backgroundColor: '#F3F4F6' }]}>
                            <Text style={{ color: '#666', fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveEditedBill} style={[styles.editActionBtn, { backgroundColor: '#4F46E5' }]}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )}

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

            {(previewBill.items || []).map((it: any, idx: number) => {
              let effGst = settings.tax_enabled ? settings.tax_rate : (settings.per_product_tax ? ((it.gst !== undefined && it.gst !== null) ? Number(it.gst) : 0) : 0);

              return (
              <View key={idx} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.tableCol}>{it.name}</Text>
                  {effGst > 0 ? <Text style={[styles.receiptMeta, { fontSize: rf(10), color: '#666', textAlign: 'left' }]}>GST: {effGst}%</Text> : null}
                </View>
                <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>{it.qty}</Text>
                <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>₹{((it.qty || 1) * (it.rate || it.price || 0)).toFixed(2)}</Text>
              </View>
            )})}

            <View style={styles.receiptDivider} />

            {/* Totals */}
            <View style={styles.billTotals}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Subtotal:</Text>
                <Text style={styles.totalLineValue}>₹{subtotalValue.toFixed(2)}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.totalLine}>
                  <Text style={styles.totalLineLabel}>Discount ({settings.discount_rate}%):</Text>
                  <Text style={styles.totalLineValue}>-₹{discountAmount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Taxable Amount:</Text>
                <Text style={styles.totalLineValue}>₹{taxableAfterDiscount.toFixed(2)}</Text>
              </View>

              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>GST {gstLabel}:</Text>
                <Text style={styles.totalLineValue}>₹{finalGstAmount.toFixed(2)}</Text>
              </View>

              {serviceCharge > 0 && (
                <>
                  <View style={styles.totalLine}>
                    <Text style={styles.totalLineLabel}>Service Charge:</Text>
                    <Text style={styles.totalLineValue}>₹{serviceCharge.toFixed(2)}</Text>
                  </View>
                  {serviceGst > 0 && (
                    <View style={styles.totalLine}>
                      <Text style={styles.totalLineLabel}>GST on Serv ({settings.service_gst_rate}%):</Text>
                      <Text style={styles.totalLineValue}>₹{serviceGst.toFixed(2)}</Text>
                    </View>
                  )}
                </>
              )}

              {deliveryCharge > 0 && (
                <>
                  <View style={styles.totalLine}>
                    <Text style={styles.totalLineLabel}>Delivery Charge:</Text>
                    <Text style={styles.totalLineValue}>₹{deliveryCharge.toFixed(2)}</Text>
                  </View>
                  {deliveryGst > 0 && (
                    <View style={styles.totalLine}>
                      <Text style={styles.totalLineLabel}>GST on Del ({settings.delivery_gst_rate}%):</Text>
                      <Text style={styles.totalLineValue}>₹{deliveryGst.toFixed(2)}</Text>
                    </View>
                  )}
                </>
              )}

              {packagingCharge > 0 && (
                <>
                  <View style={styles.totalLine}>
                    <Text style={styles.totalLineLabel}>Packaging Charge:</Text>
                    <Text style={styles.totalLineValue}>₹{packagingCharge.toFixed(2)}</Text>
                  </View>
                  {packagingGst > 0 && (
                    <View style={styles.totalLine}>
                      <Text style={styles.totalLineLabel}>GST on Pack ({settings.packaging_gst_rate}%):</Text>
                      <Text style={styles.totalLineValue}>₹{packagingGst.toFixed(2)}</Text>
                    </View>
                  )}
                </>
              )}

              <View style={[styles.receiptDivider, { borderBottomWidth: 1 }]} />
              <View style={styles.totalLine}>
                <Text style={[styles.totalLineLabel, { fontWeight: 'bold' }]}>TOTAL:</Text>
                <Text style={[styles.totalLineValue, { fontWeight: 'bold' }]}>₹{displayTotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.receiptDivider} />
            
            {/* UPI QR Code Section */}
            <View style={styles.qrContainer}>
              <Text style={styles.qrLabel}>Scan to Pay</Text>
              <QRCode
                value={`upi://pay?pa=${companyProfile?.upiId || "kravy@upi"}&pn=${companyProfile?.companyName || "KRAVY"}&am=${displayTotal.toFixed(2)}&cu=INR`}
                size={s(120)}
              />
              <Text style={styles.upiId}>{companyProfile?.upiId || "kravy@upi"}</Text>
            </View>

            <View style={[styles.receiptDivider, { marginTop: vs(20) }]} />
            <Text style={styles.thanksText}>Thank You! Visit Again</Text>
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
            const lineTotal = qty * price;

            // 🔥 FIX: Use the GST rate considering global settings vs per product
            let itemGstRate = settings.tax_enabled ? settings.tax_rate : (settings.per_product_tax ? ((sale.gst !== undefined && sale.gst !== null) ? Number(sale.gst) : 0) : 0);

            let taxable = 0;
            if (sale.taxType === "With Tax" || sale.taxStatus === "With Tax") {
              taxable = lineTotal / (1 + itemGstRate / 100);
            } else {
              taxable = lineTotal;
            }

            // Calculate proportional discount and service charge based on saved totals or current settings
            const billDiscSaved = Number(sale.fullBill?.discountAmount ?? sale.fullBill?.discount_amount ?? sale.fullBill?.discount ?? 0);
            
            // We need the items sum to calculate rates for this specific item's share
            const itemsTaxableSum = (sale.fullBill?.items || []).reduce((acc: number, it: any) => {
                const itQty = Number(it.qty || it.quantity || 1);
                const itRate = Number(it.rate || it.price || 0);
                const itLTotal = itQty * itRate;
                let itGst = settings.tax_enabled ? settings.tax_rate : (settings.per_product_tax ? ((it.gst !== undefined && it.gst !== null) ? Number(it.gst) : 0) : 0);
                
                if (it.taxType === "With Tax" || it.taxStatus === "With Tax") {
                    return acc + (itLTotal / (1 + itGst / 100));
                }
                return acc + itLTotal;
            }, 0);

            // Proportional Discount
            const itemD = (billDiscSaved > 0 && itemsTaxableSum > 0)
              ? (taxable * (billDiscSaved / itemsTaxableSum))
              : (settings.discount_enabled ? (taxable * (settings.discount_rate / 100)) : 0);
              
            const tAfterD = taxable - itemD;
            
            // Proportional Service Charge (Always recalculate based on current settings for consistency in reports)
            const itemSC = settings.service_charge_enabled 
              ? (tAfterD * (settings.service_charge_rate / 100))
              : 0;
            
            const netT = tAfterD + itemSC;
            
            // GST (Recalculated for this specific item's share of the net total)
            const finalGst = netT * (itemGstRate / 100);
            const finalItemTotal = netT + finalGst;

            return (
              <View key={index} style={styles.saleCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.billIdText}>Bill ID: {sale.billId}</Text>
                  <Text style={styles.timeText}>{formattedTime} | {formattedDate}</Text>
                </View>

                <View style={styles.divider} />

                <View style={[styles.detailsGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                  <View style={[styles.detailItem, { width: '33%', marginBottom: vs(10) }]}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>₹{price.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.detailItem, { width: '33%', marginBottom: vs(10) }]}>
                    <Text style={styles.detailLabel}>Qty</Text>
                    <Text style={styles.detailValue}>{qty}</Text>
                  </View>
                  <View style={[styles.detailItem, { width: '33%', marginBottom: vs(10) }]}>
                    <Text style={styles.detailLabel}>Subtotal</Text>
                    <Text style={styles.detailValue}>₹{taxable.toFixed(2)}</Text>
                  </View>

                  {/* Row 2: Discount, SC, GST */}
                  <View style={[styles.detailItem, { width: '33%', marginBottom: vs(10) }]}>
                    <Text style={styles.detailLabel}>Discount</Text>
                    <Text style={[styles.detailValue, { color: itemD > 0 ? '#10B981' : '#666' }]}>
                      {itemD > 0 ? `-₹${itemD.toFixed(2)}` : '₹0.00'}
                    </Text>
                  </View>
                  <View style={[styles.detailItem, { width: '33%', marginBottom: vs(10) }]}>
                    <Text style={styles.detailLabel}>Srv. Charge</Text>
                    <Text style={styles.detailValue}>₹{itemSC.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.detailItem, { width: '33%', marginBottom: vs(10) }]}>
                    <Text style={styles.detailLabel}>GST ({itemGstRate}%)</Text>
                    <Text style={styles.detailValue}>₹{finalGst.toFixed(2)}</Text>
                  </View>
                </View>

                {(itemD > 0 || itemSC > 0) && (
                  <View style={[styles.totalRow, { backgroundColor: 'transparent', paddingVertical: 0, marginBottom: vs(5) }]}>
                    <Text style={styles.detailLabel}>Taxable Amount</Text>
                    <Text style={[styles.detailValue, { fontSize: rf(13) }]}>₹{netT.toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Price</Text>
                  <Text style={styles.totalValue}>₹{finalItemTotal.toFixed(2)}</Text>
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
    fontSize: rf(14),
    fontWeight: '500',
    color: '#000',
    marginTop: vs(5)
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: vs(10)
  },
  qrLabel: {
    fontSize: rf(12),
    color: '#000',
    marginBottom: vs(10)
  },
  upiId: {
    fontSize: rf(10),
    color: '#333',
    marginTop: vs(10)
  },
  iconActionBtn: {
    padding: s(8),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: s(8),
  },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(20)
  },
  editContainer: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: s(20),
    padding: s(20),
    maxHeight: '80%'
  },
  editTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: vs(20),
    textAlign: 'center'
  },
  editRow: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: s(8),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    fontSize: rf(14),
    minWidth: s(80),
    color: '#1F2937',
    fontWeight: '600'
  },
  editItemName: {
    fontSize: rf(15),
    color: '#374151',
    fontWeight: '600',
    flex: 1
  },
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(15)
  },
  qtyBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(8),
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  qtyText: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: s(20),
    textAlign: 'center'
  },
  editActions: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: vs(25)
  },
  editActionBtn: {
    flex: 1,
    height: vs(50),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ItemWiseSalesDetail;
