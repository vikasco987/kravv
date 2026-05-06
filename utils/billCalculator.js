import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Ensures that bill totals and components (tax, discount, charges) are correctly
 * calculated for display in analytics and reports.
 *
 * CRITICAL: It prioritizes stored values from the bill object to ensure that
 * changing settings doesn't affect old data.
 */
export const applyTrueBillTotals = async (bills) => {
  if (!bills || !bills.length) return;

  const s = await AsyncStorage.multiGet([
    "tax_enabled",
    "tax_rate",
    "per_product_tax",
    "discount_enabled",
    "discount_rate",
    "service_charge_enabled",
    "service_charge_rate",
    "service_gst_enabled",
    "service_gst_rate",
    "delivery_charge_enabled",
    "delivery_charge_amount",
    "delivery_gst_enabled",
    "delivery_gst_rate",
    "packaging_charge_enabled",
    "packaging_charge_amount",
    "packaging_gst_enabled",
    "packaging_gst_rate",
  ]);
  const sMap = {};
  s.forEach(([k, v]) => (sMap[k] = v));

  const settings = {
    tax_enabled: sMap["tax_enabled"] === "true",
    tax_rate: parseFloat(sMap["tax_rate"] || "0"),
    per_product_tax: sMap["per_product_tax"] === "true",
    discount_enabled: sMap["discount_enabled"] === "true",
    discount_rate: parseFloat(sMap["discount_rate"] || "0"),
    service_charge_enabled: sMap["service_charge_enabled"] === "true",
    service_charge_rate: parseFloat(sMap["service_charge_rate"] || "0"),
    service_gst_enabled: sMap["service_gst_enabled"] === "true",
    service_gst_rate: parseFloat(sMap["service_gst_rate"] || "0"),
    delivery_charge_enabled: sMap["delivery_charge_enabled"] === "true",
    delivery_charge_amount: parseFloat(sMap["delivery_charge_amount"] || "0"),
    delivery_gst_enabled: sMap["delivery_gst_enabled"] === "true",
    delivery_gst_rate: parseFloat(sMap["delivery_gst_rate"] || "0"),
    packaging_charge_enabled: sMap["packaging_charge_enabled"] === "true",
    packaging_charge_amount: parseFloat(sMap["packaging_charge_amount"] || "0"),
    packaging_gst_enabled: sMap["packaging_gst_enabled"] === "true",
    packaging_gst_rate: parseFloat(sMap["packaging_gst_rate"] || "0"),
  };

  bills.forEach((bill) => {
    // 1. Item Level Calculations
    let totalItemsTaxable = 0;
    let totalItemsGstAtBase = 0;
    let itemsSubtotal = 0;

    (bill.items || []).forEach((it) => {
      const qty = Number(it.qty || it.quantity || 1);
      const rate = Number(it.rate || it.price || 0);
      const lineTotal = qty * rate;
      itemsSubtotal += lineTotal;

      // Use item's saved gstRate if available, otherwise fallback to settings
      let itemGstRate = it.gstRate !== undefined ? Number(it.gstRate) : 0;

      // Fallback only if we really don't have it (usually for very old bills)
      if (it.gstRate === undefined) {
        if (settings.tax_enabled) itemGstRate = settings.tax_rate;
        else if (settings.per_product_tax) itemGstRate = Number(it.gst || 0);
      }

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

    // 2. Discount
    // Prioritize stored discountAmount
    const storedDiscount =
      bill.discountAmount ?? bill.discount_amount ?? bill.discount;
    const discountAmount =
      storedDiscount !== undefined && storedDiscount !== null
        ? Number(storedDiscount)
        : totalItemsTaxable * (settings.discount_rate / 100);

    const taxableAfterDiscount = totalItemsTaxable - discountAmount;

    // 3. Main GST
    // Prioritize stored gstAmount
    const storedGst = bill.gstAmount ?? bill.tax;
    const finalGstAmount =
      storedGst !== undefined && storedGst !== null
        ? Number(storedGst)
        : totalItemsTaxable > 0
          ? taxableAfterDiscount * (totalItemsGstAtBase / totalItemsTaxable)
          : 0;

    // 4. Service Charge & GST
    const serviceCharge =
      bill.serviceCharge !== undefined && bill.serviceCharge !== null
        ? Number(bill.serviceCharge)
        : settings.service_charge_enabled
          ? settings.service_charge_rate
          : 0;

    const serviceGst =
      bill.serviceGst !== undefined && bill.serviceGst !== null
        ? Number(bill.serviceGst)
        : serviceCharge > 0
          ? (serviceCharge * settings.service_gst_rate) / 100
          : 0;

    // 5. Delivery Charge & GST
    const deliveryCharge =
      bill.deliveryCharge !== undefined && bill.deliveryCharge !== null
        ? Number(bill.deliveryCharge)
        : settings.delivery_charge_enabled
          ? settings.delivery_charge_amount
          : 0;

    const deliveryGst =
      bill.deliveryGst !== undefined && bill.deliveryGst !== null
        ? Number(bill.deliveryGst)
        : deliveryCharge > 0
          ? (deliveryCharge * settings.delivery_gst_rate) / 100
          : 0;

    // 6. Packaging Charge & GST
    const packagingCharge =
      bill.packagingCharge !== undefined && bill.packagingCharge !== null
        ? Number(bill.packagingCharge)
        : settings.packaging_charge_enabled
          ? settings.packaging_charge_amount
          : 0;

    const packagingGst =
      bill.packagingGst !== undefined && bill.packagingGst !== null
        ? Number(bill.packagingGst)
        : packagingCharge > 0
          ? (packagingCharge * settings.packaging_gst_rate) / 100
          : 0;

    // 7. Final Total Consistency - ALWAYS Recalculate to ensure "Real Data" matches components
    bill.total = Number(
      (
        taxableAfterDiscount +
        finalGstAmount +
        serviceCharge +
        serviceGst +
        deliveryCharge +
        deliveryGst +
        packagingCharge +
        packagingGst
      ).toFixed(2),
    );

    // Attach all calculated/stored sub-fields for UI binding (Daily/Weekly/Monthly reports)
    bill.itemsSubtotal = Number(itemsSubtotal.toFixed(2));
    bill.calculatedTaxable = Number(taxableAfterDiscount.toFixed(2));
    bill.calculatedDiscount = Number(discountAmount.toFixed(2));
    bill.calculatedGst = Number(finalGstAmount.toFixed(2));
    bill.calculatedServiceCharge = Number(serviceCharge.toFixed(2));
    bill.calculatedServiceGst = Number(serviceGst.toFixed(2));
    bill.calculatedDeliveryCharge = Number(deliveryCharge.toFixed(2));
    bill.calculatedDeliveryGst = Number(deliveryGst.toFixed(2));
    bill.calculatedPackagingCharge = Number(packagingCharge.toFixed(2));
    bill.calculatedPackagingGst = Number(packagingGst.toFixed(2));
  });
};
