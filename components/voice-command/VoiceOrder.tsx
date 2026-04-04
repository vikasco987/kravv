import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    NativeModules,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

interface VoiceOrderProps {
    visible: boolean;
    onClose: () => void;
    menus: any[];
    onItemMatched: (item: any, quantity: number) => void;
    onSaveRequested?: (items: any[], total: number) => void;
    onKOTRequested?: (items: any[], total: number) => void;
    onBillRequested?: (items: any[], total: number) => void;
}

// Global state trackers to prevent double-speaking across component re-renders
let globalHasSpoken = false;
let globalHasAdded = false; // Prevent adding same item twice in one session
let globalLastSpokenTime = 0;

const VoiceOrder = ({
    visible,
    onClose,
    menus,
    onItemMatched,
    onSaveRequested,
    onKOTRequested,
    onBillRequested
}: VoiceOrderProps) => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [matchStatus, setMatchStatus] = useState<'idle' | 'matching' | 'success' | 'fail'>('idle');
    const [voiceLoaded, setVoiceLoaded] = useState(false);

    const findMatch = useCallback((text: string) => {
        setMatchStatus('matching');
        const query = text.toLowerCase().trim();
        const words = query.split(/\s+/);

        const QUANTITY_MAP: Record<string, number> = {
            'ek': 1, 'one': 1, '1': 1, 'do': 2, 'two': 2, '2': 2,
            'teen': 3, 'three': 3, '3': 3, 'char': 4, 'four': 4, '4': 4,
            'paanch': 5, 'five': 5, '5': 5, 'che': 6, 'six': 6, '6': 6,
            'saat': 7, 'seven': 7, '7': 7, 'aath': 8, 'eight': 8, '8': 8,
            'nau': 9, 'nine': 9, '9': 9, 'dus': 10, 'ten': 10, '10': 10
        };

        // Helper for Menu matching (Can match Items OR whole Categories)
        function findBestMatchInMenu(searchQuery: string) {
            const q = searchQuery.trim().toLowerCase().replace(/[^\w\s]/gi, ''); // Clean junk
            if (!q || q.length < 2) return null;

            // 1. PRIORITIZE CATEGORY MATCH (Flexible/Fuzzy)
            let bestCat = null;
            let bestCatScore = 0;

            for (let cat of menus) {
                const catName = (cat.name || "").toLowerCase().replace(/[^\w\s]/gi, '');
                if (catName === q || catName.includes(q) || q.includes(catName)) {
                    const score = Math.max(q.length / catName.length, catName.length / q.length);
                    if (score > bestCatScore) {
                        bestCatScore = score;
                        bestCat = cat;
                    }
                }
            }

            if (bestCat && bestCatScore > 0.4) {
                return { isCategory: true, items: bestCat.items || [], name: bestCat.name };
            }

            // 2. Fallback: MATCH INDIVIDUAL ITEM
            let bestItem = null;
            let highestItemScore = 0;
            menus.forEach(cat => {
                if (cat.items) {
                    cat.items.forEach((item: any) => {
                        const itemName = item.name.toLowerCase().replace(/[^\w\s]/gi, '');
                        if (q.includes(itemName) || itemName.includes(q)) {
                            const score = Math.max(q.length / itemName.length, itemName.length / q.length);
                            if (score > highestItemScore) {
                                highestItemScore = score;
                                bestItem = item;
                            }
                        }
                    });
                }
            });
            return bestItem;
        }

        // --- SPECIAL COMMAND: SELECT ALL ITEMS ---
        // Clean query of all dots and punctuation for robust matching
        const cleanQuery = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

        const allTriggers = ['select all', 'add all', 'all item', 'all items', 'all select', 'all category', 'all categories', 'pura select', 'complete select', 'entire menu'];
        const hindiTriggers = ['saare item', 'sare item', 'saare items', 'sare items', 'saari item', 'sari item', 'saari list', 'sabhi item', 'sab item', 'sab select', 'saare select', 'sare select', 'pure item', 'pura item', 'saare category', 'sare category', 'pura category', 'सारे आइटम', 'सभी आइटम', 'सब सेलेक्ट', 'सब आइटम', 'सारे केटेगरी'];

        let isSelectAll = allTriggers.some(t => cleanQuery.includes(t)) ||
            hindiTriggers.some(t => cleanQuery.includes(t)) ||
            (cleanQuery.includes('all') && cleanQuery.includes('select')) ||
            (cleanQuery.includes('saare') && cleanQuery.includes('select')) ||
            (cleanQuery.includes('sab') && cleanQuery.includes('select'));

        // SAFETY: Direct search for Category name existence in query
        const hasSpecificCategory = menus.some(cat => {
            const catName = (cat.name || "").toLowerCase().replace(/[^\w\s]/gi, '');
            return catName.length > 2 && cleanQuery.includes(catName);
        });

        if (isSelectAll && hasSpecificCategory) {
            isSelectAll = false;
        }

        // --- NEW ACTIONS DETECTION ---
        const shouldSave = ['save', 'hold', 'rakh lo', 'rakho', 'karo save'].some(k => cleanQuery.includes(k));
        const shouldKOT = ['kot', 'kitchen', 'parcha', 'parchi', 'ticket'].some(k => cleanQuery.includes(k));
        const shouldBill = ['bill', 'bhugtan', 'payment', 'final', 'print bill'].some(k => cleanQuery.includes(k)) && !shouldKOT;
        const shouldGenericPrint = ['print', 'nikalo', 'generate'].some(k => cleanQuery.includes(k)) && !shouldBill && !shouldKOT;

        const matches: Array<{ item: any, qty: number, categoryName?: string }> = [];
        let currentQty = 1;
        let currentSearchWords: string[] = [];

        if (isSelectAll) {
            // Collect EVERY item from EVERY category
            menus.forEach(cat => {
                if (cat.items && Array.isArray(cat.items)) {
                    cat.items.forEach((item: any) => {
                        matches.push({ item, qty: 1, categoryName: 'All Items' });
                    });
                }
            });
        } else {
            const processMatch = (match: any, qty: number) => {
                if (match && match.isCategory) {
                    match.items.forEach((item: any) => {
                        matches.push({ item, qty: 1, categoryName: match.name });
                    });
                } else if (match) {
                    matches.push({ item: match, qty: qty });
                }
            };

            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const qtyValue = QUANTITY_MAP[word];

                if (qtyValue !== undefined) {
                    if (currentSearchWords.length > 0) {
                        const match = findBestMatchInMenu(currentSearchWords.join(' '));
                        processMatch(match, currentQty);
                        currentSearchWords = [];
                    }
                    currentQty = qtyValue;
                } else if (!['aur', 'and', 'select', 'add', 'items', 'item', 'karo', 'ke', 'ka', 'category', 'saare', 'sare', 'sabhi', 'sab', 'print', 'karo', 'save', 'bill', 'kot'].includes(word.toLowerCase())) {
                    currentSearchWords.push(word);
                }
            }

            // Final item process
            if (currentSearchWords.length > 0) {
                const match = findBestMatchInMenu(currentSearchWords.join(' '));
                processMatch(match, currentQty);
            }
        }

        if (matches.length > 0) {
            setMatchStatus('success');
            const now = Date.now();

            // 1. ACTION: Process all items (Once per session)
            if (!globalHasAdded) {
                globalHasAdded = true;
                matches.forEach(m => onItemMatched(m.item, m.qty));
                Vibration.vibrate(100);

                // Prepare processed items list for immediate save/print actions
                // This bypasses the async state lag
                const processedItemsSnapshot = matches.map(m => ({
                    ...m.item,
                    quantity: m.qty
                }));
                const totalSnapshot = processedItemsSnapshot.reduce((s, i) => s + ((i.price || 0) * i.quantity), 0);

                // Small delay to let parent process cart updates
                setTimeout(() => {
                    if (shouldSave && onSaveRequested) onSaveRequested(processedItemsSnapshot, totalSnapshot);
                    if (shouldKOT || shouldGenericPrint) {
                        if (onKOTRequested) onKOTRequested(processedItemsSnapshot, totalSnapshot);
                    }
                    if (shouldBill && onBillRequested) onBillRequested(processedItemsSnapshot, totalSnapshot);
                }, 800);
            }

            // 2. SPEECH: Collective Verbal confirmation
            if (!globalHasSpoken && (now - globalLastSpokenTime) > 2000) {
                globalHasSpoken = true;
                globalLastSpokenTime = now;

                try {
                    const ExpoSpeech = require('expo-speech');
                    if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
                        // Intelligent Hybrid Confirmation Text
                        const processedGroups: string[] = [];
                        const categoriesSeen = new Set<string>();

                        matches.forEach(m => {
                            if ((m as any).categoryName && (m as any).categoryName !== 'All Items') {
                                if (!categoriesSeen.has((m as any).categoryName)) {
                                    processedGroups.push(`all items from ${(m as any).categoryName}`);
                                    categoriesSeen.add((m as any).categoryName);
                                }
                            } else if ((m as any).categoryName !== 'All Items') {
                                processedGroups.push(m.qty > 1 ? `${m.qty} ${m.item.name}` : m.item.name);
                            }
                        });

                        let confirmText = "";
                        if (isSelectAll) {
                            confirmText = `Successfully added all ${matches.length} items from your entire menu to the cart.`;
                        } else if (categoriesSeen.size === 1) {
                            const catName = Array.from(categoriesSeen)[0];
                            confirmText = `Successfully added all items from the ${catName} category to your cart.`;
                        } else {
                            confirmText = "Successfully added " + processedGroups.join(" and ");
                        }

                        if (shouldSave) confirmText += " also saved order.";
                        if (shouldKOT || shouldGenericPrint) confirmText += " and printing kitchen ticket.";
                        if (shouldBill) confirmText += " and generating final bill.";

                        ExpoSpeech.speak(confirmText, {
                            language: 'hi-IN',
                            pitch: 1.0,
                            rate: 0.9,
                        });
                    }
                } catch (speakError) { }
            }

            let recognizedLabel = "";
            if (matches.length > 5) {
                recognizedLabel = `Added ${matches.length} Items`;
            } else {
                recognizedLabel = "Added: " + matches.map(m => `${m.qty}x ${m.item.name}`).join(', ');
            }
            if (shouldSave) recognizedLabel += " (Saved)";
            if (shouldKOT || shouldGenericPrint) recognizedLabel += " (KOT...)";
            if (shouldBill) recognizedLabel += " (Bill...)";
            setRecognizedText(recognizedLabel);

            // Increased timeout so processing isn't cut off early
            setTimeout(() => {
                if (visible) onClose();
            }, 5000);
        } else {
            setMatchStatus('fail');
            const now = Date.now();
            if (!globalHasSpoken && (now - globalLastSpokenTime) > 2000) {
                globalHasSpoken = true;
                globalLastSpokenTime = now;
                try {
                    const ExpoSpeech = require('expo-speech');
                    if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
                        ExpoSpeech.speak("Sorry, I could not find those items in your menu. please try again.", {
                            language: 'hi-IN',
                            pitch: 1.0,
                            rate: 0.9,
                        });
                    }
                } catch (e) { }
            }
        }
    }, [menus, onItemMatched, onClose, visible, onSaveRequested, onKOTRequested, onBillRequested]);

    useEffect(() => {
        const { DeviceEventEmitter } = require('react-native');
        let subscriptions: any[] = [];

        const initVoice = async () => {
            const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
            if (!nativeBridge) {
                setVoiceLoaded(false);
                return;
            }
            setVoiceLoaded(true);
        };

        if (visible) {
            setRecognizedText('');
            setMatchStatus('idle');
            initVoice();

            subscriptions = [
                DeviceEventEmitter.addListener('onSpeechStart', () => {
                    setIsListening(true);
                    globalHasSpoken = false;
                    globalHasAdded = false;
                    globalLastSpokenTime = 0;
                }),
                DeviceEventEmitter.addListener('onSpeechEnd', () => setIsListening(false)),
                DeviceEventEmitter.addListener('onSpeechResults', (e: any) => {
                    if (e.value && e.value.length > 0) {
                        const text = e.value[0];
                        setRecognizedText(text);
                        findMatch(text);
                    }
                }),
                DeviceEventEmitter.addListener('onSpeechPartialResults', (e: any) => {
                    if (e.value && e.value.length > 0) {
                        setRecognizedText(e.value[0]);
                    }
                }),
                DeviceEventEmitter.addListener('onSpeechError', (e: any) => {
                    const code = e.error?.code || "";
                    const message = e.error?.message || "";
                    if (code.includes('5') || code.includes('7') || code.includes('11')) {
                        // Silent
                    } else if (visible && !code.includes('5')) {
                        console.log("Voice Note:", message);
                    }
                    setIsListening(false);
                    setMatchStatus('fail');
                })
            ];
        }

        return () => {
            subscriptions.forEach(sub => sub.remove());
        };
    }, [visible, menus, findMatch, onItemMatched, onClose]);

    const startListening = async () => {
        setRecognizedText('');
        setMatchStatus('idle');
        try {
            const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;

            // Safety: Try to cancel any existing session before starting
            if (typeof nativeBridge.cancelSpeech === 'function') {
                try {
                    await new Promise((resolve) => {
                        nativeBridge.cancelSpeech(() => resolve(true));
                        setTimeout(() => resolve(true), 200); // safety timeout
                    });
                    // Small delay to allow bridge to cleanup
                    await new Promise(resolve => setTimeout(resolve, 350));
                } catch (e) { }
            }

            // Using direct bridge call for RN 0.81 compatibility
            if (nativeBridge && typeof nativeBridge.startSpeech === 'function') {
                console.log("Starting speech via direct bridge call");
                const options = {
                    EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
                    EXTRA_MAX_RESULTS: 5,
                    EXTRA_PARTIAL_RESULTS: true,
                    REQUEST_PERMISSIONS_AUTO: true
                };

                // Force a small additional prep delay
                await new Promise(resolve => setTimeout(resolve, 100));

                await nativeBridge.startSpeech('en-IN', options, () => { });
                console.log("🎤 Voice Recording Started...");
                setIsListening(true);
            }
        } catch (e) {
            setIsListening(false);
            setMatchStatus('fail');
        }
    };

    const stopListening = async () => {
        try {
            const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
            if (nativeBridge && typeof nativeBridge.stopSpeech === 'function') {
                console.log("🎤 Voice Recording Stopped.");
                await nativeBridge.stopSpeech(() => { });
            }
            setIsListening(false);
        } catch (e) {
            setIsListening(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Voice Command</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn}>
                            <Ionicons name="close" size={rf(22)} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        <View style={styles.micWrapper}>
                            <TouchableOpacity
                                onPress={isListening ? stopListening : startListening}
                                style={[styles.micBtn, isListening && styles.micBtnActive, !voiceLoaded && { backgroundColor: '#94a3b8' }]}
                                disabled={!voiceLoaded}
                            >
                                <Ionicons name={isListening ? "mic" : "mic-outline"} size={rf(40)} color="#fff" />
                            </TouchableOpacity>
                            {isListening && <View style={styles.pulseRing} />}
                        </View>
                        <Text style={styles.instruction}>
                            {!voiceLoaded ? "Voice not initialized" : (isListening ? "Listening..." : "Tap to Speak Item Name")}
                        </Text>
                        <View style={styles.resultBox}>
                            {matchStatus === 'matching' && <ActivityIndicator color="#6366f1" />}
                            {matchStatus === 'success' && (
                                <View style={styles.statusRow}>
                                    <Ionicons name="checkmark-circle" size={rf(20)} color="#10b981" />
                                    <Text style={[styles.statusLabel, { color: '#10b981' }]}>Item Added!</Text>
                                </View>
                            )}
                            {matchStatus === 'fail' && recognizedText && (
                                <View style={styles.statusRow}>
                                    <Ionicons name="alert-circle" size={rf(20)} color="#ef4444" />
                                    <Text style={[styles.statusLabel, { color: '#ef4444' }]}>No Item Matched</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.tipsContainer}>
                            <Text style={styles.tipTitle}>Spoken:</Text>
                            {recognizedText ? <Text style={styles.tipText}>"{recognizedText}"</Text> : null}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                        <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#fff', borderTopLeftRadius: s(30), borderTopRightRadius: s(30), paddingBottom: vs(30) },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: vs(15), paddingHorizontal: s(20), borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: rf(18), fontWeight: 'bold', color: '#1e293b' },
    closeHeaderBtn: { padding: s(5) },
    content: { alignItems: 'center', padding: s(30) },
    micWrapper: { width: s(100), height: s(100), justifyContent: 'center', alignItems: 'center', marginBottom: vs(15) },
    micBtn: { width: s(70), height: s(70), borderRadius: s(35), backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 5 },
    micBtnActive: { backgroundColor: '#ef4444' },
    pulseRing: { position: 'absolute', width: s(90), height: s(90), borderRadius: s(45), borderWidth: 2, borderColor: '#ef4444', opacity: 0.5 },
    instruction: { fontSize: rf(14), color: '#64748b', fontWeight: '600', marginBottom: vs(10) },
    resultBox: { height: vs(50), alignItems: 'center', justifyContent: 'center', width: '100%' },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfdf5', paddingVertical: vs(8), paddingHorizontal: s(20), borderRadius: s(25), borderWidth: 1, borderColor: '#10b981', gap: s(8), elevation: 3, marginTop: vs(5) },
    statusLabel: { fontSize: rf(14), fontWeight: 'bold' },
    tipsContainer: { backgroundColor: '#f8fafc', padding: s(15), borderRadius: s(12), width: '100%', marginTop: vs(5) },
    tipTitle: { fontSize: rf(12), fontWeight: 'bold', color: '#475569', marginBottom: vs(2) },
    tipText: { fontSize: rf(11), color: '#64748b' },
    doneBtn: { marginHorizontal: s(20), backgroundColor: '#111827', paddingVertical: vs(12), borderRadius: s(s(15)), alignItems: 'center', marginBottom: vs(20) },
    doneBtnText: { color: '#fff', fontSize: rf(15), fontWeight: 'bold' }
});

export default VoiceOrder;
