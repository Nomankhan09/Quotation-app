import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Modal,
    Animated,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
    TextInput,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Controller, useForm } from 'react-hook-form';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatToMySQL, parseDate } from '@/utils/date_format';
import { openTimePicker } from '@/utils/time_picker';
import { addTask, editTask, ITask, removeTask } from '@/store/slices/taskSlice';
import { cancelTaskNotification, scheduleTaskNotification } from '@/utils/notifications/taskNotification';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { ITaskPayload } from '@/services/taskService';
import { ILead } from '@/interface/leads';
import { Alert } from 'react-native';
import { Lead } from '@/store/slices/leadsSlice';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Priority = 'Low' | 'Medium' | 'High';

type TaskFormData = {
    title: string;
    notes: string;
    priority: Priority;
    due_date: string;
};

interface IPayload {
    modalVisible: boolean;
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onClose: () => void;
    lead?: ILead | null;
    editingTask: ITask | null;
    isTaskDirect?: boolean;
    contacts?: Lead[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITIES: { value: Priority; color: string; bg: string; icon: string }[] = [
    { value: 'Low', color: '#22c55e', bg: '#dcfce7', icon: 'arrow-down-outline' },
    { value: 'Medium', color: '#f59e0b', bg: '#fef3c7', icon: 'remove-outline' },
    { value: 'High', color: '#ef4444', bg: '#fee2e2', icon: 'arrow-up-outline' },
];

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#14b8a6', '#8b5cf6'];
const avatarColor = (id: string | number) =>
    AVATAR_COLORS[String(id).charCodeAt(0) % AVATAR_COLORS.length];

const formatToDisplay = (mysqlDate: string) => {
    const date = new Date(mysqlDate.replace(' ', 'T'));
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return (
        `${String(date.getMonth() + 1).padStart(2, '0')}/` +
        `${String(date.getDate()).padStart(2, '0')}/` +
        `${date.getFullYear()} ` +
        `${String(h).padStart(2, '0')}:` +
        `${String(minutes).padStart(2, '0')} ${ampm}`
    );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 36, color }: { name: string; size?: number; color: string }) => {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color + '22', justifyContent: 'center', alignItems: 'center',
        }}>
            <Text style={{ fontSize: size * 0.35, fontWeight: '700', color }}>{initials}</Text>
        </View>
    );
};

// ─── Contact Selector Sheet ───────────────────────────────────────────────────
const ContactSelector = ({
    visible,
    contacts,
    onSelect,
    onClose,
}: {
    visible: boolean;
    contacts: ILead[];
    onSelect: (contact: ILead | null) => void;
    onClose: () => void;
}) => {
    const [search, setSearch] = useState('');
    const slideAnim = useRef(new Animated.Value(500)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 500, duration: 220, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const filtered = contacts.filter(c =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase())
    );

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Backdrop */}
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: opacityAnim }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View style={[csStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={csStyles.handle} />

                <View style={csStyles.header}>
                    <Text style={csStyles.title}>Select Contact</Text>
                    <TouchableOpacity onPress={onClose} style={csStyles.closeBtn}>
                        <Ionicons name="close" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={csStyles.searchRow}>
                    <Ionicons name="search-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by name..."
                        placeholderTextColor="#bbb"
                        style={csStyles.searchInput}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={16} color="#bbb" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* No contact option */}
                <TouchableOpacity style={csStyles.skipRow} onPress={() => onSelect(null)}>
                    <View style={csStyles.skipIconWrap}>
                        <Ionicons name="person-remove-outline" size={18} color="#9ca3af" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={csStyles.skipName}>No Contact</Text>
                        <Text style={csStyles.skipSub}>Create task without linking a contact</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </TouchableOpacity>

                <View style={csStyles.divider} />

                <FlatList
                    data={filtered}
                    keyExtractor={item => String(item.id)}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={csStyles.contactRow} onPress={() => onSelect(item)} activeOpacity={0.7}>
                            <Avatar name={item.full_name} size={40} color={avatarColor(item.id)} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={csStyles.contactName}>{item.full_name}</Text>
                                <Text style={csStyles.contactMeta}>
                                    {[item.company, item.phone].filter(Boolean).join(' · ')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Ionicons name="people-outline" size={36} color="#e5e7eb" />
                            <Text style={{ color: '#9ca3af', marginTop: 8, fontSize: 13 }}>No contacts found</Text>
                        </View>
                    }
                />
            </Animated.View>
        </View>
    );
};

// ─── TaskForm ─────────────────────────────────────────────────────────────────
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.84;

