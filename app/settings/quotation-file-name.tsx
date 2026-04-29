import { RootState, AppDispatch } from '@/store';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Save } from 'lucide-react-native';
import { router } from 'expo-router';
import { updateCompanyInformation } from '@/store/slices/authSlice';

const ALL_FIELDS = [
    '{company_name}',
    '{full_name}',
    '{date}',
    '{bussiness_type}',
];

export default function FileNameBuilder() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, updatingCompany } = useSelector((state: RootState) => state.auth);

    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [text, setText] = useState(
        user?.pdf_file_name_format || 'Quotation_{date}'
    );

    // 👉 ADD / REMOVE field
    const toggleField = (field: string) => {
        if (text.includes(field)) {
            setText(prev => prev.replace(field, ''));
            return;
        }

        const before = text.substring(0, selection.start);
        const after = text.substring(selection.end);

        const newText = before + field + after;
        setText(newText);

        const cursor = selection.start + field.length;
        setSelection({ start: cursor, end: cursor });
    };

    // 👉 prevent breaking {variables}
    const handleChange = (newText: string) => {
        const validTokenRegex = /\{[^}]+\}/g;

        // find all tokens like {something}
        const matches = newText.match(/\{[^}]*\}?/g) || [];

        for (let token of matches) {
            // ❌ if token starts with { but not properly closed → block
            if (token.startsWith('{') && !token.endsWith('}')) {
                return;
            }
        }

        setText(newText);
    };

    const isActive = (field: string) => text.includes(field);

    // ✅ SAVE API
    const handleSave = async () => {
        try {
            if (!text.trim()) {
                Alert.alert('Error', 'File name cannot be empty');
                return;
            }

            await dispatch(updateCompanyInformation({
                company_name: user?.company_name || '',
                pdf_file_name_format: text
            })).unwrap();

            Alert.alert('Success', 'File name format saved!');
            router.back();
        } catch (err: any) {
            Alert.alert('Error', err || 'Failed to save');
        }
    };

    return (
        <View style={styles.container}>

            {/* 🔹 HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>File Name Builder</Text>

                <View style={{ width: 32 }} />
            </View>

            {/* Title */}
            <Text style={styles.title}>File Name Format</Text>
            <Text style={styles.subtitle}>
                Build your file name using text and dynamic fields
            </Text>

            {/* Input */}
            <View style={styles.inputBox}>
                <TextInput
                    value={text}
                    onChangeText={handleChange}
                    multiline
                    style={styles.input}
                    onSelectionChange={(e) =>
                        setSelection(e.nativeEvent.selection)
                    }
                    placeholder="Type file name..."
                    placeholderTextColor="#94A3B8"
                />
            </View>

            {/* PDF fixed */}
            <Text style={styles.pdf}>.pdf</Text>

            {/* Fields */}
            <Text style={styles.sectionTitle}>Add Fields</Text>

            <View style={styles.fieldsContainer}>
                {ALL_FIELDS.map(field => (
                    <TouchableOpacity
                        key={field}
                        style={[
                            styles.fieldButton,
                            isActive(field) && styles.fieldActive,
                        ]}
                        onPress={() => toggleField(field)}
                    >
                        <Text
                            style={[
                                styles.fieldText,
                                isActive(field) && styles.fieldTextActive,
                            ]}
                        >
                            {field}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 🔹 SAVE BUTTON */}
            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={updatingCompany}
            >
                {updatingCompany ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Save size={18} color="#fff" />
                        <Text style={styles.saveText}>Save</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#F8FAFC',
        flex: 1,
    },

    title: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },

    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
    },

    inputBox: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        padding: 14,
        backgroundColor: '#FFFFFF',
        minHeight: 70,
    },

    input: {
        fontSize: 16,
        color: '#1E293B',
    },

    pdf: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },

    sectionTitle: {
        marginTop: 20,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },

    fieldsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    fieldButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
    },

    fieldActive: {
        backgroundColor: '#3B82F6',
    },

    fieldText: {
        fontSize: 13,
        color: '#1E293B',
    },

    fieldTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },

    saveButton: {
        marginTop: 30,
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },

    saveText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});