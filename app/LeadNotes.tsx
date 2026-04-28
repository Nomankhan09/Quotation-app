import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { INote } from '@/interface/notes';
import { addNote, editNote, loadNotesByLead, removeNote } from '@/store/slices/notesSlice';
import { ILead } from '@/interface/leads';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeadNotesProps {
    lead: ILead;
}

interface NoteFormValues {
    notes: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeadNotes({ lead }: LeadNotesProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { notes, loading } = useSelector((state: RootState) => state.notes);
    const [editingNote, setEditingNote] = useState<INote | null>(null);


    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<NoteFormValues>({
        defaultValues: { notes: '' },
    });

    // ─── Load notes on mount ──────────────────────────────────────────────────
    useEffect(() => {
        dispatch(loadNotesByLead(lead.id));
    }, [lead.id]);

    // ─── Populate form when editing ───────────────────────────────────────────
    useEffect(() => {
        if (editingNote) {
            setValue('notes', editingNote.note);
        } else {
            reset({ notes: '' });
        }
    }, [editingNote]);

    // ─── Submit: create or update ─────────────────────────────────────────────
    const onSubmit = async (values: NoteFormValues) => {
        if (editingNote) {
            await dispatch(
                editNote({
                    id: String(editingNote.id),
                    data: { lead_id: lead.id, note: values.notes },
                })
            );
            setEditingNote(null);
        } else {
            await dispatch(
                addNote({ lead_id: lead.id, note: values.notes })
            );
        }
        reset({ notes: '' });
    };

    // ─── Delete with confirmation ─────────────────────────────────────────────
    const handleDelete = (id: string) => {
        Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => dispatch(removeNote(id)),
            },
        ]);
    };

    // ─── Cancel edit ─────────────────────────────────────────────────────────
    const handleCancelEdit = () => {
        setEditingNote(null);
        reset({ notes: '' });
    };

    // ─── Render each note card ────────────────────────────────────────────────
    const renderNote = ({ item }: { item: INote }) => (
        <View style={styles.noteCard}>
            <Text style={styles.noteText}>{item.note}</Text>
            <View style={styles.noteFooter}>
                <Text style={styles.noteMeta}>
                     {formatDate(item.created_at)}
                </Text>
                <View style={styles.noteActions}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => setEditingNote(item)}
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(String(item.id))}
                    >
                        <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            {/* ─── Header ──────────────────────────────────── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notes</Text>
            </View>

            {/* ─── Form ────────────────────────────────────── */}
            <View style={styles.formCard}>
                <Controller
                    control={control}
                    name="notes"
                    rules={{ required: 'Note cannot be empty' }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[
                                styles.textArea,
                                errors.notes && styles.textAreaError,
                            ]}
                            placeholder={`Add a note...`}
                            placeholderTextColor="#aaa"
                            multiline
                            numberOfLines={4}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            textAlignVertical="top"
                        />
                    )}
                />
                {errors.notes && (
                    <Text style={styles.errorText}>{errors.notes.message}</Text>
                )}

                <View style={styles.formFooter}>
                    <TouchableOpacity
                        style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.saveBtnText}>
                                {editingNote ? 'Update' : 'Save'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {editingNote && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={handleCancelEdit}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ─── Notes List ──────────────────────────────── */}
            {loading ? (
                <ActivityIndicator
                    style={{ marginTop: 24 }}
                    color="#6C8EF5"
                    size="large"
                />
            ) : (
                <FlatList
                    data={notes}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderNote}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No notes yet. Add one above.</Text>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </KeyboardAvoidingView>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6FB',
        paddingHorizontal: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1D23',
    },

    // Form Card
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#E2E6EF',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#1A1D23',
        minHeight: 90,
        backgroundColor: '#FAFBFD',
    },
    textAreaError: {
        borderColor: '#E55353',
    },
    errorText: {
        color: '#E55353',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 2,
    },
    formFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 10,
    },
    saveBtn: {
        backgroundColor: '#3B5BDB',
        borderRadius: 8,
        paddingVertical: 9,
        paddingHorizontal: 22,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 72,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    cancelBtn: {
        borderWidth: 1,
        borderColor: '#D1D5E0',
        borderRadius: 8,
        paddingVertical: 9,
        paddingHorizontal: 16,
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },

    // List
    listContent: {
        paddingBottom: 32,
        gap: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#aaa',
        marginTop: 32,
        fontSize: 14,
    },

    // Note Card
    noteCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F0E9C8',
    },
    noteText: {
        fontSize: 14,
        color: '#2D2D2D',
        lineHeight: 20,
        marginBottom: 10,
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noteMeta: {
        fontSize: 12,
        color: '#8B7355',
    },
    noteActions: {
        flexDirection: 'row',
        gap: 8,
    },
    editBtn: {
        borderWidth: 1,
        borderColor: '#C9C2A8',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    editBtnText: {
        fontSize: 12,
        color: '#5A4F3A',
        fontWeight: '500',
    },
    deleteBtn: {
        borderWidth: 1,
        borderColor: '#F5C2C2',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 12,
        backgroundColor: '#FFF5F5',
    },
    deleteBtnText: {
        fontSize: 12,
        color: '#C0392B',
        fontWeight: '500',
    },
});