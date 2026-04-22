// LeadFollowUps.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { IFollowUp, IFollowUpFormValues, IFollowUpPayload, IFollowUpStatus, IFollowUpType } from '@/interface/followUp';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { addFollowUp, editFollowUp, loadFollowUpsByLead } from '@/store/slices/followUpSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { ILead } from '@/interface/leads';
import { openTimePicker } from '@/utils/time_picker';
import { formatDate, getDaysAgo, parseDate } from '@/utils/date_format';
// import { scheduleFollowUpNotification } from '@/utils/notifications/notifications';
// import * as Notifications from 'expo-notifications';

// ─── Type meta ───────────────────────────────────────────────────────────────
const TYPE_META: Record<IFollowUpType, { icon: string; color: string; bg: string }> = {
    Call: { icon: 'call', color: '#ef4444', bg: '#fee2e2' },
    Email: { icon: 'mail', color: '#8b5cf6', bg: '#ede9fe' },
    Meeting: { icon: 'people', color: '#f59e0b', bg: '#fef3c7' },
    Task: { icon: 'checkbox-outline', color: '#6b7280', bg: '#f3f4f6' },
};


const TYPES: IFollowUpType[] = ['Call', 'Email', 'Meeting', 'Task'];

const isOverdue = (date: Date, status: IFollowUpStatus): boolean =>
    status === 'pending' && date < new Date();

// ─── Snooze options ───────────────────────────────────────────────────────────

const SNOOZE_OPTIONS = [
    { label: '1 hour', hours: 1 },
    { label: '3 hours', hours: 3 },
    { label: 'Tomorrow', hours: 24 },
    { label: '3 days', hours: 72 },
    { label: '1 week', hours: 168 },
];

// ─── Component ────────────────────────────────────────────────────────────────

