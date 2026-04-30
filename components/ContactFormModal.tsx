import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { X } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { addLead, editLead } from "@/store/slices/leadsSlice";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { RootState } from "@/store";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { Camera } from 'lucide-react-native';
import { SOURCE_OPTIONS } from "@/constants/constant";

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
            stage: "New",
            location: "",
            notes: "",
            source: "",
            custom_source: "",
            profile_image: "",
        },
    });

    const [showStagePicker, setShowStagePicker] = useState(false);
    const dispatch = useDispatch<any>();
    const selectedSource = watch('source');
    const profileImage = watch('profile_image');

    // image selection
    const pickImage = async () => {

        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            return;
        }

        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: true,
            });

        if (!result.canceled) {

            const asset = result.assets[0];

            const base64Image =
                `data:image/jpeg;base64,${asset.base64}`;

            setValue(
                'profile_image',
                base64Image
            );
        }
    };

    // RESET ON OPEN (ADD + EDIT)
    useEffect(() => {

        if (visible) {

            if (defaultValues) {

                reset({
                    full_name:
                        defaultValues.full_name || "",

                    company_name:
                        defaultValues.company_name || "",

                    job_title:
                        defaultValues.job_title || "",

                    email:
                        defaultValues.email === "NA"
                            ? ""
                            : defaultValues.email || "",

                    phone:
                        defaultValues.phone || "",

                    stage:
                        defaultValues.stage || "New",

                    location:
                        defaultValues.location || "",

                    notes:
                        defaultValues.notes || "",

                    source:
                        SOURCE_OPTIONS.includes(
                            defaultValues.source
                        )
                            ? defaultValues.source
                            : defaultValues.source
                                ? 'Other'
                                : "",

                    custom_source:
                        SOURCE_OPTIONS.includes(
                            defaultValues.source
                        )
                            ? ""
                            : defaultValues.source || "",

                    // IMPORTANT
                    profile_image:
                        defaultValues.profile_image_url ||
                        defaultValues.profile_image ||
                        "",
                });

            } else {

                reset({
                    full_name: "",
                    company_name: "",
                    job_title: "",
                    email: "",
                    phone: "",
                    stage: "New",
                    location: "",
                    notes: "",
                    source: "",
                    custom_source: "",
                    profile_image: "",
                });
            }
        }

    }, [visible, defaultValues]);

    const onSubmit = (data: any) => {
        try {
            const finalSource =
                data.source === 'Other'
                    ? data.custom_source
                    : data.source;

            const payload = {
                ...data,
                source: finalSource,
            };

            delete payload.custom_source;

            if (!payload.email) {
                payload.email = "NA";
            }

            if (mode === "add") {
                dispatch(addLead(payload));
            } else {
                dispatch(editLead({ ...payload, id: defaultValues.id }));
            }

            onClose();
            reset();
        } catch (err) {
            console.error("Error saving contact:", err);
        }
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

                        {/* Profile Image */}
                        <View style={styles.avatarSection}>

                            <TouchableOpacity
                                style={styles.avatarWrapper}
                                onPress={pickImage}
                            >

                                {profileImage ? (

                                    <Image
                                        source={{ uri: profileImage }}
                                        style={styles.avatarImage}
                                    />

                                ) : (

                                    <View style={styles.avatarPlaceholder}>
                                        <Camera size={28} color="#64748B" />
                                    </View>
                                )}

                            </TouchableOpacity>

                            <TouchableOpacity onPress={pickImage}>
                                <Text style={styles.addPhotoText}>
                                    Add Photo
                                </Text>
                            </TouchableOpacity>

                        </View>

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

                        {/* Source */}
                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Lead Source</Text>

                            <Controller
                                control={control}
                                name="source"
                                render={({ field: { value } }) => (

                                    <View style={styles.sourceWrap}>

                                        {SOURCE_OPTIONS.map((item) => {

                                            const active = value === item;

                                            return (
                                                <TouchableOpacity
                                                    key={item}
                                                    style={[
                                                        styles.sourceChip,
                                                        active &&
                                                        styles.sourceChipActive
                                                    ]}
                                                    onPress={() =>
                                                        setValue('source', item)
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.sourceChipText,
                                                            active &&
                                                            styles.sourceChipTextActive
                                                        ]}
                                                    >
                                                        {item}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            />

                            {selectedSource === 'Other' && (

                                <Controller
                                    control={control}
                                    name="custom_source"
                                    render={({ field: { onChange, value } }) => (

                                        <TextInput
                                            style={[
                                                styles.input,
                                                { marginTop: 10 }
                                            ]}
                                            placeholder="Enter custom source"
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                    )}
                                />
                            )}
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
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },

    avatarWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        overflow: 'hidden',
        marginBottom: 10,
    },

    avatarPlaceholder: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 50,
        borderStyle: 'dashed',
    },

    avatarImage: {
        width: '100%',
        height: '100%',
    },

    addPhotoText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 14,
    },

    sourceWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    sourceChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#F1F5F9',
    },

    sourceChipActive: {
        backgroundColor: '#DBEAFE',
    },

    sourceChipText: {
        color: '#475569',
        fontWeight: '500',
    },

    sourceChipTextActive: {
        color: '#2563EB',
        fontWeight: '700',
    },
});