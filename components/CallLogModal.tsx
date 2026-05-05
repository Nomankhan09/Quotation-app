import React, { useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    defaultValues?: {
        type?: "INCOMING" | "OUTGOING" | "MISSED";
        durationObj?: {
            hours?: string;
            minutes?: string;
            seconds?: string;
        };
    };
};

export default function CallLogModal({
    visible,
    onClose,
    onSubmit,
    defaultValues,
}: Props) {
    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            type: defaultValues?.type || "OUTGOING",
            durationObj: {
                hours: defaultValues?.durationObj?.hours || "",
                minutes: defaultValues?.durationObj?.minutes || "",
                seconds: defaultValues?.durationObj?.seconds || "",
            },
        },
    });
    const selectedType = watch("type");

    useEffect(() => {
        if (selectedType === "MISSED") {
            setValue("durationObj", {
                hours: "",
                minutes: "",
                seconds: "",
            });
        }
    }, [selectedType]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSave = (data: any) => {
        onSubmit(data);
        reset();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>

                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Log Call</Text>

                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={22} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Call Type */}
                    <Controller
                        control={control}
                        name="type"
                        render={({ field: { value, onChange } }) => (
                            <View style={styles.typeRow}>
                                {["INCOMING", "OUTGOING", "MISSED"].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => onChange(type)}
                                        style={[
                                            styles.option,
                                            value === type && styles.activeOption,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                value === type && styles.activeOptionText,
                                            ]}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    />

                    {/* Duration */}
                    {selectedType !== 'MISSED' &&
                        <Controller
                            control={control}
                            name="durationObj"
                            rules={{
                                validate: (val) => {
                                    // if (selectedType === "MISSED") return true;

                                    if (!val.hours && !val.minutes && !val.seconds) {
                                        return "Enter duration";
                                    }

                                    return true;
                                },
                            }}
                            render={({ field: { value, onChange } }) => (
                                <>
                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <TextInput
                                            placeholder="HH"
                                            keyboardType="numeric"
                                            value={value.hours}
                                            onChangeText={(text) =>
                                                onChange({ ...value, hours: text })
                                            }
                                            style={[styles.modalInput, { flex: 1 }]}
                                        />

                                        <TextInput
                                            placeholder="MM"
                                            keyboardType="numeric"
                                            value={value.minutes}
                                            onChangeText={(text) =>
                                                onChange({ ...value, minutes: text })
                                            }
                                            style={[styles.modalInput, { flex: 1 }]}
                                        />

                                        <TextInput
                                            placeholder="SS"
                                            keyboardType="numeric"
                                            value={value.seconds}
                                            onChangeText={(text) =>
                                                onChange({ ...value, seconds: text })
                                            }
                                            style={[styles.modalInput, { flex: 1 }]}
                                        />
                                    </View>

                                    {errors.durationObj && (
                                        <Text style={styles.errorText}>
                                            {errors.durationObj.message as string}
                                        </Text>
                                    )}
                                </>
                            )}
                        />
                    }

                    {/* Actions */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleSubmit(handleSave)}
                        >
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    modalCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },

    modalInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        color: '#111827',
        marginTop: 4,
    },

    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },

    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },

    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
    },

    saveBtn: {
        flex: 1,
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },

    saveText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },

    option: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },

    activeOption: {
        backgroundColor: '#dbeafe',
        borderWidth: 1,
        borderColor: '#3b82f6',
    },

    optionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },

    activeOptionText: {
        color: '#3b82f6',
        fontWeight: '700',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginBottom: 10,
    },

})