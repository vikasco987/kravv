// // --- INTERFACES AND TYPES ---

// // Mock interface for the printer object returned by ensurePrinterConnected()
// interface Printer {
//   // Method to send raw data or commands to the printer
//   write(data: string | Uint8Array): Promise<void>;
//   // Mock property to simulate printer properties
//   isConnected: boolean;
// }

// // Interface representing an item in the shopping cart
// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
// }

// // Interface for optional billing information
// interface BillOptions {
//   customerName?: string;
//   phone?: string;
//   tableNo?: string; // Added table number for KOT context
// }

// // --- MOCK HELPER FUNCTIONS (Assuming 24-column width printer) ---

// /**
//  * Creates a dividing line of a specified character for the KOT.
//  * @param char The character to repeat (e.g., "=", "-").
//  * @returns A 24-character wide line string.
//  */
// function line(char: string): string {
//   return char.repeat(24);
// }

// /**
//  * Centers text on a 24-column line.
//  * @param text The text to center.
//  * @returns The centered string.
//  */
// function centerText(text: string): string {
//   const width = 24;
//   const padding = Math.max(0, width - text.length);
//   const leftPad = Math.floor(padding / 2);
//   const rightPad = padding - leftPad;
//   return " ".repeat(leftPad) + text + " ".repeat(rightPad);
// }

// /**
//  * Mocks the printer connection process.
//  * In a real scenario, this would handle Bluetooth, USB, or network connection.
//  * @returns A promise that resolves to a mock Printer object or null if connection fails.
//  */
// async function ensurePrinterConnected(): Promise<Printer | null> {
//   console.log("Attempting to connect to printer...");
//   // Simulate successful connection after a delay
//   await new Promise(resolve => setTimeout(resolve, 500));

//   const mockPrinter: Printer = {
//     isConnected: true,
//     write: async (data: string | Uint8Array) => {
//       // In a real app, this would send data to the printer driver/API.
//       if (typeof data === 'string') {
//         console.log("➡️ Printer received (Text):\n" + data.trim());
//       } else {
//         console.log(`➡️ Printer received (Command): ${Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}`);
//       }
//     }
//   };

//   console.log("✅ Printer connected.");
//   return mockPrinter;
// }


// /* ------------------ Print KOT (Kitchen Order Ticket) ------------------ */

// /**
//  * Generates and prints a Kitchen Order Ticket (KOT) to the thermal printer.
//  * @param cartItems The list of items to be printed.
//  * @param token An authentication token (not used in mock but retained for signature).
//  * @param userClerkId The ID of the user/clerk (not used in mock but retained for signature).
//  * @param options Optional bill information (customer name, phone, etc.).
//  * @returns A promise resolving to true if printing was successful, false otherwise.
//  */
// export async function printKOT(
//   cartItems: CartItem[],
//   token: string,
//   userClerkId: string,
//   options?: BillOptions
// ): Promise<boolean> {
//   const printer = await ensurePrinterConnected();
//   if (!printer) return false;

//   const date = new Date();
//   // Ensure the KOT No is a unique identifier (using a timestamp or sequence in a real app)
//   const kotNo = "KOT-" + (Math.floor(Math.random() * 90000) + 10000);

//   /* --- KOT Header --- */
//   let kotText = "";
//   kotText += line("=") + "\n";
//   kotText += centerText("KITCHEN ORDER TICKET") + "\n";
//   kotText += centerText("(KOT)") + "\n";
//   kotText += line("-") + "\n";
//   kotText += `KOT No : ${kotNo}\n`;
//   kotText += `Date   : ${date.toLocaleString()}\n`;
//   kotText += options?.customerName ? `Cust   : ${options.customerName}\n` : "";
//   kotText += options?.phone ? `Phone  : ${options.phone}\n` : "";
//   // Added Table No as a crucial piece of info for the kitchen
//   kotText += options?.tableNo ? `Table  : ${options.tableNo}\n` : "";
//   kotText += line("-") + "\n";
//   // The column headers are adjusted to align with the 24-column width
//   // 18 (Item Name) + 1 (Space) + 3 (Qty) + 2 (Padding/End) = 24
//   kotText += "Item Name          Qty\n";
//   kotText += line("-") + "\n";

