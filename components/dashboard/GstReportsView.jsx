import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

const screenWidth = Dimensions.get("window").width;

const allColumns = [
  { key: "billNumber", label: "Invoice No" },
  { key: "date", label: "Date" },
  { key: "customerName", label: "Buyer Name" },
  { key: "buyerGSTIN", label: "Buyer GSTIN" },
  { key: "placeOfSupply", label: "Place of Supply" },
  { key: "rates", label: "Rate %" },
  { key: "hsns", label: "HSN Code" },
  { key: "taxable", label: "Taxable (₹)" },
  { key: "cgst", label: "CGST (₹)" },
  { key: "sgst", label: "SGST (₹)" },
  { key: "igst", label: "IGST (₹)" },
  { key: "grandTotal", label: "Total (₹)" },
  { key: "type", label: "Type" },
];

const GstReportsView = ({ onClose, allBills = [], userProfile = {} }) => {
  const [activeTab, setActiveTab] = useState("GSTR-1");
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([
    "billNumber", "date", "customerName", "buyerGSTIN", "rates", "hsns", "taxable", "cgst", "sgst", "igst", "grandTotal", "type"
  ]);

  // Default to "This Month" to match the website exactly
  const [dateRange, setDateRange] = useState("this_month");

  const [gstSettings, setGstSettings] = useState({
    taxEnabled: false,
    taxRate: 0,
    perProductTaxEnabled: false
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await AsyncStorage.multiGet([
          "tax_enabled",
          "tax_rate",
          "per_product_tax"
        ]);
        const sMap = {};
        settings.forEach(([key, val]) => (sMap[key] = val));

        setGstSettings({
          taxEnabled: sMap["tax_enabled"] === "true",
          taxRate: parseFloat(sMap["tax_rate"] || "0"),
          perProductTaxEnabled: sMap["per_product_tax"] === "true"
        });
      } catch (err) {
        console.error("Error fetching GST settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const data = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (dateRange === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // fallback for last 30 days
      startDate.setDate(endDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const businessState = (userProfile?.state || "").trim().toLowerCase();

    // Use AsyncStorage values as primary for the app
    const globalGstRate = gstSettings.taxEnabled ? gstSettings.taxRate : (userProfile?.taxEnabled ? (userProfile?.taxRate || 0) : 0);
    const perProductEnabled = gstSettings.perProductTaxEnabled || (userProfile?.perProductTaxEnabled ?? false);

    const gstr1 = [];
    const hsnMap = new Map();
    const dailyMap = new Map();

    let totalTaxableAll = 0;
    let totalCgstAll = 0;
    let totalSgstAll = 0;
    let totalIgstAll = 0;
    let totalGstAll = 0;

    allBills.forEach((bill) => {
      if (bill.isDeleted || bill.isHeld) return;
      const billDate = new Date(bill.createdAt || bill.date);
      if (billDate < startDate || billDate > endDate) return;

      const dateStr = billDate.toISOString().split("T")[0];
      const billItems = bill.items || [];
      const billPlaceOfSupply = (bill.placeOfSupply || userProfile?.state || "").trim().toLowerCase();
      const isInterState = billPlaceOfSupply !== "" && businessState !== "" && billPlaceOfSupply !== businessState;

      let billTaxable = 0;
      let billCgst = 0;
      let billSgst = 0;
      let billIgst = 0;
      let billGst = 0;
      const rates = new Set();
      const hsns = new Set();

      billItems.forEach((item) => {
        // App saves it as `item.gstRate`, Web saves as `item.gst`. Read both.
        const itemGst = item.gstRate !== undefined ? item.gstRate : item.gst;

        const rate = (perProductEnabled && itemGst !== undefined && itemGst !== null)
          ? Number(itemGst)
          : globalGstRate;

        const qty = Number(item.qty || item.quantity) || 0;
        const price = Number(item.rate || item.price) || 0;
        const gross = qty * price;

        let taxable = 0;
        let gst = 0;

        if (item.taxStatus === "With Tax" || item.taxType === "With Tax") {
          taxable = gross / (1 + rate / 100);
          gst = gross - taxable;
        } else {
          taxable = gross;
          gst = (gross * rate) / 100;
        }

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isInterState) {
          igst = gst;
        } else {
          cgst = gst / 2;
          sgst = gst / 2;
        }

        billTaxable += taxable;
        billCgst += cgst;
        billSgst += sgst;
        billIgst += igst;
        billGst += gst;
        rates.add(rate);
        if (item.hsnCode) hsns.add(item.hsnCode);

        // HSN Summary
        const hsn = item.hsnCode || "NA";
        if (!hsnMap.has(hsn)) {
          hsnMap.set(hsn, { hsn, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, qty: 0 });
        }
        const hsnData = hsnMap.get(hsn);
        hsnData.taxable += taxable;
        hsnData.cgst += cgst;
        hsnData.sgst += sgst;
        hsnData.igst += igst;
        hsnData.totalGst += gst;
        hsnData.qty += qty;
      });

      const dGst = Number(bill.deliveryGst || 0);
      const pGst = Number(bill.packagingGst || 0);
      const chargesGst = dGst + pGst;

      if (isInterState) {
        billIgst += chargesGst;
      } else {
        billCgst += chargesGst / 2;
        billSgst += chargesGst / 2;
      }
      billGst += chargesGst;

      // GSTR-1
      gstr1.push({
        billNumber: bill.billNumber || "N/A",
        date: billDate,
        customerName: bill.customerName || "Walk-in",
        buyerGSTIN: bill.buyerGSTIN || "-",
        placeOfSupply: bill.placeOfSupply || userProfile?.state || "-",
        taxable: Number(billTaxable.toFixed(2)),
        cgst: Number(billCgst.toFixed(2)),
        sgst: Number(billSgst.toFixed(2)),
        igst: Number(billIgst.toFixed(2)),
        totalGst: Number(billGst.toFixed(2)),
        grandTotal: Number((billTaxable + billGst + Number(bill.deliveryCharges || 0) + Number(bill.packagingCharges || 0)).toFixed(2)),
        rates: Array.from(rates).sort((a, b) => a - b).join(", ") + "%",
        hsns: Array.from(hsns).join(", ") || "-",
        type: bill.buyerGSTIN ? "B2B" : "B2C",
      });

      // Daily
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { date: dateStr, bills: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0 });
      }
      const dailyData = dailyMap.get(dateStr);
      dailyData.bills += 1;
      dailyData.gross += (billTaxable + billGst + Number(bill.deliveryCharges || 0) + Number(bill.packagingCharges || 0));
      dailyData.taxable += billTaxable;
      dailyData.cgst += billCgst;
      dailyData.sgst += billSgst;
      dailyData.igst += billIgst;
      dailyData.totalGst += billGst;

      totalTaxableAll += billTaxable;
      totalCgstAll += billCgst;
      totalSgstAll += billSgst;
      totalIgstAll += billIgst;
      totalGstAll += billGst;
    });

    const hsnSummary = Array.from(hsnMap.values()).map(h => ({
      ...h,
      taxable: Number(h.taxable.toFixed(2)),
      cgst: Number(h.cgst.toFixed(2)),
      sgst: Number(h.sgst.toFixed(2)),
      igst: Number(h.igst.toFixed(2)),
      totalGst: Number(h.totalGst.toFixed(2)),
    }));

    const dailyTax = Array.from(dailyMap.values()).map(d => ({
      ...d,
      gross: Number(d.gross.toFixed(2)),
      taxable: Number(d.taxable.toFixed(2)),
      cgst: Number(d.cgst.toFixed(2)),
      sgst: Number(d.sgst.toFixed(2)),
      igst: Number(d.igst.toFixed(2)),
      totalGst: Number(d.totalGst.toFixed(2)),
    })).sort((a, b) => b.date.localeCompare(a.date));

    const gstr3b = {
      taxable: Number(totalTaxableAll.toFixed(2)),
      cgst: Number(totalCgstAll.toFixed(2)),
      sgst: Number(totalSgstAll.toFixed(2)),
      igst: Number(totalIgstAll.toFixed(2)),
      totalGst: Number(totalGstAll.toFixed(2)),
    };

    return {
      gstr1,
      gstr3b,
      hsnSummary,
      dailyTax,
    };
  }, [allBills, dateRange, userProfile, gstSettings]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Feather name="arrow-left" size={rf(14)} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.title}>
            GST <Text style={{ color: "#4F46E5" }}>Reports</Text> Center
          </Text>
          <Text style={styles.subtitle}>PROFESSIONAL TAX AUDITING & FILING REPORTS</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => {
              // Share CSV logic can be added later
            }}
          >
            <Feather name="download" size={rf(10)} color="#fff" />
            <Text style={styles.exportBtnText}>EXPORT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTERS & COLUMNS */}
      <View style={styles.filtersRow}>
        <View style={styles.dateSelector}>
          <Feather name="calendar" size={rf(10)} color="#4F46E5" />
          <Text style={styles.dateSelectorText}>{dateRange === "this_month" ? "This Month" : `Last ${dateRange} Days`}</Text>
        </View>

        {activeTab === "GSTR-1" && (
          <View style={styles.columnsWrapper}>
            <TouchableOpacity
              style={styles.columnsBtn}
              onPress={() => setShowColumnToggle(!showColumnToggle)}
            >
              <Feather name="settings" size={rf(10)} color="#64748B" />
              <Text style={styles.columnsBtnText}>COLUMNS</Text>
            </TouchableOpacity>

            {showColumnToggle && (
              <View style={styles.columnsDropdown}>
                <View style={styles.colDropHeader}>
                  <Text style={styles.colDropTitle}>TOGGLE COLUMNS</Text>
                  <TouchableOpacity onPress={() => setVisibleColumns(allColumns.map(c => c.key))}>
                    <Text style={styles.colDropAll}>ALL</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: vs(200) }} nestedScrollEnabled>
                  {allColumns.map(col => (
                    <TouchableOpacity
                      key={col.key}
                      style={styles.colDropItem}
                      onPress={() => toggleColumn(col.key)}
                    >
                      <Text style={[styles.colDropLabel, visibleColumns.includes(col.key) && { color: "#4F46E5" }]}>
                        {col.label}
                      </Text>
                      {visibleColumns.includes(col.key) && <Feather name="check" size={rf(10)} color="#4F46E5" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      {/* TABS */}
      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(8), paddingRight: s(24) }}>
          {[
            { id: "GSTR-1", icon: "file-text", label: "GSTR-1 (INVOICES)" },
            { id: "GSTR-3B", icon: "trending-up", label: "GSTR-3B (SUMMARY)" },
            { id: "HSN", icon: "grid", label: "HSN SUMMARY" },
            { id: "Daily", icon: "file", label: "DAILY TAX" },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab(tab.id);
                setShowColumnToggle(false);
              }}
            >
              <Feather name={tab.icon} size={rf(10)} color={activeTab === tab.id ? "#fff" : "#64748B"} />
              <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT */}
      <View style={styles.contentCard}>
        {activeTab === "GSTR-1" && (
          <ScrollView horizontal style={styles.hScroll}>
            <View>
              <View style={styles.tableHeader}>
                {allColumns.map(col => visibleColumns.includes(col.key) && (
                  <View key={col.key} style={[styles.th, col.key === "customerName" && { width: s(120) }, ["taxable", "cgst", "sgst", "igst", "grandTotal"].includes(col.key) && styles.thRight]}>
                    <Text style={styles.thText}>{col.label}</Text>
                  </View>
                ))}
              </View>
              <ScrollView style={styles.vScroll} nestedScrollEnabled>
                {data.gstr1.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="pie-chart" size={rf(30)} color="#E2E8F0" />
                    <Text style={styles.emptyText}>NO DATA FOUND</Text>
                  </View>
                ) : (
                  data.gstr1.map((row, idx) => (
                    <View key={idx} style={styles.tr}>
                      {allColumns.map(col => {
                        if (!visibleColumns.includes(col.key)) return null;
                        return (
                          <View key={col.key} style={[styles.td, col.key === "customerName" && { width: s(120) }, ["taxable", "cgst", "sgst", "igst", "grandTotal"].includes(col.key) && styles.tdRight]}>
                            {col.key === "type" ? (
                              <View style={[styles.typeBadge, row.type === "B2B" ? styles.typeB2B : styles.typeB2C]}>
                                <Text style={[styles.typeText, row.type === "B2B" ? styles.typeTextB2B : styles.typeTextB2C]}>{row.type}</Text>
                              </View>
                            ) : (
                              <Text style={[
                                styles.tdText,
                                col.key === "billNumber" && styles.tdBoldDark,
                                col.key === "buyerGSTIN" && styles.tdMonoBlue,
                                col.key === "rates" && styles.tdRates,
                                col.key === "grandTotal" && styles.tdBoldDark,
                                col.key === "cgst" && styles.tdCgst,
                                col.key === "sgst" && styles.tdSgst,
                                col.key === "igst" && styles.tdIgst,
                              ]}>
                                {["taxable", "cgst", "sgst", "igst", "grandTotal"].includes(col.key) ? `₹${row[col.key]}` :
                                  col.key === "date" ? row.date.toLocaleDateString() : row[col.key]}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </ScrollView>
        )}

        {activeTab === "GSTR-3B" && (
          <ScrollView style={{ flex: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.gstr3bGrid, { paddingHorizontal: s(24), paddingTop: vs(24) }]}>
              {[
                { label: "Total Taxable", value: data.gstr3b.taxable, color: "#4F46E5", bg: "#EEF2FF" },
                { label: "CGST", value: data.gstr3b.cgst, color: "#059669", bg: "#ECFDF5" },
                { label: "SGST", value: data.gstr3b.sgst, color: "#059669", bg: "#ECFDF5" },
                { label: "Total GST", value: data.gstr3b.totalGst, color: "#E11D48", bg: "#FFF1F2" },
              ].map((card, i) => (
                <View key={i} style={[styles.gstr3bCard, { backgroundColor: card.bg, borderColor: `${card.color}20` }]}>
                  <Text style={styles.gstr3bLabel}>{card.label}</Text>
                  <Text style={[styles.gstr3bValue, { color: card.color }]}>₹{card.value.toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.summaryBox, { marginHorizontal: s(24) }]}>
              <Text style={styles.summaryTitle}>Summary Conclusion</Text>
              <Text style={styles.summaryDesc}>
                During this period, you generated a total taxable value of <Text style={{ color: "#0F172A", fontWeight: "900" }}>₹{data.gstr3b.taxable.toFixed(2)}</Text> with a net GST liability of <Text style={{ color: "#0F172A", fontWeight: "900" }}>₹{data.gstr3b.totalGst.toFixed(2)}</Text>.
              </Text>

              <View style={styles.divisionBox}>
                <Text style={styles.divisionTitle}>Tax Division (50/50 Internal split)</Text>
                <View style={styles.divisionBars}>
                  <View style={styles.divItem}>
                    <View style={[styles.barLine, { backgroundColor: "#4F46E5" }]} />
                    <Text style={styles.divText}>CENTRAL (CGST): ₹{data.gstr3b.cgst.toFixed(2)}</Text>
                  </View>
                  <View style={styles.divItem}>
                    <View style={[styles.barLine, { backgroundColor: "#059669" }]} />
                    <Text style={styles.divText}>STATE (SGST): ₹{data.gstr3b.sgst.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === "HSN" && (
          <ScrollView horizontal style={styles.hScroll}>
            <View>
              <View style={styles.tableHeader}>
                <View style={[styles.th, { width: s(120) }]}><Text style={styles.thText}>HSN / SAC Code</Text></View>
                <View style={styles.th}><Text style={styles.thText}>Total Qty</Text></View>
                <View style={styles.thRight}><Text style={styles.thText}>Taxable Value</Text></View>
                <View style={styles.thRight}><Text style={styles.thText}>CGST</Text></View>
                <View style={styles.thRight}><Text style={styles.thText}>SGST</Text></View>
                <View style={styles.thRight}><Text style={[styles.thText, { color: "#4F46E5" }]}>Total GST</Text></View>
              </View>
              <ScrollView style={styles.vScroll} nestedScrollEnabled>
                {data.hsnSummary.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="pie-chart" size={rf(30)} color="#E2E8F0" />
                    <Text style={styles.emptyText}>NO DATA FOUND</Text>
                  </View>
                ) : (
                  data.hsnSummary.map((row, idx) => (
                    <View key={idx} style={styles.tr}>
                      <View style={[styles.td, { width: s(120) }]}><Text style={[styles.tdText, styles.tdBoldDark]}>Code: {row.hsn}</Text></View>
                      <View style={styles.td}><Text style={styles.tdText}>{row.qty}</Text></View>
                      <View style={styles.tdRight}><Text style={styles.tdText}>₹{row.taxable.toFixed(2)}</Text></View>
                      <View style={styles.tdRight}><Text style={styles.tdText}>₹{row.cgst.toFixed(2)}</Text></View>
                      <View style={styles.tdRight}><Text style={styles.tdText}>₹{row.sgst.toFixed(2)}</Text></View>
                      <View style={styles.tdRight}><Text style={[styles.tdText, styles.tdBoldDark, { color: "#4F46E5" }]}>₹{row.totalGst.toFixed(2)}</Text></View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </ScrollView>
        )}

        {activeTab === "Daily" && (
          <ScrollView horizontal style={styles.hScroll}>
            <View>
              <View style={styles.tableHeader}>
                <View style={[styles.th, { width: s(140) }]}><Text style={styles.thText}>Accounting Date</Text></View>
                <View style={styles.th}><Text style={styles.thText}>Bills Generated</Text></View>
                <View style={styles.thRight}><Text style={styles.thText}>Daily Sales</Text></View>
                <View style={styles.thRight}><Text style={styles.thText}>Taxable</Text></View>
                <View style={styles.thRight}><Text style={[styles.thText, { color: "#059669" }]}>Daily GST</Text></View>
              </View>
              <ScrollView style={styles.vScroll} nestedScrollEnabled>
                {data.dailyTax.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="pie-chart" size={rf(30)} color="#E2E8F0" />
                    <Text style={styles.emptyText}>NO DATA FOUND</Text>
                  </View>
                ) : (
                  data.dailyTax.map((row, idx) => (
                    <View key={idx} style={styles.tr}>
                      <View style={[styles.td, { width: s(140) }]}><Text style={[styles.tdText, styles.tdBoldDark]}>{row.date}</Text></View>
                      <View style={styles.td}>
                        <View style={styles.billsBadge}><Text style={styles.billsBadgeText}>{row.bills} Invoices</Text></View>
                      </View>
                      <View style={styles.tdRight}><Text style={styles.tdText}>₹{row.gross.toFixed(2)}</Text></View>
                      <View style={styles.tdRight}><Text style={styles.tdText}>₹{row.taxable.toFixed(2)}</Text></View>
                      <View style={styles.tdRight}><Text style={[styles.tdText, styles.tdBoldDark, { color: "#059669" }]}>₹{row.totalGst.toFixed(2)}</Text></View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default GstReportsView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? vs(50) : vs(20),
    paddingHorizontal: s(24),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(20),
  },
  backButton: {
    width: s(32),
    height: s(32),
    backgroundColor: "#fff",
    borderRadius: s(10),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: s(12),
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginTop: vs(2),
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    borderRadius: s(10),
    gap: s(6),
  },
  exportBtnText: {
    color: "#fff",
    fontSize: rf(7),
    fontWeight: "900",
    letterSpacing: 1,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(16),
    zIndex: 10,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: s(6),
  },
  dateSelectorText: {
    fontSize: rf(8),
    fontWeight: "bold",
    color: "#0F172A",
  },
  columnsWrapper: {
    position: "relative",
  },
  columnsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: s(6),
  },
  columnsBtnText: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  columnsDropdown: {
    position: "absolute",
    top: vs(32),
    right: 0,
    width: s(160),
    backgroundColor: "#fff",
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    padding: s(12),
    zIndex: 20,
  },
  colDropHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
    paddingHorizontal: s(4),
  },
  colDropTitle: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  colDropAll: {
    fontSize: rf(7),
    fontWeight: "bold",
    color: "#4F46E5",
  },
  colDropItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(8),
    paddingHorizontal: s(6),
    borderRadius: s(6),
  },
  colDropLabel: {
    fontSize: rf(8),
    fontWeight: "bold",
    color: "#64748B",
  },
  tabsRow: {
    marginBottom: vs(16),
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    backgroundColor: "#fff",
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: s(6),
  },
  tabBtnActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  tabBtnText: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: vs(24),
    overflow: "hidden",
  },
  hScroll: {
    flex: 1,
  },
  vScroll: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  th: {
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    width: s(100),
    justifyContent: "center",
  },
  thRight: {
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    width: s(100),
    justifyContent: "center",
    alignItems: "flex-end",
  },
  thText: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  td: {
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    width: s(100),
    justifyContent: "center",
  },
  tdRight: {
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    width: s(100),
    justifyContent: "center",
    alignItems: "flex-end",
  },
  tdText: {
    fontSize: rf(8),
    fontWeight: "600",
    color: "#475569",
  },
  tdBoldDark: {
    fontWeight: "900",
    color: "#0F172A",
  },
  tdMonoBlue: {
    color: "#4F46E5",
  },
  tdRates: {
    color: "#4F46E5",
  },
  tdCgst: {
    color: "rgba(79, 70, 229, 0.7)", // indigo-600/70
  },
  tdSgst: {
    color: "rgba(5, 150, 105, 0.7)", // emerald-600/70
  },
  tdIgst: {
    color: "rgba(225, 29, 72, 0.7)", // rose-600/70
  },
  typeBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
    alignSelf: "flex-start",
  },
  typeB2B: {
    backgroundColor: "#4F46E5",
  },
  typeB2C: {
    backgroundColor: "#F1F5F9",
  },
  typeText: {
    fontSize: rf(6),
    fontWeight: "900",
    letterSpacing: 1,
  },
  typeTextB2B: {
    color: "#fff",
  },
  typeTextB2C: {
    color: "#64748B",
  },
  emptyState: {
    padding: s(40),
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: rf(10),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginTop: vs(12),
  },
  gstr3bGrid: {
    flexDirection: "row",
    gap: s(12),
    marginBottom: vs(24),
  },
  gstr3bCard: {
    width: s(140),
    padding: s(16),
    borderRadius: s(16),
    borderWidth: 1,
  },
  gstr3bLabel: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: vs(8),
  },
  gstr3bValue: {
    fontSize: rf(18),
    fontWeight: "900",
  },
  summaryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: s(20),
    padding: s(20),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryTitle: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: vs(12),
  },
  summaryDesc: {
    fontSize: rf(9),
    fontWeight: "500",
    color: "#64748B",
    lineHeight: vs(18),
    marginBottom: vs(20),
  },
  divisionBox: {
    backgroundColor: "#fff",
    padding: s(16),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  divisionTitle: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: vs(12),
  },
  divisionBars: {
    flexDirection: "row",
    gap: s(16),
  },
  divItem: {
    flex: 1,
  },
  barLine: {
    height: vs(6),
    borderRadius: vs(3),
    marginBottom: vs(8),
  },
  divText: {
    fontSize: rf(7),
    fontWeight: "bold",
    color: "#475569",
  },
  billsBadge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
    alignSelf: "flex-start",
  },
  billsBadgeText: {
    fontSize: rf(7),
    fontWeight: "bold",
    color: "#475569",
  },
});
