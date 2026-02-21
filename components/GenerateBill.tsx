// // GenerateBill.tsx
// "use client";
// import React from "react";
// import { Button, Alert } from "react-native";
// import * as Print from "expo-print";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// type Props = {
//   customerName: string;
//   phone: string;
//   billingAddress: string;
//   cart: CartItem[];
//   companyInfo?: {
//     name: string;
//     address: string;
//     phone: string;
//     gst?: string;
//   };
// };

// export default function GenerateBill({
//   customerName,
//   phone,
//   billingAddress,
//   cart,
//   companyInfo,
// }: Props) {
//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const generateHTML = () => {
//     let itemsHTML = "";
//     cart.forEach((item, index) => {
//       itemsHTML += `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${item.name}</td>
//           <td>${item.quantity}</td>
//           <td>₹${item.price || 0}</td>
//           <td>₹${(item.price || 0) * item.quantity}</td>
//         </tr>
//       `;
//     });

//     return `
//       <html>
//         <head>
//           <style>
//             body { font-family: Arial, sans-serif; padding: 20px; }
//             h2, h3 { margin: 0; }
//             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//             th, td { border: 1px solid #333; padding: 8px; text-align: left; }
//             th { background-color: #f2f2f2; }
//             .company-info { margin-bottom: 20px; }
//             .total { font-weight: bold; text-align: right; }
//           </style>
//         </head>
//         <body>
//           <div class="company-info">
//             <h2>${companyInfo?.name || "Your Company Name"}</h2>
//             <p>${companyInfo?.address || "Company Address"}</p>
//             <p>Phone: ${companyInfo?.phone || "0000000000"}</p>
//             ${companyInfo?.gst ? `<p>GST: ${companyInfo.gst}</p>` : ""}
//           </div>

//           <div class="customer-info">
//             <h3>Bill To:</h3>
//             <p>Name: ${customerName}</p>
//             <p>Phone: ${phone}</p>
//             <p>Address: ${billingAddress}</p>
//           </div>

//           <table>
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Item</th>
//                 <th>Qty</th>
//                 <th>Rate</th>
//                 <th>Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${itemsHTML}
//             </tbody>
//           </table>

//           <h3 class="total">Subtotal: ₹${subtotal}</h3>
//           <h3 class="total">Total Due: ₹${subtotal}</h3>
//         </body>
//       </html>
//     `;
//   };

//   const handlePrint = async () => {
//     try {
//       const html = generateHTML();
//       await Print.printAsync({
//         html,
//       });
//     } catch (err: any) {
//       Alert.alert("Error", err.message || "Failed to generate bill");
//     }
//   };

//   return <Button title="Generate Bill & Print" onPress={handlePrint} />;
// }






// "use client";
// import React from "react";
// import { Alert, TouchableOpacity, Text } from "react-native";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";

// type CartItem = {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
// };

// interface BillProps {
//   customerName: string;
//   phone: string;
//   cart: CartItem[];
//   billNo?: string;
//   date?: string;
//   gstPercent?: number;
// }

// export default function SimpleBill({ customerName, phone, cart, billNo, date, gstPercent = 5 }: BillProps) {
//   const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   const gstAmount = (subtotal * gstPercent) / 100;
//   const totalAmount = subtotal + gstAmount;

//   const generateTextBill = () => {
//     let billText = `
// ------------------------------------------------------------
//                         MAGIC SCALE
//                   GSTIN: 07ABCDE1234F1Z5
//                 Address: Delhi, India - 110001
//                  Phone: +91 98765 43210
// ------------------------------------------------------------
// Date: ${date || new Date().toLocaleDateString()}                   Bill No: ${billNo || "MS-XXXX"}
// Customer Name: ${customerName || "______________________________"}
// Phone: ${phone || "___________________________"}

// ------------------------------------------------------------
// S.No   Item Name              Qty   Price   Amount
// ------------------------------------------------------------
// `;

//     cart.forEach((item, index) => {
//       const amount = item.price * item.quantity;
//       billText += `${index + 1}      ${item.name.padEnd(20, " ")} ${item.quantity}    ${item.price.toFixed(2)}   ${amount.toFixed(2)}\n`;
//     });

//     billText += `------------------------------------------------------------
//                      Subtotal:              ${subtotal.toFixed(2)}
//                      GST (${gstPercent}%):               ${gstAmount.toFixed(2)}
// ------------------------------------------------------------
//                      Total Amount:          ₹${totalAmount.toFixed(2)}
// ------------------------------------------------------------

// Payment Mode: ____________________
// Transaction ID: __________________

// Thank you for your purchase!
// Visit Again 🙏
// ------------------------------------------------------------
// `;
//     return billText;
//   };

//   const handlePrint = async () => {
//     const htmlContent = `<pre style="font-family: monospace; font-size: 14px;">${generateTextBill()}</pre>`;
//     try {
//       const { uri } = await Print.printToFileAsync({ html: htmlContent });
//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri);
//       } else {
//         Alert.alert("Bill Generated", `Saved at: ${uri}`);
//       }
//     } catch (err) {
//       console.error(err);
//       Alert.alert("Error", "Failed to generate bill.");
//     }
//   };

//   return (
//     <TouchableOpacity
//       onPress={handlePrint}
//       style={{ backgroundColor: "#ef4444", padding: 15, borderRadius: 10, marginTop: 10 }}
//     >
//       <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>PRINT BILL</Text>
//     </TouchableOpacity>
//   );
// }
