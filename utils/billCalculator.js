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
    let globalGstSum = 0;
    let perProductGstSum = 0;
    let grossSubtotal = 0;

    (bill.items || []).forEach((it) => {
      const qty = Number(it.qty || it.quantity || 1);
      const rate = Number(it.rate || it.price || 0);
      const itemLineTotal = qty * rate;
      grossSubtotal += itemLineTotal;

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

      // Logic from SimpleBill.ts
      let taxable = 0;
      let gst = 0;
      const taxType = it.taxStatus || it.taxType || "Without Tax";

      const itemDiscount =
        itemLineTotal *
        (settings.discount_enabled ? settings.discount_rate / 100 : 0);
      const itemPriceAfterDiscount = itemLineTotal - itemDiscount;

      if (taxType === "With Tax") {
        taxable = itemPriceAfterDiscount / (1 + itemGstRate / 100);
        gst = itemPriceAfterDiscount - taxable;
      } else {
        taxable = itemPriceAfterDiscount;
        // Logic: Always calculate GST on Gross Price (before discount) as per user request
        gst = (itemLineTotal * itemGstRate) / 100;
      }

      totalItemsTaxable += taxable;
      totalItemsGstAtBase += gst;

      // Track source for detailed labels
      if (settings.tax_enabled && !settings.per_product_tax) {
        globalGstSum += gst;
      } else if (settings.per_product_tax) {
        const productGst = Number(it.gst || 0);
        if (productGst > 0 || !settings.tax_enabled) {
          perProductGstSum += gst;
        } else {
          globalGstSum += gst;
        }
      }
    });

    // 1. Subtotal (Raw sum)
    const subtotalValue = bill.itemsSubtotal ?? grossSubtotal;

    // 2. Discount
    const storedDiscount =
      bill.discountAmount ?? bill.discount_amount ?? bill.discount;
    const discountAmount =
      storedDiscount !== undefined && storedDiscount !== null
        ? Number(storedDiscount)
        : bill.id || bill._id
          ? 0 // Saved bills stay as they were
          : settings.discount_enabled
            ? grossSubtotal * (settings.discount_rate / 100)
            : 0;

    const taxableAfterDiscount = totalItemsTaxable;

    // 3. Main GST (on items)
    const storedGst = bill.tax ?? bill.gstAmount;
    const finalGstAmount =
      storedGst !== undefined && storedGst !== null
        ? Number(storedGst)
        : totalItemsGstAtBase;

    // 4. Service Charge & GST
    const serviceCharge =
      bill.serviceCharge !== undefined && bill.serviceCharge !== null
        ? Number(bill.serviceCharge)
        : bill.id || bill._id
          ? 0
          : settings.service_charge_enabled
            ? settings.service_charge_rate
            : 0;

    const serviceGst =
      bill.serviceGst !== undefined && bill.serviceGst !== null
        ? Number(bill.serviceGst)
        : bill.id || bill._id
          ? 0
          : serviceCharge > 0
            ? (serviceCharge * settings.service_gst_rate) / 100
            : 0;

    // 5. Delivery Charge & GST
    const deliveryCharge =
      bill.deliveryCharges !== undefined && bill.deliveryCharges !== null
        ? Number(bill.deliveryCharges)
        : bill.deliveryCharge !== undefined && bill.deliveryCharge !== null
          ? Number(bill.deliveryCharge)
          : bill.id || bill._id
            ? 0
            : settings.delivery_charge_enabled
              ? settings.delivery_charge_amount
              : 0;

    const deliveryGst =
      bill.deliveryGst !== undefined && bill.deliveryGst !== null
        ? Number(bill.deliveryGst)
        : bill.id || bill._id
          ? 0
          : deliveryCharge > 0
            ? (deliveryCharge * settings.delivery_gst_rate) / 100
            : 0;

    // 6. Packaging Charge & GST
    const packagingCharge =
      bill.packagingCharges !== undefined && bill.packagingCharges !== null
        ? Number(bill.packagingCharges)
        : bill.packagingCharge !== undefined && bill.packagingCharge !== null
          ? Number(bill.packagingCharge)
          : bill.id || bill._id
            ? 0
            : settings.packaging_charge_enabled
              ? settings.packaging_charge_amount
              : 0;

    const packagingGst =
      bill.packagingGst !== undefined && bill.packagingGst !== null
        ? Number(bill.packagingGst)
        : bill.id || bill._id
          ? 0
          : packagingCharge > 0
            ? (packagingCharge * settings.packaging_gst_rate) / 100
            : 0;

    // 7. Final Total Consistency
    const calculatedTotal =
      taxableAfterDiscount +
      finalGstAmount +
      serviceCharge +
      serviceGst +
      deliveryCharge +
      deliveryGst +
      packagingCharge +
      packagingGst;

    const storedTotal = bill.total || bill.grandTotal;
    if (
      storedTotal !== undefined &&
      storedTotal !== null &&
      Number(storedTotal) > 0 &&
      storedDiscount !== undefined &&
      storedDiscount !== null
    ) {
      bill.total = Number(Number(storedTotal).toFixed(2));
    } else {
      bill.total = Number(calculatedTotal.toFixed(2));
    }

    // Attach all calculated/stored sub-fields for UI binding (Daily/Weekly/Monthly reports)
    bill.calculatedSubtotal = Number(subtotalValue.toFixed(2));
    bill.calculatedTaxable =
      bill.calculatedTaxable ?? Number(taxableAfterDiscount.toFixed(2));
    bill.calculatedDiscount = Number(discountAmount.toFixed(2));
    bill.calculatedGst = Number(finalGstAmount.toFixed(2));
    bill.calculatedGlobalGst = Number(globalGstSum.toFixed(2));
    bill.calculatedItemGst = Number(perProductGstSum.toFixed(2));
    bill.calculatedDiscountRate = bill.discountRate ?? settings.discount_rate;
    bill.calculatedGstRate =
      bill.gstRate ??
      (bill.items && bill.items[0] ? bill.items[0].gstRate : settings.tax_rate);
    bill.calculatedServiceCharge = Number(serviceCharge.toFixed(2));
    bill.calculatedServiceGst = Number(serviceGst.toFixed(2));
    bill.calculatedServiceGstRate =
      bill.serviceGstRate ?? settings.service_gst_rate;
    bill.calculatedDeliveryCharge = Number(deliveryCharge.toFixed(2));
    bill.calculatedDeliveryGst = Number(deliveryGst.toFixed(2));
    bill.calculatedDeliveryGstRate =
      bill.deliveryGstRate ?? settings.delivery_gst_rate;
    bill.calculatedPackagingCharge = Number(packagingCharge.toFixed(2));
    bill.calculatedPackagingGst = Number(packagingGst.toFixed(2));
    bill.calculatedPackagingGstRate =
      bill.packagingGstRate ?? settings.packaging_gst_rate;
  });
};
