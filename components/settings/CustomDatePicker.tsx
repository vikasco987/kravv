import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

interface CustomDatePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: string) => void;
    initialDate?: string;
    minimumDate?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    visible,
    onClose,
    onSelect,
    initialDate,
    minimumDate
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        if (visible) {
            const initial = initialDate ? new Date(initialDate) : new Date();
            setCurrentDate(initial);
            setSelectedDate(initialDate ? initial : null);
        }
    }, [visible, initialDate]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleSelectDate = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (minimumDate) {
            const min = new Date(minimumDate);
            min.setHours(0, 0, 0, 0);
            if (newDate < min) return; // Prevent selection before minimum
        }
        setSelectedDate(newDate);
    };

    const handleConfirm = () => {
        if (selectedDate) {
            // YYYY-MM-DD
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            onSelect(`${year}-${month}-${day}`);
        }
        onClose();
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }
        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const isSelected = selectedDate && 
                selectedDate.getDate() === d && 
                selectedDate.getMonth() === month && 
                selectedDate.getFullYear() === year;

            let isDisabled = false;
            if (minimumDate) {
                const min = new Date(minimumDate);
                min.setHours(0, 0, 0, 0);
                if (dateObj < min) isDisabled = true;
            }

            days.push(
                <TouchableOpacity
                    key={`day-${d}`}
                    style={[
                        styles.dayCell, 
                        isSelected && styles.selectedDayCell,
                        isDisabled && { opacity: 0.3 }
                    ]}
                    onPress={() => !isDisabled && handleSelectDate(d)}
                    disabled={isDisabled}
                >
                    <Text style={[
                        styles.dayText, 
                        isSelected && styles.selectedDayText,
                    ]}>
                        {d}
                    </Text>
                </TouchableOpacity>
            );
        }

        return days;
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={['#0EA5E9', '#10B981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        <Text style={styles.yearText}>{currentDate.getFullYear()}</Text>
                        <Text style={styles.dateText}>
                            {selectedDate ? `${DAYS[selectedDate.getDay()]}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}` : 'Select Date'}
                        </Text>
                    </LinearGradient>

                    <View style={styles.calendarBody}>
                        <View style={styles.monthSelector}>
                            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                                <Ionicons name="chevron-back" size={20} color="#111827" />
                            </TouchableOpacity>
                            <Text style={styles.monthText}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
                            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                                <Ionicons name="chevron-forward" size={20} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekDaysRow}>
                            {DAYS.map(day => (
                                <Text key={day} style={styles.weekDayText}>{day}</Text>
                            ))}
                        </View>

                        <View style={styles.daysGrid}>
                            {renderCalendar()}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                            <Text style={styles.cancelText}>CANCEL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.actionBtn}>
                            <Text style={styles.confirmText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: s(280),
        backgroundColor: '#FFFFFF',
        borderRadius: s(20),
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    headerGradient: {
        padding: s(16),
        paddingBottom: s(12),
    },
    yearText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: rf(13),
        fontWeight: '700',
        marginBottom: vs(2),
    },
    dateText: {
        color: '#FFFFFF',
        fontSize: rf(22),
        fontWeight: '900',
    },
    calendarBody: {
        paddingTop: s(12),
        paddingBottom: 0,
        paddingHorizontal: s(16),
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(10),
    },
    navBtn: {
        padding: s(4),
    },
    monthText: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#111827',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: vs(6),
    },
    weekDayText: {
        width: `${100/7}%`,
        textAlign: 'center',
        fontSize: rf(11),
        fontWeight: '800',
        color: '#9CA3AF',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100/7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
    selectedDayCell: {
        backgroundColor: '#0EA5E9',
        borderRadius: s(20),
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    dayText: {
        fontSize: rf(12),
        fontWeight: '600',
        color: '#374151',
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: s(12),
        paddingTop: 0,
        marginTop: -vs(5),
        gap: s(12),
    },
    actionBtn: {
        paddingVertical: vs(6),
        paddingHorizontal: s(10),
    },
    cancelText: {
        fontSize: rf(12),
        fontWeight: '800',
        color: '#6B7280',
    },
    confirmText: {
        fontSize: rf(12),
        fontWeight: '800',
        color: '#0EA5E9',
    }
});

