import AsyncStorage from "@react-native-async-storage/async-storage";

export const applyTrueBillTotals = async (bills) => {
    if (!bills || !bills.length) return;

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
    const sMap = {};
    s.forEach(([k, v]) => sMap[k] = v);

    const settings = {
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
    };

    bills.forEach(bill => {
        let totalItemsTaxable = 0;
        let totalItemsGstAtBase = 0;

        (bill.items || []).forEach(it => {
            const qty = Number(it.qty || it.quantity || 1);
            const rate = Number(it.rate || it.price || 0);
            const lineTotal = qty * rate;

            let itemGstRate = it.gstRate !== undefined ? Number(it.gstRate) : (settings.tax_enabled ? settings.tax_rate : (settings.per_product_tax ? ((it.gst !== undefined && it.gst !== null) ? Number(it.gst) : 0) : 0));

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

        const savedDiscount = (bill.discountAmount ?? bill.discount_amount ?? bill.discount ?? 0);
        const discountAmount = (savedDiscount > 0)
            ? Number(savedDiscount)
            : (totalItemsTaxable * (settings.discount_rate / 100));

        const taxableAfterDiscount = totalItemsTaxable - discountAmount;

        const avgGstRate = totalItemsTaxable > 0 ? (totalItemsGstAtBase / totalItemsTaxable) : 0;
        const finalGstAmount = taxableAfterDiscount * avgGstRate;

        let serviceCharge = Number(bill.serviceCharge || 0);
        let serviceGst = Number(bill.serviceGst || 0);
        if (!serviceCharge) {
            serviceCharge = settings.service_charge_rate;
            serviceGst = (serviceCharge * settings.service_gst_rate) / 100;
        }

        let deliveryCharge = Number(bill.deliveryCharge || 0);
        let deliveryGst = Number(bill.deliveryGst || 0);
        if (!deliveryCharge) {
            deliveryCharge = settings.delivery_charge_amount;
            deliveryGst = (deliveryCharge * settings.delivery_gst_rate) / 100;
        }

        let packagingCharge = Number(bill.packagingCharge || 0);
        let packagingGst = Number(bill.packagingGst || 0);
        if (!packagingCharge) {
            packagingCharge = settings.packaging_charge_amount;
            packagingGst = (packagingCharge * settings.packaging_gst_rate) / 100;
        }

        const total = taxableAfterDiscount + finalGstAmount + serviceCharge + serviceGst + deliveryCharge + deliveryGst + packagingCharge + packagingGst;
        bill.total = total; // Mutate bill total
    });
};