const TaskForm = ({
    modalVisible,
    setModalVisible,
    onClose,
    lead,
    editingTask,
    isTaskDirect = false,
    contacts = [],
}: IPayload) => {
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const dispatch = useDispatch<AppDispatch>();

    // When isTaskDirect, user can pick a contact; otherwise use the passed lead
    const [selectedContact, setSelectedContact] = useState<ILead | null>(lead || null);
    const [contactSelectorVisible, setContactSelectorVisible] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TaskFormData>({
        defaultValues: { title: '', notes: '', priority: 'Medium', due_date: '' },
    });

    const selectedPriority = watch('priority');

    // ── Sync form when editingTask or modal changes ──
    useEffect(() => {
        if (editingTask) {
            reset({
                title: editingTask.title || '',
                notes: editingTask.notes || '',
                priority: (editingTask.priority as Priority) || 'Medium',
                due_date: editingTask.due_date ? formatToDisplay(editingTask.due_date) : '',
            });
            // For editing: show the task's linked contact
            const nextContact =
                contacts.find(c => Number(c.id) === Number(editingTask.contact_id)) || null;

            setSelectedContact((prev: any) => {
                if (prev?.id === nextContact?.id) return prev;
                return nextContact;
            });
        } else {
            reset({ title: '', notes: '', priority: 'Medium', due_date: '' });
            setSelectedContact(lead || null);
        }
    }, [editingTask, modalVisible]);

    // ── Sheet animation ──
    useEffect(() => {
        if (modalVisible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
                Animated.timing(backdropOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, { toValue: SHEET_HEIGHT, duration: 230, useNativeDriver: true }),
                Animated.timing(backdropOpacity, { toValue: 0, duration: 230, useNativeDriver: true }),
            ]).start();
        }
    }, [modalVisible]);



    // ── Date picker ──
    const openDatePicker = () => {
        const currentValue = watch('due_date');
        DateTimePickerAndroid.open({
            value: currentValue ? parseDate(currentValue) : new Date(),
            mode: 'date',
            is24Hour: false,
            onChange: (event, selectedDate) => {
                if (event.type === 'dismissed') return;
                if (selectedDate) {
                    openTimePicker(
                        selectedDate,
                        (field: any, value: string) => setValue(field, value),
                        'due_date'
                    );
                }
            },
        });
    };

    // ── Delete ──
    const handleDelete = async (task: ITask) => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (task.notification_id) {
                            await cancelTaskNotification(task.notification_id);
                        }

                        dispatch(removeTask(String(task.id)));
                        setModalVisible(false);
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // ── Submit ──
    const onSubmit = async (data: TaskFormData) => {
        if (!data.title.trim()) return;

        const payload: ITaskPayload = {
            contact_id: selectedContact ? selectedContact.id : null,
            title: data.title.trim(),
            status: 'pending',
            due_date: formatToMySQL(data.due_date),
            priority: data.priority,
            notes: data.notes,
        };

        let notificationId: string | null = null;
        if (data.due_date) {
            notificationId = await scheduleTaskNotification({
                id: editingTask?.id ?? 'temp',
                title: payload.title,
                due_date: data.due_date,
                priority: data.priority,
            });
        }

        if (editingTask) {
            if (editingTask.notification_id) {
                await cancelTaskNotification(editingTask.notification_id);
            }
            dispatch(editTask({
                id: String(editingTask.id),
                data: { ...payload, notification_id: notificationId },
            }));
        } else {
            dispatch(addTask({ ...payload, notification_id: notificationId }));
        }

        setModalVisible(false);
    };

    // ── Derived display values ──
    const displayContact = isTaskDirect ? selectedContact : lead;
    const headerSub = displayContact
        ? `For ${displayContact.full_name}`
        : isTaskDirect
            ? 'Choose a contact (optional)'
            : 'Create a new task';

    return (
        <View>
            <Modal
                visible={modalVisible}
                animationType="none"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1 }}>
                    {/* Backdrop */}
                    <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                    </Animated.View>

                    {/* Sheet */}
                    <View style={styles.modalContainer}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>

                            {/* Drag handle */}
                            <View style={styles.handleWrap}>
                                <View style={styles.handle} />
                            </View>

                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerLeft}>
                                    <View style={styles.headerIconWrap}>
                                        <Ionicons name="checkmark-circle" size={22} color="#6366f1" />
                                    </View>
                                    <View>
                                        <Text style={styles.headerTitle}>
                                            {editingTask ? 'Edit Task' : 'New Task'}
                                        </Text>
                                        <Text style={styles.headerSub} numberOfLines={1}>{headerSub}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                    <Ionicons name="close" size={18} color="#555" />
                                </TouchableOpacity>
                            </View>

                            {/* Scrollable form */}
                            <View style={styles.kavWrapper}>
                                <KeyboardAwareScrollView
                                    style={styles.scroll}
                                    contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
                                    enableOnAndroid
                                    extraScrollHeight={80}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >

                                    {/* ── Contact: Picker (isTaskDirect) ── */}
                                    {isTaskDirect && (
                                        <>
                                            <FieldLabel label="Related Contact" />
                                            <TouchableOpacity
                                                style={[styles.contactPicker, selectedContact && styles.contactPickerFilled]}
                                                onPress={() => setContactSelectorVisible(true)}
                                                activeOpacity={0.75}
                                            >
                                                {selectedContact ? (
                                                    /* Selected state */
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                        <Avatar
                                                            name={selectedContact.full_name}
                                                            size={36}
                                                            color={avatarColor(selectedContact.id)}
                                                        />
                                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                                            <Text style={styles.contactName}>{selectedContact.full_name}</Text>
                                                            <Text style={styles.contactMeta}>
                                                                {[selectedContact?.company, selectedContact.phone].filter(Boolean).join(' · ')}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => setSelectedContact(null)}
                                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                        >
                                                            <Ionicons name="close-circle" size={18} color="#9ca3af" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    /* Empty state */
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                        <View style={styles.contactPickerIconWrap}>
                                                            <Ionicons name="person-add-outline" size={18} color="#6366f1" />
                                                        </View>
                                                        <Text style={styles.contactPickerPlaceholder}>
                                                            Select a contact (optional)
                                                        </Text>
                                                        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        </>
                                    )}

                                    {/* ── Contact: Read-only (lead passed, not isTaskDirect) ── */}
                                    {!isTaskDirect && lead && (
                                        <>
                                            <FieldLabel label="Related Contact" />
                                            <View style={styles.readonlyInput}>
                                                <Avatar
                                                    name={lead.full_name}
                                                    size={34}
                                                    color={avatarColor(lead.id)}
                                                />
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={styles.readonlyText}>{lead.full_name}</Text>
                                                    {lead.phone && (
                                                        <Text style={styles.readonlyPhone}>{lead.phone}</Text>
                                                    )}
                                                </View>
                                            </View>
                                        </>
                                    )}

                                    {/* ── Task Title ── */}
                                    <FieldLabel label="Task Title" required />
                                    <Controller
                                        control={control}
                                        name="title"
                                        rules={{ required: 'Title is required' }}
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
                                                value={value}
                                                onChangeText={onChange}
                                                placeholder="e.g. Follow up call, Send proposal..."
                                                placeholderTextColor="#bbb"
                                                style={[styles.input, errors.title && styles.inputError]}
                                                returnKeyType="next"
                                            />
                                        )}
                                    />
                                    {errors.title && <ErrorMsg msg={errors.title.message!} />}

                                    {/* ── Due Date ── */}
                                    <FieldLabel label="Due Date" />
                                    <Controller
                                        control={control}
                                        name="due_date"
                                        rules={{ required: 'Date is required' }}
                                        render={({ field: { value } }) => (
                                            <TouchableOpacity
                                                style={[styles.dateInput, errors.due_date && styles.inputError]}
                                                onPress={openDatePicker}
                                            >
                                                <Ionicons
                                                    name="calendar-outline"
                                                    size={15}
                                                    color={value ? '#6366f1' : '#888'}
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text style={[styles.dateInputText, !value && { color: '#bbb' }]}>
                                                    {value || 'Select date & time'}
                                                </Text>
                                                {value && <Ionicons name="checkmark-circle" size={15} color="#22c55e" />}
                                            </TouchableOpacity>
                                        )}
                                    />
                                    {errors.due_date && <ErrorMsg msg={errors.due_date.message!} />}

                                    {/* ── Priority ── */}
                                    <FieldLabel label="Priority" />
                                    <View style={styles.priorityRow}>
                                        {PRIORITIES.map(p => {
                                            const active = selectedPriority === p.value;
                                            return (
                                                <TouchableOpacity
                                                    key={p.value}
                                                    style={[
                                                        styles.priorityChip,
                                                        { borderColor: active ? p.color : '#e5e7eb', backgroundColor: active ? p.bg : '#fafafa' },
                                                    ]}
                                                    onPress={() => setValue('priority', p.value)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons
                                                        name={p.icon as any}
                                                        size={14}
                                                        color={active ? p.color : '#aaa'}
                                                    />
                                                    <Text style={[styles.priorityText, { color: active ? p.color : '#888' }]}>
                                                        {p.value}
                                                    </Text>
                                                    {active && (
                                                        <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* ── Notes ── */}
                                    <FieldLabel label="Notes" />
                                    <Controller
                                        control={control}
                                        name="notes"
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
                                                value={value}
                                                onChangeText={onChange}
                                                placeholder="Add any additional notes or context..."
                                                placeholderTextColor="#bbb"
                                                multiline
                                                numberOfLines={4}
                                                textAlignVertical="top"
                                                style={[styles.input, styles.textArea]}
                                            />
                                        )}
                                    />

                                    {/* ── Action Buttons ── */}
                                    <View style={styles.sheetActions}>
                                        {editingTask && (
                                            <TouchableOpacity
                                                style={styles.deleteBtn}
                                                onPress={() => handleDelete(editingTask)}
                                            >
                                                <Ionicons name="trash-outline" size={15} color="#ef4444" />
                                                <Text style={styles.deleteBtnText}>Delete</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.saveBtn, !watch('title').trim() && styles.saveBtnDisabled]}
                                            onPress={handleSubmit(onSubmit)}
                                            disabled={!watch('title').trim()}
                                        >
                                            <Ionicons
                                                name={editingTask ? 'save-outline' : 'add-circle-outline'}
                                                size={16}
                                                color="#fff"
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={styles.saveBtnText}>
                                                {editingTask ? 'Save Changes' : 'Add Task'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                </KeyboardAwareScrollView>
                            </View>

                        </Animated.View>
                    </View>

                    {/* Contact selector - rendered inside Modal so it layers on top of sheet */}
                    {isTaskDirect && (
                        <ContactSelector
                            visible={contactSelectorVisible}
                            contacts={contacts as any}
                            onSelect={(contact) => {
                                setSelectedContact(contact);
                                setContactSelectorVisible(false);
                            }}
                            onClose={() => setContactSelectorVisible(false)}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <View style={fieldStyles.row}>
        <Text style={fieldStyles.label}>{label}</Text>
        {required && <Text style={fieldStyles.required}>*</Text>}
    </View>
);

const ErrorMsg = ({ msg }: { msg: string }) => (
    <Text style={errStyles.text}>⚠ {msg}</Text>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.48)',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        height: SHEET_HEIGHT,
        backgroundColor: '#fff',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    handleWrap: { alignItems: 'center', paddingVertical: 12 },
    handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 14,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIconWrap: {
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    headerSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
    },
    kavWrapper: { flex: 1 },
    scroll: { flex: 1 },

    // Contact picker (isTaskDirect)
    contactPicker: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: '#fafafa', marginBottom: 14,
    },
    contactPickerFilled: {
        borderColor: '#a5b4fc',
        backgroundColor: '#f5f3ff',
    },
    contactPickerIconWrap: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    contactPickerPlaceholder: { flex: 1, fontSize: 14, color: '#9ca3af' },
    contactName: { fontSize: 14, fontWeight: '600', color: '#111827' },
    contactMeta: { fontSize: 12, color: '#9ca3af', marginTop: 1 },

    // Read-only contact
    readonlyInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: '#f9fafb', marginBottom: 14,
    },
    readonlyText: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },
    readonlyPhone: { fontSize: 12, color: '#9ca3af', marginTop: 1 },

    // Inputs
    input: {
        backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 14, marginBottom: 10, color: '#111827',
    },
    inputError: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
    textArea: { height: 96, paddingTop: 12 },

    dateInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 11,
        backgroundColor: '#fafafa', marginBottom: 10,
    },
    dateInputText: { fontSize: 13, color: '#111', flex: 1 },

    // Priority
    priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    priorityChip: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 5,
        paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
    },
    priorityText: { fontSize: 13, fontWeight: '700' },
    priorityDot: { width: 6, height: 6, borderRadius: 3 },

    // Actions
    sheetActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
    deleteBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6,
        paddingVertical: 13, borderRadius: 12,
        borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2',
    },
    deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
    saveBtn: {
        flex: 2, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13, borderRadius: 12, backgroundColor: '#6366f1',
    },
    saveBtnDisabled: { backgroundColor: '#c7d2fe' },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});

const fieldStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginTop: 4 },
    label: {
        fontSize: 11, fontWeight: '700', color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: 0.6,
    },
    required: { color: '#ef4444', marginLeft: 3, fontSize: 13, fontWeight: '700' },
});

const errStyles = StyleSheet.create({
    text: { color: '#ef4444', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 2 },
});

// ─── ContactSelector styles ───────────────────────────────────────────────────
const csStyles = StyleSheet.create({
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '68%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        paddingTop: 0,
    },
    handle: {
        width: 38, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb',
        alignSelf: 'center', marginVertical: 12,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 14,
    },
    title: { fontSize: 17, fontWeight: '700', color: '#111827' },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
    },
    searchRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    skipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    skipIconWrap: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
    },
    skipName: { fontSize: 14, fontWeight: '600', color: '#374151' },
    skipSub: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 8 },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    contactName: { fontSize: 14, fontWeight: '600', color: '#111827' },
    contactMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});

export default TaskForm;