const LeadFollowUps = (lead: { lead: ILead }) => {
    const [showSchedule, setShowSchedule] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
    const [typeDropOpen, setTypeDropOpen] = useState(false);
    const [customValue, setCustomValue] = useState('1');
    const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days' | null>(null);
    const [selectedMs, setSelectedMs] = useState<number | null>(null);
    const [snoozeItem, setSnoozeItem] = useState<IFollowUp | null>(null);
    const { followUps, loading } = useSelector((state: RootState) => state.followUp);
    const dispatch = useDispatch<AppDispatch>();

    const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<IFollowUpFormValues>({
        defaultValues: { type: 'Call', title: '', notes: '', date: '' },
    });

    const selectedType = watch('type');


    // Snooze
    const getMsFromCustom = () => {
        const value = parseInt(customValue || '0', 10);

        switch (customUnit) {
            case 'minutes': return value * 60 * 1000;
            case 'hours': return value * 60 * 60 * 1000;
            case 'days': return value * 24 * 60 * 60 * 1000;
            default: return 0;
        }
    };

    const getBaseDate = () => {
        return snoozeItem?.date
            ? new Date(snoozeItem.date.replace(' ', 'T'))
            : new Date();
    };

    // ─── Date/Time Picker ──────────────────────────────────────────────────────
    const openDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: false,
            onChange: (event, selectedDate) => {
                if (event.type === 'dismissed') return;
                if (selectedDate) openTimePicker(selectedDate, setValue);
            },
        });
    };

    // ─── CRUD ──────────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingId(null);
        reset({ type: 'Call', title: '', notes: '', date: '' });
        setShowSchedule(true);
    };

    const openEdit = (item: IFollowUp) => {
        setEditingId(item.id);
        reset({ type: item.type, title: item.title, notes: item.notes, date: item.date });
        setShowSchedule(true);
    };

    const onSubmit = async (data: IFollowUpFormValues) => {

        const basePayload: IFollowUpPayload = {
            ...data,
            date: data.date,
            contact_id: Number(lead?.lead?.id),
        };

        // 🔔 1. schedule notification FIRST
        // const notificationId = await scheduleFollowUpNotification(
        //     {
        //         ...basePayload,
        //         id: editingId ?? 'temp-id',
        //         type: basePayload.type as any,
        //         title: basePayload.title,
        //     } as any,
        //     parseDate(data.date)
        // );
        // console.log('parseDate(data.date)',parseDate(data.date));

        const finalPayload: IFollowUpPayload = {
            ...basePayload,
            notification_id: null,
        };

        // 2. THEN save to DB
        try {
            if (editingId) {
                dispatch(editFollowUp({
                    id: editingId,
                    data: finalPayload
                }));
            } else {
                dispatch(addFollowUp(finalPayload));
            }
        } catch (err) {
            console.log('find err in submit follow up', err);
        }

        setShowSchedule(false);
        reset();
    };

    const markDone = (id: string) => {
        const item = followUps.find(f => f.id === id);
        if (!item) return;

        dispatch(editFollowUp({
            id,
            data: {
                ...item,
                contact_id: lead.lead.id,
                status: 'done',
            }
        }));
    };

    const undoDone = (id: string) => {
        const item = followUps.find(f => f.id === id);
        if (!item) return;

        dispatch(editFollowUp({
            id,
            data: {
                ...item,
                contact_id: lead.lead.id,
                status: 'pending',
            }
        }));
    };

    const applySnooze = async (id: string, ms?: number) => {
        const item = followUps.find(f => f.id === id);
        if (!item) return;

        // cancel old notification 
        // if (item.notification_id) {
        //     await Notifications.cancelScheduledNotificationAsync(item.notification_id);
        // }
        const snoozeMs = ms ?? getMsFromCustom();
        const baseDate = new Date(item.date.replace(' ', 'T'));
        const newDate = new Date(baseDate.getTime() + snoozeMs);

        const formattedDate = newDate
            .toLocaleString('sv-SE')
            .replace('T', ' ');

        // 🔔 schedule new one
        // const notificationId = await scheduleFollowUpNotification(
        //     item,
        //     newDate
        // );

        dispatch(editFollowUp({
            id,
            data: {
                ...item,
                contact_id: lead.lead.id,
                date: formattedDate,
                status: 'snoozed',
                notification_id: null,
            }
        }));

        setSnoozeTarget(null);
    };

    // ─── Derived ───────────────────────────────────────────────────────────────

    const overduePending = followUps.filter(f => f.status === 'pending' && isOverdue(new Date(f.date), f.status));
    const pending = followUps.filter(f => f.status === 'pending' && !isOverdue(new Date(f.date), f.status));
    const snoozed = followUps.filter(f => f.status === 'snoozed');
    const done = followUps.filter(f => f.status === 'done');

    // ─── Renderers ─────────────────────────────────────────────────────────────

    const renderCard = (item: IFollowUp) => {
        const meta = TYPE_META[item.type];
        const overdue = isOverdue(new Date(item.date), item.status);
        const isDone = item.status === 'done';
        const isSnoozed = item.status === 'snoozed';
        const parsedDate = new Date(item.date.replace(' ', 'T'));

        return (
            <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => !isDone && openEdit(item)}
                style={[
                    styles.card,
                    overdue && styles.cardOverdue,
                    isDone && styles.cardDone,
                    isSnoozed && styles.cardSnoozed,
                ]}
            >
                {/* Left accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: isDone ? '#22c55e' : overdue ? '#ef4444' : isSnoozed ? '#f59e0b' : meta.color }]} />

                <View style={styles.cardInner}>
                    {/* Top row */}
                    <View style={styles.cardTop}>
                        <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
                            <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>{item.title}</Text>
                            <Text style={styles.cardNotes} numberOfLines={1}>{item.notes}</Text>
                            <View style={styles.cardDateRow}>
                                <Ionicons name="calendar-outline" size={11} color="#aaa" />
                                <Text style={styles.cardDate}>
                                    {formatDate(new Date(item.date))}
                                    {overdue && ` (${getDaysAgo(parsedDate)})`}
                                    {isDone && ' · Done'}
                                    {isSnoozed && ' · Snoozed'}
                                </Text>
                            </View>
                        </View>

                        {/* Right actions */}
                        {isDone ? (
                            <View style={styles.doneTag}>
                                <Ionicons name="checkmark" size={12} color="#22c55e" />
                                <Text style={styles.doneTagText}>Done</Text>
                                <TouchableOpacity onPress={() => undoDone(item.id)} style={{ marginLeft: 6 }}>
                                    <Ionicons name="refresh-outline" size={13} color="#999" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.actionBtns}>
                                <TouchableOpacity style={styles.doneBtn} onPress={() => markDone(item.id)}>
                                    <Text style={styles.doneBtnText}>Done</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.snoozeBtn}
                                    onPress={() => {
                                        setSnoozeTarget(item.id);
                                        setSnoozeItem(item);
                                    }}>
                                    <Text style={styles.snoozeBtnText}>Snooze</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const TypeSelector = () => (
        <View>
            <TouchableOpacity
                style={styles.typeSelector}
                onPress={() => setTypeDropOpen(v => !v)}
                activeOpacity={0.8}
            >
                <Ionicons name={TYPE_META[selectedType].icon as any} size={15} color={TYPE_META[selectedType].color} style={{ marginRight: 8 }} />
                <Text style={styles.typeSelectorText}>{selectedType}</Text>
                <Ionicons name="chevron-down" size={14} color="#888" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {typeDropOpen && (
                <View style={styles.dropdown}>
                    {TYPES.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.dropItem, t === selectedType && styles.dropItemActive]}
                            onPress={() => { setValue('type', t); setTypeDropOpen(false); }}
                        >
                            <View style={[styles.dropItemIcon, { backgroundColor: TYPE_META[t].bg }]}>
                                <Ionicons name={TYPE_META[t].icon as any} size={13} color={TYPE_META[t].color} />
                            </View>
                            <Text style={[styles.dropItemText, t === selectedType && { color: '#fff', fontWeight: '700' }]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    // ─── Render ────────────────────────────────────────────────────────────────
    useEffect(() => {
        dispatch(loadFollowUpsByLead(lead.lead.id));
    }, []);

    useEffect(() => {
        if (snoozeTarget) {
            setSelectedMs(null);
            setCustomValue('1');
            setCustomUnit(null);
        }
    }, [snoozeTarget]);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                {/* Page header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Follow-ups</Text>
                    <TouchableOpacity style={styles.scheduleBtn} onPress={openCreate}>
                        <Ionicons name="add" size={16} color="#007AFF" />
                        <Text style={styles.scheduleBtnText}>Schedule</Text>
                    </TouchableOpacity>
                </View>

                <View>
                    {loading ? (
                        <View style={{ paddingVertical: 20 }}>
                            <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                    ) :
                        (
                            <>
                                {/* Overdue alert */}
                                {overduePending.length > 0 && (
                                    <View style={styles.overdueAlert}>
                                        <View style={styles.overdueAlertIcon}>
                                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                                        </View>
                                        <View>
                                            <Text style={styles.overdueAlertTitle}>{overduePending.length} overdue follow-up{overduePending.length > 1 ? 's' : ''}</Text>
                                            <Text style={styles.overdueAlertSub}>Action required today</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Overdue items */}
                                {overduePending.map(renderCard)}

                                {/* Upcoming */}
                                {pending.length > 0 && (
                                    <>
                                        <Text style={styles.sectionLabel}>Upcoming</Text>
                                        {pending.map(renderCard)}
                                    </>
                                )}

                                {/* Snoozed */}
                                {snoozed.length > 0 && (
                                    <>
                                        <Text style={styles.sectionLabel}>Snoozed</Text>
                                        {snoozed.map(renderCard)}
                                    </>
                                )}

                                {/* Done */}
                                {done.length > 0 && (
                                    <>
                                        <Text style={styles.sectionLabel}>Completed</Text>
                                        {done.map(renderCard)}
                                    </>
                                )}
                            </>
                        )}
                </View>


                {!loading && followUps.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={44} color="#ddd" />
                        <Text style={styles.emptyTitle}>No follow-ups yet</Text>
                        <Text style={styles.emptySub}>Tap + Schedule to add one</Text>
                    </View>
                )}

            </ScrollView>

            {/* ── Schedule / Edit Modal ── */}
            <Modal
                visible={showSchedule}
                animationType="slide"
                transparent
                onRequestClose={() => { setShowSchedule(false) }}
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowSchedule(false) }} />
                    <View style={styles.modalSheet}>
                        {/* Handle */}
                        <View style={styles.handle} />

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingId ? 'Edit follow-up' : 'Schedule follow-up'}</Text>
                            <TouchableOpacity onPress={() => { setShowSchedule(false) }}>
                                <Ionicons name="close" size={20} color="#555" />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAwareScrollView
                            enableOnAndroid
                            extraScrollHeight={30}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        >
                            {/* Type */}
                            <View style={styles.formRow}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.fieldLabel}>Type</Text>
                                    <Controller
                                        control={control}
                                        name="type"
                                        render={() => <TypeSelector />}
                                    />
                                </View>

                                {/* Date */}
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.fieldLabel}>Date & Time</Text>
                                    <Controller
                                        control={control}
                                        name="date"
                                        rules={{ required: 'Date is required' }}
                                        render={({ field: { value } }) => (
                                            <TouchableOpacity style={styles.dateInput} onPress={openDatePicker}>
                                                <Ionicons name="calendar-outline" size={15} color="#888" style={{ marginRight: 6 }} />
                                                <Text style={[styles.dateInputText, !value && { color: '#bbb' }]}>
                                                    {value || 'Select date & time'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                    {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}
                                </View>
                            </View>

                            {/* Title */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Title</Text>
                                <Controller
                                    control={control}
                                    name="title"
                                    rules={{ required: 'Title is required' }}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={[styles.textInput, errors.title && styles.inputError]}
                                            placeholder="e.g. Follow-up call"
                                            placeholderTextColor="#bbb"
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                    )}
                                />
                                {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
                            </View>

                            {/* Notes */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Notes</Text>
                                <Controller
                                    control={control}
                                    name="notes"
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={[styles.textInput, styles.textArea]}
                                            placeholder="Add any notes..."
                                            placeholderTextColor="#bbb"
                                            value={value}
                                            onChangeText={onChange}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    )}
                                />
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)}>
                                <Text style={styles.submitBtnText}>{editingId ? 'Update' : 'Schedule'}</Text>
                            </TouchableOpacity>
                        </KeyboardAwareScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── Snooze Modal ── */}
            <Modal
                visible={!!snoozeTarget}
                transparent
                animationType="fade"
                onRequestClose={() => setSnoozeTarget(null)}
            >
                <View style={styles.snoozeBackdrop}>
                    <View style={styles.snoozeSheet}>

                        <Text style={styles.snoozeTitle}>Snooze until</Text>

                        {/* Scrollable content */}
                        <KeyboardAwareScrollView
                            enableOnAndroid
                            extraScrollHeight={30}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        >
                            {/* Presets */}
                            <Text style={styles.snoozeSection}>Quick options</Text>
                            {SNOOZE_OPTIONS.map(opt => {
                                const ms = opt.hours * 60 * 60 * 1000;
                                return (
                                    <TouchableOpacity
                                        key={opt.label}
                                        style={[
                                            styles.snoozeOption,
                                            selectedMs === ms && styles.snoozeOptionActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedMs(ms);
                                            setCustomUnit(null); // deselect custom
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.snoozeOptionText,
                                                selectedMs === ms && styles.snoozeOptionTextActive,
                                            ]}
                                        >
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Custom */}
                            <Text style={styles.snoozeSection}>Custom</Text>

                            <View style={styles.unitRow}>
                                {(['minutes', 'hours', 'days'] as const).map(unit => (
                                    <TouchableOpacity
                                        key={unit}
                                        style={[
                                            styles.unitBtn,
                                            customUnit === unit && styles.unitBtnActive,
                                        ]}
                                        onPress={() => {
                                            setCustomUnit(unit);
                                            setSelectedMs(null); // deselect preset
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.unitText,
                                                customUnit === unit && styles.unitTextActive,
                                            ]}
                                        >
                                            {unit}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Input only shows when a custom unit is picked */}
                            {customUnit !== null && (
                                <TextInput
                                    value={String(customValue)}
                                    keyboardType="numeric"
                                    onChangeText={(v) => {
                                        if (/^\d*$/.test(v)) {
                                            setCustomValue(v);
                                        }
                                    }}
                                    style={[styles.customInput, { marginTop: 10 }]}
                                    autoFocus
                                />
                            )}

                            {/* Preview */}
                            <Text style={styles.previewText}>
                                Snoozed until:{' '}
                                {formatDate(
                                    new Date(getBaseDate().getTime() + (selectedMs ?? getMsFromCustom()))
                                )}
                            </Text>
                        </KeyboardAwareScrollView>

                        {/* Actions — pinned outside scroll, always visible */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setSnoozeTarget(null);
                                    setSelectedMs(null);
                                    setCustomUnit(null);
                                }}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => {
                                    const ms = selectedMs ?? getMsFromCustom();
                                    applySnooze(snoozeTarget!, ms);
                                    setCustomUnit(null);
                                    setSelectedMs(null);
                                }}
                            >
                                <Text style={styles.applyText}>Apply</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },

    pageHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    pageTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
    scheduleBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#EAF2FF', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20,
    },
    scheduleBtnText: { color: '#007AFF', fontWeight: '700', fontSize: 14, marginLeft: 4 },

    // Overdue alert
    overdueAlert: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginBottom: 8,
        backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca',
        borderRadius: 14, padding: 14, gap: 12,
    },
    overdueAlertIcon: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center',
    },
    overdueAlertTitle: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
    overdueAlertSub: { fontSize: 12, color: '#f87171', marginTop: 1 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', color: '#aaa',
        textTransform: 'uppercase', letterSpacing: 0.8,
        marginHorizontal: 16, marginTop: 16, marginBottom: 6,
    },

    // Card
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16, marginBottom: 10,
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardOverdue: { borderColor: '#fecaca' },
    cardDone: { borderColor: '#bbf7d0', opacity: 0.85 },
    cardSnoozed: { borderColor: '#fde68a' },
    cardAccent: { width: 4 },
    cardInner: { flex: 1, padding: 14 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    typeIcon: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
    cardTitleDone: { textDecorationLine: 'line-through', color: '#999' },
    cardNotes: { fontSize: 12, color: '#888', marginTop: 2 },
    cardDateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
    cardDate: { fontSize: 11, color: '#aaa' },

    // Actions
    actionBtns: { gap: 6 },
    doneBtn: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    },
    doneBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },
    snoozeBtn: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    },
    snoozeBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },
    doneTag: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
    doneTagText: { fontSize: 12, fontWeight: '700', color: '#22c55e', marginLeft: 2 },

    // Empty state
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#ccc', marginTop: 12 },
    emptySub: { fontSize: 13, color: '#ddd', marginTop: 4 },

    // Schedule Modal
    modalBackdrop: {
        flex: 1, justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalSheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 32,
    },
    handle: {
        width: 36, height: 4, backgroundColor: '#ddd', borderRadius: 2,
        alignSelf: 'center', marginTop: 10, marginBottom: 4,
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14,
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: '#111' },

    formRow: { flexDirection: 'row', gap: 12 },
    formGroup: { marginBottom: 14 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

    // Type selector
    typeSelector: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e5e7eb',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#fafafa', minWidth: 120,
    },
    typeSelectorText: { fontSize: 14, fontWeight: '600', color: '#111' },
    dropdown: {
        position: 'absolute', top: 44, left: 0, right: 0, zIndex: 99,
        backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
    },
    dropItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 11,
    },
    dropItemActive: { backgroundColor: '#3b82f6' },
    dropItemIcon: {
        width: 26, height: 26, borderRadius: 7,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    dropItemText: { fontSize: 14, fontWeight: '600', color: '#333' },

    // Date input
    dateInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e5e7eb',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#fafafa',
    },
    dateInputText: { fontSize: 13, color: '#111', flex: 1 },

    textInput: {
        borderWidth: 1.5, borderColor: '#e5e7eb',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
        fontSize: 14, color: '#111', backgroundColor: '#fafafa',
    },
    textArea: { height: 72, textAlignVertical: 'top' },
    inputError: { borderColor: '#ef4444' },
    errorText: { fontSize: 11, color: '#ef4444', marginTop: 4 },

    submitBtn: {
        backgroundColor: '#007AFF', paddingVertical: 14,
        borderRadius: 14, alignItems: 'center', marginTop: 6,
    },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Snooze Modal
    snoozeCancelBtn: {
        alignItems: 'center', paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4,
    },
    snoozeCancelText: { fontSize: 15, color: '#ef4444', fontWeight: '700' },
    snoozeBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    snoozeSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '80%',        // ← prevent full screen takeover
        flexDirection: 'column', // ← stack scroll + buttons vertically
    },
    snoozeTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    snoozeSection: {
        fontSize: 13,
        color: '#888',
        marginTop: 10,
        marginBottom: 6,
    },
    snoozeOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    snoozeOptionText: {
        fontSize: 15,
    },
    customRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    customInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        width: 70,
        marginRight: 10,
        textAlign: 'center',
    },
    unitRow: {
        flexDirection: 'row',
    },
    unitBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        marginRight: 6,
    },
    unitBtnActive: {
        backgroundColor: '#007AFF',
    },
    unitText: {
        color: '#555',
    },
    unitTextActive: {
        color: '#fff',
    },
    previewText: {
        marginTop: 10,
        fontSize: 13,
        color: '#666',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    cancelText: {
        color: '#555',
        fontWeight: '600',
        fontSize: 15,
    },
    applyBtn: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    snoozeOptionActive: {
        backgroundColor: '#e6f0ff',
    },
    snoozeOptionTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default LeadFollowUps;