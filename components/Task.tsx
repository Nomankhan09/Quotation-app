import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { openTimePicker } from '@/utils/time_picker';
// import { addTask } from '@/store/taskSlice'; // ← uncomment and point to your slice

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'Low' | 'Medium' | 'High';

type TaskFormData = {
  title: string;
  notes: string;
  priority: Priority;
  due_date: string;
};

type TaskBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  contact?: { id?: string | number; full_name?: string; phone?: string } | null;
  onSave?: (data: TaskFormData & { contactId?: string | number; contactName?: string }) => void;
};

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITIES: { value: Priority; color: string; bg: string; icon: string }[] = [
  { value: 'Low', color: '#22c55e', bg: '#dcfce7', icon: 'arrow-down-outline' },
  { value: 'Medium', color: '#f59e0b', bg: '#fef3c7', icon: 'remove-outline' },
  { value: 'High', color: '#ef4444', bg: '#fee2e2', icon: 'arrow-up-outline' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskBottomSheet({
  open,
  onClose,
  contact,
  onSave,
}: TaskBottomSheetProps) {
  const dispatch = useDispatch();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      notes: '',
      priority: 'Medium',
      due_date: '',
    },
  });

  const selectedPriority = watch('priority');

  const openDatePicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(),
      mode: 'date',
      is24Hour: false,
      onChange: (event, selectedDate) => {
        if (event.type === 'dismissed') return;

        if (selectedDate) {
          openTimePicker(selectedDate,setValue);
        }
      },
    });
  };

  // ── Animation ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setSaved(false);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setTimeout(() => reset(), 100));
    }
  }, [open]);

  // ── Save handler ───────────────────────────────────────────────────────────
  const onSubmit = async (data: TaskFormData) => {
    setSaving(true);

    const taskPayload = {
      ...data,
      contact_id: contact?.id,
      status: 'pending',
    };

    try {
      // ── Dispatch to Redux store ──
      // dispatch(addTask(taskPayload));  // ← uncomment when slice is ready

      // ── Or call your API ──
      // await api.post('/tasks', taskPayload);

      // Simulate async save
      // await new Promise(r => setTimeout(r, 600));

      // onSave?.(taskPayload);
      // setSaved(true);

      // // Auto-close after success tick
      // setTimeout(() => {
      //   onClose();
      // }, 800);
    } catch (err) {
      console.error('Task save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!open) return null;

  return (
    <Modal transparent visible={open} animationType="none" onRequestClose={onClose}>
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
                <Text style={styles.headerTitle}>New Task</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {contact?.full_name ? `For ${contact.full_name}` : 'Create a new task'}
                </Text>
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
              contentContainerStyle={{
                padding: 20,
                paddingBottom: 120,
                flexGrow: 1,
              }}
              enableOnAndroid
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

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

              {/* ── Related Contact (read-only) ── */}
              <FieldLabel label="Related Contact" />
              <View style={styles.readonlyInput}>
                <Ionicons name="person-outline" size={16} color="#aaa" style={{ marginRight: 8 }} />
                <Text style={styles.readonlyText}>
                  {contact?.full_name || '—'}
                </Text>
                {contact?.phone && (
                  <Text style={styles.readonlyPhone}>{contact.phone}</Text>
                )}
              </View>

              {/* ── Due Date ── */}
              <FieldLabel label="Due Date" />
              <Controller
                control={control}
                name="due_date"
                render={({ field: { value } }) => (
                  <TouchableOpacity onPress={openDatePicker} activeOpacity={0.7}>
                    <View style={styles.inputRow}>
                      <Ionicons name="calendar-outline" size={16} color="#aaa" style={styles.inputIcon} />
                      <View pointerEvents="none">
                        <TextInput
                          value={value}
                          placeholder="Select date"
                          placeholderTextColor="#bbb"
                          style={styles.inputWithIcon}
                          editable={false}
                        />
                      </View>

                    </View>
                  </TouchableOpacity>
                )}
              />

              {/* ── Priority Selector ── */}
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
                        style={{ marginRight: 5 }}
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

              {/* ── Buttons ── */}
              <TouchableOpacity
                style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.85}
                disabled={saving || saved}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : saved ? (
                  <View style={styles.saveBtnInner}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Saved!</Text>
                  </View>
                ) : (
                  <View style={styles.saveBtnInner}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Task</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

            </KeyboardAwareScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

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
  kavWrapper: {
    flex: 1,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
    overflow: 'hidden',
  },

  // Handle
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Inputs
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  textArea: {
    height: 100,
    paddingTop: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111',
  },

  // Read-only contact field
  readonlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  readonlyText: { fontSize: 15, color: '#374151', fontWeight: '600', flex: 1 },
  readonlyPhone: { fontSize: 12, color: '#9ca3af' },

  // Priority chips
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityText: { fontSize: 13, fontWeight: '700' },
  priorityDot: {
    width: 6, height: 6, borderRadius: 3,
    marginLeft: 5,
  },

  // Buttons
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnSuccess: { backgroundColor: '#22c55e' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fafafa',
  },
  cancelBtnText: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

const fieldStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4 },
  required: { color: '#ef4444', marginLeft: 3, fontSize: 14, fontWeight: '700' },
});

const errStyles = StyleSheet.create({
  text: { color: '#ef4444', fontSize: 12, marginTop: -10, marginBottom: 10, marginLeft: 4 },
});