import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    NativeModules,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

interface VoiceOrderProps {
    visible: boolean;
    onClose: () => void;
    menus: any[];
    onItemMatched: (item: any) => void;
}

const VoiceOrder = ({ visible, onClose, menus, onItemMatched }: VoiceOrderProps) => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [matchStatus, setMatchStatus] = useState<'idle' | 'matching' | 'success' | 'fail'>('idle');
    const [voiceLoaded, setVoiceLoaded] = useState(false);

    useEffect(() => {
        // Direct event listening from Native bridge
        const { DeviceEventEmitter } = require('react-native');
        
        const subscriptions = [
            DeviceEventEmitter.addListener('onSpeechStart', () => setIsListening(true)),
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
                
                // 7 is 'No Match', 11 is 'Didn't understand'
                if (code.includes('7') || code.includes('11') || message.includes('No match') || message.includes('understand')) {
                    console.log("Speech recognition could not match or understand the input.");
                } else {
                    console.error("Native Speech Error:", message);
                }
                
                setIsListening(false);
                setMatchStatus('fail');
            })
        ];

        const initVoice = async () => {
             // We know RCTVoice is true from logs, so we'll use it directly
            const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
            
            if (!nativeBridge) {
                console.warn("Voice: Direct bridge not found.");
                setVoiceLoaded(false);
                return;
            }

            try {
                setVoiceLoaded(true);
            } catch (err) {
                console.warn("Voice initialization exception.");
                setVoiceLoaded(false);
            }
        };

        if (visible) {
            setRecognizedText('');
            setMatchStatus('idle');
            initVoice();
        }

        return () => {
            subscriptions.forEach(sub => sub.remove());
            if (Voice && typeof Voice.destroy === 'function') {
                Voice.destroy().catch(() => {});
            }
        };
    }, [visible, menus]);

    const findMatch = useCallback((text: string) => {
        setMatchStatus('matching');
        const query = text.toLowerCase().trim();

        let bestMatch = null;
        let highestScore = 0;

        menus.forEach(cat => {
            if (cat.items) {
                cat.items.forEach((item: any) => {
                    const itemName = item.name.toLowerCase();
                    if (query.includes(itemName) || itemName.includes(query)) {
                        const score = itemName.length / query.length;
                        if (score > highestScore) {
                            highestScore = score;
                            bestMatch = item;
                        }
                    }
                });
            }
        });

        if (bestMatch) {
            setMatchStatus('success');
            onItemMatched(bestMatch);
            Vibration.vibrate(100);
            setTimeout(() => {
                onClose();
            }, 1000);
        } else {
            setMatchStatus('fail');
        }
    }, [menus, onItemMatched, onClose]);

    const startListening = async () => {
        setRecognizedText('');
        setMatchStatus('idle');

        try {
            const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
            if (!nativeBridge) {
                throw new Error("Native voice bridge missing");
            }

            // Safety: Try to cancel any existing session before starting
            if (typeof nativeBridge.cancelSpeech === 'function') {
                try {
                    await nativeBridge.cancelSpeech(() => {});
                } catch (e) {}
            }

            // Using direct bridge call for RN 0.81 compatibility
            // The native method expects: (locale, options, callback)
            if (typeof nativeBridge.startSpeech === 'function') {
                console.log("Starting speech via direct bridge call with required options");
                const options = {
                    EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
                    EXTRA_MAX_RESULTS: 5,
                    EXTRA_PARTIAL_RESULTS: true,
                    REQUEST_PERMISSIONS_AUTO: true
                };
                await nativeBridge.startSpeech('en-IN', options, () => {});
                setIsListening(true);
            } else {
                console.log("Starting speech via library");
                await Voice.start('en-IN');
                setIsListening(true);
            }
        } catch (e: any) {
            console.error("Direct Speech start failed:", e.message);
            setIsListening(false);
            setMatchStatus('fail');
            Vibration.vibrate([0, 100, 50, 100]);
        }
    };

    const stopListening = async () => {
        try {
            const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
            if (nativeBridge && typeof nativeBridge.stopSpeech === 'function') {
                console.log("Stopping speech via direct bridge call");
                await nativeBridge.stopSpeech(() => {});
            } else if (Voice) {
                await Voice.stop();
            }
            setIsListening(false);
        } catch (e) {
            console.error("Stop speech error:", e);
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
                                <Ionicons
                                    name={isListening ? "mic" : "mic-outline"}
                                    size={rf(40)}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                            {isListening && <View style={styles.pulseRing} />}
                        </View>

                        <Text style={styles.instruction}>
                            {!voiceLoaded ? "Voice not available in this build" : (isListening ? "Listening..." : "Tap to Speak Item Name")}
                        </Text>

                        {/* Result Area (Recognized text) */}
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

                        {/* Suggestions Area: Starts empty, shows spoken word, resets on reopen */}
                        <View style={styles.tipsContainer}>
                            <Text style={styles.tipTitle}>Try speaking from your menu:</Text>
                            {recognizedText ? (
                                <Text style={styles.tipText}>• "{recognizedText}"</Text>
                            ) : null}
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
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: s(30),
        borderTopRightRadius: s(30),
        paddingBottom: Platform.OS === 'ios' ? vs(40) : vs(20),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: vs(15),
        paddingHorizontal: s(20),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeHeaderBtn: {
        padding: s(5)
    },
    content: {
        alignItems: 'center',
        padding: s(30),
    },
    micWrapper: {
        width: s(100),
        height: s(100),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(15),
    },
    micBtn: {
        width: s(70),
        height: s(70),
        borderRadius: s(35),
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 5,
    },
    micBtnActive: {
        backgroundColor: '#ef4444',
    },
    pulseRing: {
        position: 'absolute',
        width: s(90),
        height: s(90),
        borderRadius: s(45),
        borderWidth: 2,
        borderColor: '#ef4444',
        opacity: 0.5,
    },
    instruction: {
        fontSize: rf(14),
        color: '#64748b',
        fontWeight: '600',
        marginBottom: vs(10),
    },
    resultBox: {
        height: vs(50),
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    speechText: {
        fontSize: rf(15),
        color: '#1e293b',
        fontWeight: '500',
        fontStyle: 'italic',
        marginBottom: vs(5),
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ecfdf5', // Soft green bg
        paddingVertical: vs(8),
        paddingHorizontal: s(20),
        borderRadius: s(25),
        borderWidth: 1,
        borderColor: '#10b981',
        gap: s(8),
        // Premium Elevation
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginTop: vs(5),
    },
    statusLabel: {
        fontSize: rf(14),
        fontWeight: 'bold',
    },
    tipsContainer: {
        backgroundColor: '#f8fafc',
        padding: s(15),
        borderRadius: s(12),
        width: '100%',
        marginTop: vs(5),
    },
    tipTitle: {
        fontSize: rf(12),
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: vs(2),
    },
    tipText: {
        fontSize: rf(11),
        color: '#64748b',
    },
    doneBtn: {
        marginHorizontal: s(20),
        backgroundColor: '#111827',
        paddingVertical: vs(12),
        borderRadius: s(15),
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: rf(15),
        fontWeight: 'bold',
    }
});

export default VoiceOrder;