//   /* --- KOT ITEM LIST --- */
//   cartItems.forEach((i) => {
//     // Truncate name to 18 chars and pad to ensure alignment
//     const name = i.name.substring(0, 18).padEnd(18);
//     // Pad quantity to 3 digits (right-aligned)
//     const qty = String(i.quantity).padStart(3);
//     kotText += `${name} ${qty}\n`;
//   });

//   kotText += line("-") + "\n";
//   kotText += centerText("**For Kitchen Use Only**") + "\n";
//   kotText += line("=") + "\n\n";

//   try {
//     // FONT SMALL / COMPRESSED
//     // ESC ! n (Select print mode(s)) - 0x1B 0x21 0x01 often selects compressed/small font
//     await printer.write(new Uint8Array([0x1b, 0x21, 0x01]));

//     // Remove non-ASCII characters that might cause printer errors
//     const safeText = kotText.replace(/[^\x00-\x7F]/g, " ");
//     await printer.write(safeText);

//     // ESC d n (Print and feed paper n lines) - 0x1B 0x64 0x03 feeds 3 lines
//     await printer.write(new Uint8Array([0x1b, 0x64, 0x03]));
    
//     // Optional: Send a cut command (0x1D 0x56 0x00 or 0x1D 0x56 0x01 for partial)
//     // await printer.write(new Uint8Array([0x1D, 0x56, 0x01])); // Partial cut

//     console.log("✅ KOT printed successfully.");
//     return true;
//   } catch (err) {
//     console.error("❌ KOT Print Error:", err);
//     return false;
//   }
// }

// // --- EXAMPLE USAGE ---

// const sampleCart: CartItem[] = [
//   { id: '1', name: 'Chicken Masala Dosa', price: 150, quantity: 2 },
//   { id: '2', name: 'Filter Coffee', price: 40, quantity: 4 },
//   { id: '3', name: 'Fresh Lime Soda (Sweet & Salty)', price: 75, quantity: 1 },
// ];

// const sampleOptions: BillOptions = {
//   customerName: "A. Sharma",
//   tableNo: "T14",
//   phone: "9876543210"
// };

// async function runExample() {
//   console.log("--- Running KOT Print Simulation ---");
//   const success = await printKOT(
//     sampleCart,
//     "mock-token-123",
//     "clerk-user-001",
//     sampleOptions
//   );
//   console.log(`\nFinal Result: KOT Print ${success ? 'SUCCEEDED' : 'FAILED'}`);
// }

// // To run this example, you would call runExample() in your environment.
// // For demonstration, we simulate the execution:
// runExample();















// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ToastAndroid } from "react-native";
// import RNBluetoothClassic from "react-native-bluetooth-classic";

// /* ------------------ Types ------------------ */
// export type CartItem = {
//   id: string;
//   name: string;
//   quantity: number;
// };

// export type KOTOptions = {
//   tableNo?: string;
//   customerName?: string;
//   phone?: string;
//   notes?: string;
// };

// let connectedPrinter: RNBluetoothClassic.BluetoothDevice | null = null;

// /* ------------------ Helpers ------------------ */
// const line = (char = "-", width = 32) => char.repeat(width);

// const centerText = (text: string, width = 32) => {
//   if (!text) return "";
//   if (text.length >= width) return text;
//   const pad = Math.floor((width - text.length) / 2);
//   return " ".repeat(pad) + text;
// };

// async function ensurePrinterConnected() {
//   try {
//     if (connectedPrinter && (await connectedPrinter.isConnected()))
//       return connectedPrinter;

//     const savedAddress = await AsyncStorage.getItem("saved_printer");
//     if (!savedAddress) {
//       ToastAndroid.show("⚠️ Save printer first!", ToastAndroid.SHORT);
//       return null;
//     }

//     const printer = await RNBluetoothClassic.connectToDevice(savedAddress);
//     if (!(await printer.isConnected())) return null;

//     connectedPrinter = printer;
//     return printer;
//   } catch (err) {
//     console.log("❌ Printer Error:", err);
//     return null;
//   }
// }

