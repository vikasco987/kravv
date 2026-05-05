import AsyncStorage from "@react-native-async-storage/async-storage";

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
    // If total already exists and is not zero, we should ideally trust it.
    // However, we still need to calculate sub-components if they are missing for UI display.

    let totalItemsTaxable = 0;
    let totalItemsGstAtBase = 0;

    (bill.items || []).forEach((it) => {
      const qty = Number(it.qty || it.quantity || 1);
      const rate = Number(it.rate || it.price || 0);
      const lineTotal = qty * rate;

      // Use item's saved gstRate if available
      let itemGstRate =
        it.gstRate !== undefined
          ? Number(it.gstRate)
          : settings.tax_enabled
            ? settings.tax_rate
            : settings.per_product_tax
              ? it.gst !== undefined && it.gst !== null
                ? Number(it.gst)
                : 0
              : 0;

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

    // Use stored discount if available (even if 0, check for undefined)
    const storedDiscount =
      bill.discountAmount ?? bill.discount_amount ?? bill.discount;
    const discountAmount =
      storedDiscount !== undefined && storedDiscount !== null
        ? Number(storedDiscount)
        : totalItemsTaxable * (settings.discount_rate / 100);

    const taxableAfterDiscount = totalItemsTaxable - discountAmount;

    // Use stored GST if available
    const storedGst = bill.gstAmount ?? bill.tax;
    const finalGstAmount =
      storedGst !== undefined && storedGst !== null
        ? Number(storedGst)
        : totalItemsTaxable > 0
          ? taxableAfterDiscount * (totalItemsGstAtBase / totalItemsTaxable)
          : 0;

    // Service Charge
    const storedSC = bill.serviceCharge;
    let serviceCharge =
      storedSC !== undefined && storedSC !== null
        ? Number(storedSC)
        : settings.service_charge_enabled
          ? settings.service_charge_rate
          : 0;

    const storedSGst = bill.serviceGst;
    let serviceGst =
      storedSGst !== undefined && storedSGst !== null
        ? Number(storedSGst)
        : serviceCharge > 0
          ? (serviceCharge * settings.service_gst_rate) / 100
          : 0;

    // Delivery Charge
    const storedDC = bill.deliveryCharge;
    let deliveryCharge =
      storedDC !== undefined && storedDC !== null
        ? Number(storedDC)
        : settings.delivery_charge_enabled
          ? settings.delivery_charge_amount
          : 0;

    const storedDGst = bill.deliveryGst;
    let deliveryGst =
      storedDGst !== undefined && storedDGst !== null
        ? Number(storedDGst)
        : deliveryCharge > 0
          ? (deliveryCharge * settings.delivery_gst_rate) / 100
          : 0;

    // Packaging Charge
    const storedPC = bill.packagingCharge;
    let packagingCharge =
      storedPC !== undefined && storedPC !== null
        ? Number(storedPC)
        : settings.packaging_charge_enabled
          ? settings.packaging_charge_amount
          : 0;

    const storedPGst = bill.packagingGst;
    let packagingGst =
      storedPGst !== undefined && storedPGst !== null
        ? Number(storedPGst)
        : packagingCharge > 0
          ? (packagingCharge * settings.packaging_gst_rate) / 100
          : 0;

    // Final Total
    if (bill.total === undefined || bill.total === null || bill.total === 0) {
      bill.total =
        taxableAfterDiscount +
        finalGstAmount +
        serviceCharge +
        serviceGst +
        deliveryCharge +
        deliveryGst +
        packagingCharge +
        packagingGst;
    }

    // Also update sub-fields for UI consistency if they were calculated
    bill.calculatedDiscount = discountAmount;
    bill.calculatedGst = finalGstAmount;
    bill.calculatedServiceCharge = serviceCharge;
    bill.calculatedDeliveryCharge = deliveryCharge;
    bill.calculatedPackagingCharge = packagingCharge;
  });
};
