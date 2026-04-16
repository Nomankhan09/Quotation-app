import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { X } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { addLead, editLead } from "@/store/slices/leadsSlice";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function ContactFormModal({
    visible,
    onClose,
    defaultValues,
    mode = "add",
    STAGES = [],
}: {
    visible: boolean;
    onClose: () => void;
    defaultValues?: any;
    mode?: "add" | "edit";
    STAGES: string[];
}) {
    const {
        control,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            full_name: "",
            company_name: "",
            job_title: "",
            email: "",
            phone: "",
            stage: "Lead",
            location: "",
            notes: "",
        },
    });

    const [showStagePicker, setShowStagePicker] = useState(false);
    const stage = watch("stage");
    const dispatch = useDispatch<any>();

    // RESET ON OPEN (ADD + EDIT)
    useEffect(() => {
        if (visible && defaultValues) {
            reset(
                defaultValues || {
                    full_name: "",
                    company_name: "",
                    job_title: "",
                    email: "",
                    phone: "",
                    stage: "Lead",
                    location: "",
                    notes: "",
                }
            );
        }
    }, [visible, defaultValues]);

    const onSubmit = (data: any) => {
        if (!data.email) data.email = "NA";

        if (mode === "add") {
            dispatch(addLead(data));
        } else {
            console.log("Updating contact with data:", data);
            dispatch(editLead(data));
        }
        onClose();
        reset();
    };

    useEffect(() => {
        reset();
    }, [visible]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.bottomSheet}>
                    {/* Drag handle */}
                    <View style={styles.dragHandleWrapper}>
                        <View style={styles.dragHandle} />
                    </View>

                    {/* Header */}
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>
                            {mode === "edit" ? "Edit Contact" : "Add Contact"}
                        </Text>

                        <TouchableOpacity onPress={onClose}>
                            <X size={20} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAwareScrollView
                        contentContainerStyle={styles.formContent}
                        enableAutomaticScroll={true}
                        extraScrollHeight={80}
                        extraHeight={150}
                        enableOnAndroid={true}
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* FULL NAME */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Full name *</Text>
                            <Controller
                                control={control}
                                name="full_name"
                                rules={{
                                    required: "Full name is required",
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Full Name"
                                        placeholderTextColor="#9e9e9d"
                                    />
                                )}
                            />
                            {errors.full_name && (
                                <Text style={styles.errorText}>{errors.full_name.message}</Text>
                            )}
                        </View>

                        {/* PHONE */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Phone *</Text>
                            <Controller
                                control={control}
                                name="phone"
                                rules={{
                                    required: "Phone is required",
                                    pattern: {
                                        value: /^[0-9+\-\s]{7,15}$/,
                                        message: "Enter valid phone number",
                                    },
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="+91 98XXXXXXXX"
                                        placeholderTextColor="#9e9e9d"
                                        keyboardType="phone-pad"
                                    />
                                )}
                            />
                            {errors.phone && (
                                <Text style={styles.errorText}>{errors.phone.message}</Text>
                            )}
                        </View>

                        {/* Location */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Location *</Text>
                            <Controller
                                control={control}
                                name="location"
                                rules={{ required: 'Location is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, styles.multilineInput]}
                                        placeholder="Enter location"
                                        value={value}
                                        onChangeText={onChange}
                                        multiline
                                        textAlignVertical="top"
                                        scrollEnabled
                                        placeholderTextColor="#CBD5E1"
                                    />
                                )}
                            />

                            {/* </View> */}
                            {errors.location && (
                                <Text style={{ color: 'red' }}>
                                    {errors.location.message}
                                </Text>
                            )}
                        </View>

                        {/* STAGE */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Stage *</Text>

                            <Controller
                                control={control}
                                name="stage"
                                rules={{ required: "Stage is required" }}
                                render={({ field: { value } }) => (
                                    <>
                                        <TouchableOpacity
                                            style={styles.stageSelector}
                                            onPress={() => setShowStagePicker(!showStagePicker)}
                                        >
                                            <Text style={styles.stageSelectorText}>
                                                {value?.length ? value : "Select Stage"}
                                            </Text>
                                            <Text>{showStagePicker ? "▲" : "▼"}</Text>
                                        </TouchableOpacity>

                                        {showStagePicker && (
                                            <View style={styles.stageDropdown}>
                                                {STAGES.map((item) => (
                                                    <TouchableOpacity
                                                        key={item}
                                                        style={[
                                                            styles.stageOption,
                                                            value === item && styles.stageOptionActive,
                                                        ]}
                                                        onPress={() => {
                                                            setValue("stage", item, {
                                                                shouldValidate: true,
                                                            });
                                                            setShowStagePicker(false);
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.stageOptionText,
                                                                value === item &&
                                                                styles.stageOptionTextActive,
                                                            ]}
                                                        >
                                                            {item}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}
                            />

                            {/* ERROR MESSAGE */}
                            {errors.stage && (
                                <Text style={styles.errorText}>
                                    {errors.stage.message}
                                </Text>
                            )}
                        </View>

                        {/* EMAIL */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Email</Text>
                            <Controller
                                control={control}
                                name="email"
                                rules={{
                                    validate: (value) => {
                                        if (!value || value === "NA") return true; // ✅ allow NA or empty

                                        const emailRegex = /\S+@\S+\.\S+/;
                                        return emailRegex.test(value) || "Invalid email";
                                    },
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <View>
                                        <TextInput
                                            style={styles.input}
                                            value={value === "NA" ? "" : value}
                                            onChangeText={onChange}
                                            placeholder="raj@acme.com"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                        {errors.email && (
                                            <Text style={styles.errorText}>
                                                {errors.email.message}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            />
                        </View>

                        {/* COMPANY */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Company</Text>
                            <Controller
                                control={control}
                                name="company_name"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Acme Corp"
                                        placeholderTextColor="#9e9e9d"
                                    />
                                )}
                            />
                        </View>

                        {/* JOB TITLE */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Job title</Text>
                            <Controller
                                control={control}
                                name="job_title"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Head of Engineering"
                                        placeholderTextColor="#9e9e9d"
                                    />
                                )}
                            />
                        </View>

                        {/* Additional notes */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Additional Notes</Text>
                            <Controller
                                control={control}
                                name="notes"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="Add any additional notes..."
                                        value={value}
                                        onChangeText={onChange}
                                        multiline
                                        numberOfLines={4}
                                        placeholderTextColor="#CBD5E1"
                                        textAlignVertical="top"
                                    />
                                )}
                            />
                        </View>

                        {/* BUTTONS */}
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSubmit(onSubmit)}
                        >
                            <Text style={styles.saveButtonText}>{mode === 'edit' ? 'Update contact' : 'Save contact'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </KeyboardAwareScrollView>
                </View>
            </View>
        </Modal>
    );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end" as const,
    },

    bottomSheet: {
        height: "85%" as const,
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: "hidden" as const,
        paddingBottom: 20,
    },

    dragHandleWrapper: {
        alignItems: "center" as const,
        paddingVertical: 10,
    },

    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#D1D5DB",
    },

    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between" as const,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    sheetTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },

    formContent: {
        padding: 20,
        paddingBottom: 40,
    },

    fieldWrapper: {
        marginBottom: 12,
    },

    label: {
        fontSize: 13,
        fontWeight: "500",
        color: "#444",
        marginBottom: 6,
    },

    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
    },

    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 4,
    },

    stageSelector: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        padding: 10,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "space-between",
    },

    stageSelectorText: {
        color: "#111",
    },

    chevron: {
        color: "#888",
    },

    stageDropdown: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginTop: 5,
        borderRadius: 8,
    },

    stageOption: {
        padding: 10,
    },

    stageOptionText: {
        color: "#333",
    },

    saveButton: {
        backgroundColor: "#3B82F6",
        padding: 14,
        borderRadius: 10,
        marginTop: 10,
    },

    saveButtonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "600",
    },

    cancelButton: {
        backgroundColor: "#F1F5F9",
        padding: 14,
        borderRadius: 10,
        marginTop: 10,
    },

    cancelButtonText: {
        textAlign: "center",
        color: "#64748B",
        fontWeight: "600",
    },
    scrollView: {
        flex: 1,
    },
    multilineInput: {
        minHeight: 50,
        maxHeight: 120,
        paddingTop: 10,
    },
    stageOptionActive: {
        backgroundColor: '#F9FAFB',
    },
    stageOptionTextActive: {
        fontWeight: '600',
        color: '#111827',
    },
    textArea: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        minHeight: 100,
        textAlignVertical: 'top',
    },
});