// /* ------------------ MAIN KOT PRINT ------------------ */
// export async function printKOT(cartItems: CartItem[], options?: KOTOptions) {
//   const printer = await ensurePrinterConnected();
//   if (!printer) return false;

//   const date = new Date();
//   const kotNo = "KOT-" + (Math.floor(Math.random() * 90000) + 10000);

//   /* ESC/POS → Small Font */
//   const SMALL_FONT = new Uint8Array([0x1b, 0x21, 0x01]);

//   /* ------------------ HEADER ------------------ */
//   let text = "";
//   text += line("=") + "\n";
//   text += centerText("KITCHEN ORDER TICKET") + "\n";
//   text += centerText("(KOT)") + "\n";
//   text += line("-") + "\n";

//   text += `KOT No : ${kotNo}\n`;
//   text += `Date   : ${date.toLocaleString()}\n`;
//   if (options?.tableNo) text += `Table  : ${options.tableNo}\n`;
//   if (options?.customerName) text += `Cust   : ${options.customerName}\n`;
//   if (options?.phone) text += `Phone  : ${options.phone}\n`;
//   if (options?.notes) text += `Notes  : ${options.notes}\n`;

//   text += line("-") + "\n";
//   text += "Item Name                 Qty\n";
//   text += line("-") + "\n";

//   /* ------------------ ITEMS ------------------ */
//   cartItems.forEach((i) => {
//     const name = i.name.substring(0, 25).padEnd(25);
//     const qty = String(i.quantity).padStart(3);
//     text += `${name}${qty}\n`;
//   });

//   text += line("-") + "\n";
//   text += centerText("** FOR KITCHEN USE ONLY **") + "\n";
//   text += line("=") + "\n\n";

//   try {
//     await printer.write(SMALL_FONT); // small font
//     await printer.write(text);
//     await printer.write(new Uint8Array([0x1b, 0x64, 0x03])); // feed 3 lines

//     console.log("✅ KOT PRINTED");
//     return true;
//   } catch (err) {
//     console.log("❌ KOT Print Error:", err);
//     return false;
//   }
// }









// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ToastAndroid } from "react-native";
// import RNBluetoothClassic from "react-native-bluetooth-classic";

// /* ------------------ Types ------------------ */
// export type CartItem = {
//   id: string;
//   name: string;
//   quantity: number;
// };

// export type KOTOptions = {
//   tableNo?: string;
//   customerName?: string;
//   phone?: string;
//   notes?: string;
// };

// let connectedPrinter: RNBluetoothClassic.BluetoothDevice | null = null;

// /* ------------------ Helpers ------------------ */
// const line = (char = "-", width = 32) => char.repeat(width);

// const centerText = (text: string, width = 32) => {
//   if (!text) return "";
//   if (text.length >= width) return text;
//   const pad = Math.floor((width - text.length) / 2);
//   return " ".repeat(pad) + text + "\n";
// };

// async function ensurePrinterConnected() {
//   try {
//     if (connectedPrinter && (await connectedPrinter.isConnected())) {
//       return connectedPrinter;
//     }

//     const savedAddress = await AsyncStorage.getItem("saved_printer");
//     if (!savedAddress) {
//       ToastAndroid.show("⚠️ Save printer first!", ToastAndroid.SHORT);
//       return null;
//     }

//     const printer = await RNBluetoothClassic.connectToDevice(savedAddress);

//     if (!(await printer.isConnected())) {
//       ToastAndroid.show("❌ Printer connection failed!", ToastAndroid.SHORT);
//       return null;
//     }

//     connectedPrinter = printer;
//     return printer;
//   } catch (err) {
//     console.log("❌ Printer Error:", err);
//     return null;
//   }
// }

// /* ------------------ MAIN KOT PRINT ------------------ */
// export async function printKOT(cartItems: CartItem[], options?: KOTOptions) {
//   const printer = await ensurePrinterConnected();
//   if (!printer) return false;

//   const date = new Date();
//   const kotNo = "KOT-" + (Math.floor(Math.random() * 90000) + 10000);

//   /* ESC/POS Small Font Command */
//   const SMALL_FONT = new Uint8Array([0x1b, 0x21, 0x01]);

//   /* ------------------ BUILD TEXT ------------------ */
//   let text = "";

//   text += line("=") + "\n";
//   text += centerText("KITCHEN ORDER TICKET");
//   text += centerText("(KOT)");
//   text += line("-") + "\n";

//   text += `KOT No : ${kotNo}\n`;
//   text += `Date   : ${date.toLocaleString()}\n`;

//   if (options?.tableNo) text += `Table  : ${options.tableNo}\n`;
//   if (options?.customerName) text += `Cust   : ${options.customerName}\n`;
//   if (options?.phone) text += `Phone  : ${options.phone}\n`;
//   if (options?.notes) text += `Notes  : ${options.notes}\n`;

//   text += line("-") + "\n";
//   text += "Item Name                 Qty\n";
//   text += line("-") + "\n";

//   /* ------------------ ITEMS ------------------ */
//   cartItems.forEach((i) => {
//     const name = i.name.substring(0, 25).padEnd(25);
//     const qty = String(i.quantity).padStart(3);
//     text += `${name}${qty}\n`;
//   });

//   text += line("-") + "\n";
//   text += centerText("** FOR KITCHEN USE ONLY **");
//   text += line("=") + "\n\n";

//   /* ------------------ SEND TO PRINTER ------------------ */
//   try {
//     await printer.write(SMALL_FONT);          // small font
//     await printer.write(text);                // text
//     await printer.write(new Uint8Array([0x1b, 0x64, 0x03])); // feed 3 lines

//     console.log("✅ KOT PRINTED");
//     return true;
//   } catch (err) {
//     console.log("❌ KOT Print Error:", err);
//     return false;
//   }
// }








// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ToastAndroid } from "react-native";
// import RNBluetoothClassic from "react-native-bluetooth-classic";

// /* ------------------ Types ------------------ */
// export type CartItem = {
//   id: string;
//   name: string;
//   quantity: number;
// };

// export type KOTOptions = {
//   tableNo?: string;
//   customerName?: string;
//   phone?: string;
//   notes?: string;
// };

// let connectedPrinter: RNBluetoothClassic.BluetoothDevice | null = null;

// /* ------------------ Helpers ------------------ */
// const line = (char = "-", width = 32) => char.repeat(width);

// const centerText = (text: string, width = 32) => {
//   if (!text) return "";
//   if (text.length >= width) return text + "\n";
//   const pad = Math.floor((width - text.length) / 2);
//   return " ".repeat(pad) + text + "\n";
// };

// /* ------------------ Safe ASCII Convert ------------------ */
// function safeText(text: string) {
//   return text.replace(/[^\x00-\x7F]/g, " ");
// }

// /* ------------------ Printer Connection ------------------ */
// async function ensurePrinterConnected() {
//   try {
//     // If already connected
//     if (connectedPrinter && (await connectedPrinter.isConnected())) {
//       return connectedPrinter;
//     }

//     const savedAddress = await AsyncStorage.getItem("saved_printer");
//     if (!savedAddress) {
//       ToastAndroid.show("⚠️ Please save printer first!", ToastAndroid.SHORT);
//       return null;
//     }

//     // Try connecting
//     const printer = await RNBluetoothClassic.connectToDevice(savedAddress);

//     if (!(await printer.isConnected())) {
//       ToastAndroid.show(
//         "❌ Unable to connect to printer!",
//         ToastAndroid.SHORT
//       );
//       return null;
//     }

//     connectedPrinter = printer;
//     return printer;
//   } catch (err) {
//     console.log("❌ Printer Connection Error:", err);
//     ToastAndroid.show("❌ Printer error!", ToastAndroid.SHORT);
//     return null;
//   }
// }

// /* ------------------ MAIN KOT PRINT ------------------ */
// export async function printKOT(cartItems: CartItem[], options?: KOTOptions) {
//   try {
//     const printer = await ensurePrinterConnected();
//     if (!printer) {
//       ToastAndroid.show("❌ Failed to connect printer!", ToastAndroid.SHORT);
//       return false;
//     }

//     const date = new Date();
//     const kotNo = "KOT-" + (Math.floor(Math.random() * 90000) + 10000);

//     const SMALL_FONT = new Uint8Array([0x1b, 0x21, 0x01]);

//     /* ------------------ BUILD TEXT ------------------ */
//     let text = "";
//     text += line("=") + "\n";
//     text += centerText("KITCHEN ORDER TICKET");
//     text += centerText("(KOT)");
//     text += line("-") + "\n";

//     text += `KOT No : ${kotNo}\n`;
//     text += `Date   : ${date.toLocaleString()}\n`;

//     if (options?.tableNo) text += `Table  : ${options.tableNo}\n`;
//     if (options?.customerName) text += `Cust   : ${options.customerName}\n`;
//     if (options?.phone) text += `Phone  : ${options.phone}\n`;
//     if (options?.notes) text += `Notes  : ${options.notes}\n`;

//     text += line("-") + "\n";
//     text += "Item Name                 Qty\n";
//     text += line("-") + "\n";

//     /* ------------------ ITEMS ------------------ */
//     cartItems.forEach((i) => {
//       const name = safeText(i.name.substring(0, 25)).padEnd(25);
//       const qty = String(i.quantity).padStart(3);
//       text += `${name}${qty}\n`;
//     });

//     text += line("-") + "\n";
//     text += centerText("** FOR KITCHEN USE ONLY **");
//     text += line("=") + "\n\n";

//     /* ------------------ PRINT ------------------ */
//     await printer.write(SMALL_FONT);
//     await printer.write(safeText(text));
//     await printer.write(new Uint8Array([0x1b, 0x64, 0x03]));

//     ToastAndroid.show("✅ KOT Printed Successfully!", ToastAndroid.SHORT);
//     console.log("✅ KOT PRINTED");

//     return true;
//   } catch (err) {
//     console.log("❌ KOT Print Error:", err);

//     ToastAndroid.show(
//       "❌ Failed to initiate KOT print!",
//       ToastAndroid.SHORT
//     );

//     return false;
//   }
// }











// import { ToastAndroid } from "react-native";
// import RNBluetoothClassic from "react-native-bluetooth-classic";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// /* ---------- Helpers ---------- */
// const centerText = (text: string, width = 32) => {
//   if (text.length >= width) return text;
//   const pad = Math.floor((width - text.length) / 2);
//   return " ".repeat(pad) + text;
// };

// const line = (c = "-", width = 32) => c.repeat(width);

// /* ---------- Ensure Printer ---------- */
// async function ensurePrinterConnected() {
//   try {
//     const saved = await AsyncStorage.getItem("saved_printer");
//     if (!saved) return null;

//     const printer = await RNBluetoothClassic.connectToDevice(saved);
//     if (!(await printer.isConnected())) return null;

//     return printer;
//   } catch (err) {
//     console.log("KOT Printer Error:", err);
//     return null;
//   }
// }

// /* ---------- MAIN KOT FUNCTION ---------- */
// export async function SimpleKOT(cartItems, token, userClerkId) {
//   try {
//     const printer = await ensurePrinterConnected();
//     if (!printer) {
//       ToastAndroid.show("⚠️ Printer not connected!", ToastAndroid.SHORT);
//       return false;
//     }

//     const date = new Date();
//     const kotNo = "KOT-" + (Math.floor(Math.random() * 90000) + 10000);

//     let kotText = "";
//     kotText += line("=");
//     kotText += "\n" + centerText("KITCHEN ORDER TICKET") + "\n";
//     kotText += line("-") + "\n";
//     kotText += `KOT No: ${kotNo}\n`;
//     kotText += `Date: ${date.toLocaleString()}\n`;
//     kotText += line("-") + "\n";

//     cartItems.forEach((i) => {
//       kotText += `${i.name}\n`;
//       kotText += `Qty: ${i.quantity}\n`;
//       kotText += line("-") + "\n";
//     });

//     kotText += centerText("PREPARE FAST") + "\n\n\n";

//     await printer.write(kotText);

//     ToastAndroid.show("🍽️ KOT Printed!", ToastAndroid.SHORT);
//     return true;
//   } catch (err) {
//     console.log("KOT ERROR:", err);
//     ToastAndroid.show("❌ Failed to print KOT!", ToastAndroid.SHORT);
//     return false;
//   }
// }
