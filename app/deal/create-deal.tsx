import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { addDeal, editDeal as updateDeal } from "@/store/slices/dealSlice";
import { CreateDealPayload } from "@/services/dealService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getQuotationsByLead } from "@/store/slices/quotationsSlice";
import { formatDate } from "@/utils/date_format";
import { Product } from "@/store/slices/productsSlice";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormValues {
    lead_id: string;
    title: string;
    stage_id: string;
    expected_close_date: string;
    assigned_to: string;
    description: string;
    quotation_id: number[] | null;
}

interface FormErrors {
    lead_id?: string;
    title?: string;
    stage_id?: string;
    expected_close_date?: string;
}

interface Quotation {
    id: number;
    title: string;
    items: string;
    date: string;
    value: number;
    products: Product[];
    created_at: string;
    subtotal: number;
    total_amount: number
}

const fmtINR = (v: number) =>
    `₹${v?.toLocaleString("en-IN")}`;

// ─── useForm Hook ─────────────────────────────────────────────────────────────

function useForm(initial: FormValues) {
    const [values, setValues] = useState<FormValues>(initial);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});

    const set = useCallback(
        <K extends keyof FormValues>(name: K, value: FormValues[K]) => {
            setValues((prev) => ({ ...prev, [name]: value }));
            if ((errors as any)[name]) {
                setErrors((prev) => {
                    const e = { ...prev };
                    delete (e as any)[name];
                    return e;
                });
            }
        },
        [errors]
    );

    const touch = useCallback((name: keyof FormValues) => {
        setTouched((prev) => ({ ...prev, [name]: true }));
    }, []);

    const validate = useCallback((vals: FormValues): FormErrors => {
        const e: FormErrors = {};
        if (!vals.lead_id) e.lead_id = "Lead is required";
        if (!vals.title.trim()) e.title = "Deal name is required";
        if (!vals.stage_id) e.stage_id = "Pipeline stage is required";
        // if (!vals.expected_close_date) e.expected_close_date = "Close date is required";
        return e;
    }, []);

    return { values, errors, touched, set, touch, validate, setErrors };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.field}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>{label}</Text>
                {required && <Text style={styles.required}> *</Text>}
            </View>
            {children}
            {error ? <Text style={styles.errorMsg}>⚠ {error}</Text> : null}
        </View>
    );
}

function SelectPicker({
    placeholder,
    options,
    value,
    onSelect,
    hasError,
    labelKey = "full_name",
    valueKey = "id",
}: {
    placeholder: string;
    options: any[];
    value: string;
    onSelect: (id: string) => void;
    hasError?: boolean;
    labelKey?: string;
    valueKey?: string;
}) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => String(o.id) === String(value));

    return (
        <View>
            <TouchableOpacity
                style={[styles.selectBtn, hasError && styles.inputError, open && styles.selectBtnOpen]}
                onPress={() => setOpen((p) => !p)}
                activeOpacity={0.8}
            >
                <Text style={[styles.selectBtnText, !selected && styles.placeholder]}>
                    {selected ? selected[labelKey] : placeholder}
                </Text>
                <Text style={[styles.chevron, open && styles.chevronUp]}>›</Text>
            </TouchableOpacity>

            {open && (
                <View style={styles.dropdown}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                    >
                        {options.map((item) => (
                            <TouchableOpacity
                                key={item[valueKey]}
                                style={[
                                    styles.dropdownItem,
                                    String(value) === String(item[valueKey]) && styles.dropdownItemActive,
                                ]}
                                onPress={() => {
                                    onSelect(item[valueKey]);
                                    setOpen(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dropdownItemText,
                                        String(value) === String(item[valueKey]) && styles.dropdownItemTextActive,
                                    ]}
                                >
                                    {item[labelKey]}
                                </Text>

                                {value === item[valueKey] && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

function QuotationCard({
    quotation,
    selected,
    onPress,
}: {
    quotation: Quotation;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.quotationCard, selected && styles.quotationCardSelected]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Radio */}
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
            </View>

            {/* Info */}
            <View style={styles.quotationInfo}>
                <Text style={styles.quotationTitle} numberOfLines={1}>
                    {`#Quote-${quotation.id}`}
                </Text>
                <Text style={styles.quotationMeta}>
                    Products - {quotation.products?.length || 0} · {formatDate(new Date(quotation.created_at))}
                </Text>
            </View>

            {/* Value */}
            <Text style={styles.quotationValue}>{fmtINR(quotation?.total_amount)}</Text>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateDealScreen() {
    const params = useLocalSearchParams();
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const preselectedLead = params?.lead
        ? JSON.parse(params.lead as string)
        : null;

    const submitting = useSelector((s: RootState) => s.deals.submitting);
    const { leads } = useSelector(
        (state: RootState) => state.leads
    );
    const { deal_stage } = useSelector((state: RootState) => state.deals);
    const { quotation_lead, loading } = useSelector((state: RootState) => state.quotations);

    const { values, errors, touched, set, touch, validate, setErrors } =
        useForm({
            lead_id: "",
            title: "",
            stage_id: "",
            expected_close_date: "",
            assigned_to: "",
            description: "",
            quotation_id: [],
        });

    // for edit preselected
    const editMode = params?.edit === "true";
    const editDeal = useMemo(() => {
        return params?.deal
            ? JSON.parse(params.deal as string)
            : null;
    }, [params?.deal]);

    useEffect(() => {
        if (editMode && editDeal) {
            set("lead_id", String(editDeal.lead_id || ""));
            set("title", editDeal.title || "");
            set("stage_id", String(editDeal.stage_id || ""));
            set(
                "expected_close_date",
                editDeal.expected_close_date || ""
            );
            set(
                "assigned_to",
                editDeal.assigned_to
                    ? String(editDeal.assigned_to)
                    : ""
            );
            set("description", editDeal.description || "");
            // set(
            //     "quotation_id",
            //     editDeal.quotation?.map((q: any) => q.id) || []
            // );
        }
    }, [editMode, editDeal]);

    useEffect(() => {
        if (!values.lead_id) return;

        dispatch(
            getQuotationsByLead({
                leadId: Number(values.lead_id),
                deal_id: editMode
                    ? editDeal?.id
                    : null,
            })
        );
    }, [values.lead_id]);

    // prefill lead
    useEffect(() => {
        if (preselectedLead && values.lead_id !== String(preselectedLead.id)) {
            set("lead_id", String(preselectedLead.id));
        }
    }, [preselectedLead, values.lead_id]);

    // for quotation selection
    useEffect(() => {
        if (!values.lead_id) return;

        dispatch(
            getQuotationsByLead({
                leadId: Number(values.lead_id),
                deal_id: editMode
                    ? editDeal?.id
                    : null,
            })
        );
    }, [values.lead_id]);

    useEffect(() => {
        if (deal_stage.length === 0) return;

        const stage =
            deal_stage.find(s => s.stage_name?.toLowerCase() === "new") ||
            deal_stage[0];

        // only set if empty (prevents overwrite)
        if (!values.stage_id) {
            set("stage_id", String(stage.id));
        }
    }, [deal_stage]);

    useEffect(() => {

        if (
            !editMode ||
            !editDeal ||
            quotation_lead.length === 0
        ) return;

        const existingQuoteIds =
            editDeal.quotation?.map((q: any) => q.id) || [];

        set(
            "quotation_id",
            existingQuoteIds
        );

    }, [quotation_lead, editMode, editDeal]);

    // date picker
    const openDatePicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'date',
            is24Hour: true,
            onChange: (event, selectedDate) => {
                if (event.type === 'dismissed') return;

                if (selectedDate) {
                    const formatted = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    set("expected_close_date", formatted);
                }
            },
        });
    };

    const selectedQuotation = quotation_lead.filter((q) =>
        values?.quotation_id?.includes(Number(q.id))
    );

    const handleSave = async () => {
        const errs = validate(values);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const payload: CreateDealPayload = {
            lead_id: Number(values.lead_id),
            title: values.title.trim() || null,
            stage_id: values.stage_id ? Number(values.stage_id) : null,
            expected_close_date: values.expected_close_date || null,
            assigned_to: values.assigned_to ? Number(values.assigned_to) : null,
            description: values.description.trim() || null,
            quotation_id: values.quotation_id?.map(Number) || null,
            // value:
            //     selectedQuotation.reduce(
            //         (sum, q) =>
            //             sum + Number(q.total_amount || 0),
            //         0
            //     ) || null,
        };

        let result;

        if (editMode) {
            result = await dispatch(
                updateDeal({
                    id: editDeal.id,
                    payload,
                })
            );
        } else {
            result = await dispatch(addDeal(payload));
        }

        const isSuccess = editMode
            ? updateDeal.fulfilled.match(result)
            : addDeal.fulfilled.match(result);

        if (isSuccess) {
            Alert.alert("Success", editMode
                ? "Deal updated successfully!"
                : "Deal created successfully!", [
                {
                    text: "OK", onPress: () => router.back()
                },
            ]);
        } else {
            Alert.alert(
                "Error",
                (result.payload as string) || (editMode
                    ? "Failed to update deal."
                    : "Failed to create deal.")
            );
        }
    };

    return (
        <View style={styles.page}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {editMode ? "Edit Deal" : "Create Deal"}
                </Text>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>NEW</Text>
                </View>
            </View>

            {/* ── Form ── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={styles.bodyContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Section: Basic Info ── */}
                    <Field label="Deal Name" required error={errors.title}>
                        <TextInput
                            style={[styles.input, errors.title ? styles.inputError : null]}
                            placeholder="Enter deal name"
                            placeholderTextColor="#94a3b8"
                            value={values.title}
                            onChangeText={(v) => set("title", v)}
                            onBlur={() => touch("title")}
                            returnKeyType="next"
                        />
                    </Field>

                    <Field label="Lead" required error={errors.lead_id}>
                        {preselectedLead ? (
                            <View style={styles.readonlyInput}>
                                <Text style={styles.readonlyText}>
                                    {preselectedLead.full_name}
                                </Text>
                                <Text style={styles.readonlyPhone}>
                                    {preselectedLead.phone}
                                </Text>
                            </View>
                        ) : (
                            // <Field label="Lead" required error={errors.lead_id}>
                            <SelectPicker
                                placeholder="Select lead"
                                options={leads}
                                value={values.lead_id}
                                onSelect={(v) => { set("lead_id", v); touch("lead_id"); }}
                                hasError={!!errors.lead_id}
                                labelKey="full_name"
                                valueKey="id"
                            />
                            // </Field>
                        )}
                    </Field>

                    <Field label="Pipeline Stage" required error={errors.stage_id}>
                        <SelectPicker
                            placeholder="Select stage"
                            options={deal_stage}
                            value={values.stage_id}
                            onSelect={(v) => set("stage_id", v)}
                            hasError={!!errors.stage_id}
                            labelKey="stage_name"
                            valueKey="id"
                        />
                    </Field>

                    <View>
                        <Text style={[styles.label, { marginBottom: 5 }]}>Expected close date</Text>
                        <TouchableOpacity onPress={openDatePicker}>
                            <View style={styles.input}>
                                <Text style={{ color: values.expected_close_date ? '#000' : '#94a3b8' }}>
                                    {values.expected_close_date || "Select date"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* <Field label="Assigned To">
                        <SelectPicker
                            placeholder="Select team member"
                            options={USERS}
                            value={values.assigned_to}
                            onSelect={(v) => set("assigned_to", v)}
                        />
                    </Field> */}

                    {/* ── Section: Quotations (only when lead selected) ── */}
                    {values.lead_id ? (
                        <>
                            <Text style={styles.sectionTitle}>Quotations</Text>

                            <View style={styles.quotationsPanel}>
                                <View style={styles.quotationsHeader}>
                                    <Text style={styles.quotationsHeaderText}>
                                        {loading
                                            ? "Loading quotations…"
                                            : `${quotation_lead.length} quotation${quotation_lead.length !== 1 ? "s" : ""} found`}
                                    </Text>
                                    {loading && (
                                        <ActivityIndicator size="small" color="#2563eb" />
                                    )}
                                </View>

                                {!loading && quotation_lead.length === 0 && (
                                    <Text style={styles.emptyQuotes}>
                                        No quotations available for this lead
                                    </Text>
                                )}

                                {!loading &&
                                    <View style={{ maxHeight: 350 }}>
                                        <ScrollView nestedScrollEnabled>
                                            {quotation_lead.map((q) => (
                                                <QuotationCard
                                                    key={q.id}
                                                    quotation={q}
                                                    selected={values.quotation_id?.includes(q.id)}
                                                    onPress={() => {
                                                        const quoteId = q.id;

                                                        const exists =
                                                            values.quotation_id?.includes(quoteId);

                                                        if (exists) {
                                                            set(
                                                                "quotation_id",
                                                                values?.quotation_id.filter(
                                                                    (id) => id !== quoteId
                                                                )
                                                            );
                                                        } else {
                                                            set(
                                                                "quotation_id",
                                                                [...values?.quotation_id, quoteId]
                                                            );
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </ScrollView>
                                    </View>
                                }
                            </View>

                            {/* Deal value — read-only from quotation */}
                            {/* {selectedQuotation && (
                                <Field label="Deal Value">
                                    <View style={styles.valueRow}>
                                        <View style={styles.valuePrefixBox}>
                                            <Text style={styles.valuePrefix}>₹</Text>
                                        </View>
                                        <View style={[styles.input, styles.valueInput]}>
                                            <Text style={styles.valueText}>
                                                {selectedQuotation
                                                    .reduce(
                                                        (sum, q) => sum + (q.total_amount || 0),
                                                        0
                                                    )
                                                    .toLocaleString("en-IN")}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.valueHint}>Auto-filled from selected quotation</Text>
                                </Field>
                            )} */}
                        </>
                    ) : null}

                    {/* ── Section: Additional ── */}
                    <Field label="Notes">
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Enter notes about this deal"
                            placeholderTextColor="#94a3b8"
                            value={values.description}
                            onChangeText={(v) => set("description", v)}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </Field>

                    <View style={{ height: 20 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Footer ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Deal</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    page: {
        flex: 1,
        // backgroundColor: "#f0f2f7",
    },

    // Header
    header: {
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "ios" ? 54 : 16,
        paddingBottom: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        alignItems: "center",
        justifyContent: "center",
    },
    backIcon: {
        fontSize: 24,
        color: "#0f172a",
        marginTop: -2,
        fontWeight: "300",
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        color: "#0f172a",
        letterSpacing: 0.2,
    },
    headerBadge: {
        backgroundColor: "#eff6ff",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    headerBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#2563eb",
        letterSpacing: 0.5,
    },

    // Body
    body: { flex: 1 },
    bodyContent: {
        marginTop: 6,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "600",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 20,
    },

    // Field
    field: { marginBottom: 14 },
    labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    label: { fontSize: 13, fontWeight: "500", color: "#0f172a" },
    required: { fontSize: 14, color: "#2563eb", lineHeight: 18 },
    errorMsg: { fontSize: 12, color: "#ef4444", marginTop: 4 },

    // Input
    input: {
        // backgroundColor: "#f8fafc",
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === "ios" ? 12 : 10,
        fontSize: 14,
        color: "#0f172a",
    },
    inputError: { borderColor: "#ef4444" },
    textarea: { minHeight: 90, paddingTop: 12 },

    // SelectPicker
    selectBtn: {
        // backgroundColor: "#f8fafc",
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === "ios" ? 12 : 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectBtnOpen: {
        borderColor: "#2563eb",
        backgroundColor: "#fff",
    },
    selectBtnText: { fontSize: 14, color: "#0f172a", flex: 1 },
    placeholder: { color: "#94a3b8" },
    chevron: {
        fontSize: 20,
        color: "#94a3b8",
        transform: [{ rotate: "90deg" }],
        marginLeft: 8,
    },
    chevronUp: { transform: [{ rotate: "-90deg" }] },
    dropdown: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        marginTop: 4,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        maxHeight: 350,
    },
    dropdownItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    dropdownItemActive: { backgroundColor: "#eff6ff" },
    dropdownItemText: { fontSize: 14, color: "#0f172a" },
    dropdownItemTextActive: { color: "#2563eb", fontWeight: "600" },
    checkmark: { color: "#2563eb", fontSize: 14, fontWeight: "700" },

    // Quotations panel
    quotationsPanel: {
        backgroundColor: "#eff6ff",
        borderWidth: 1.5,
        borderColor: "#bfdbfe",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        gap: 8,
    },
    quotationsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    quotationsHeaderText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2563eb",
    },
    emptyQuotes: {
        textAlign: "center",
        fontSize: 13,
        color: "#64748b",
        paddingVertical: 12,
    },

    // Quotation card
    quotationCard: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 2
    },
    quotationCardSelected: {
        borderColor: "#2563eb",
        backgroundColor: "#eff6ff",
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#e2e8f0",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    radioSelected: {
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
    },
    radioDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#fff",
    },
    quotationInfo: { flex: 1 },
    quotationTitle: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
    quotationMeta: { fontSize: 11, color: "#64748b", marginTop: 2 },
    quotationValue: { fontSize: 13, fontWeight: "700", color: "#2563eb" },

    // Deal value (read-only)
    valueRow: {
        flexDirection: "row",
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#f8fafc",
    },
    valuePrefixBox: {
        paddingHorizontal: 14,
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
        borderRightWidth: 1.5,
        borderRightColor: "#e2e8f0",
    },
    valuePrefix: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2563eb",
    },
    valueInput: {
        flex: 1,
        borderWidth: 0,
        borderRadius: 0,
        backgroundColor: "transparent",
        justifyContent: "center",
    },
    valueText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2563eb",
    },
    valueHint: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 4,
    },

    // Footer
    footer: {
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    saveBtn: {
        backgroundColor: "#2563eb",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnDisabled: {
        backgroundColor: "#93c5fd",
        shadowOpacity: 0,
        elevation: 0,
    },
    saveBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    // Read-only contact
    readonlyInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: '#f9fafb', marginBottom: 14,
    },
    readonlyText: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },
    readonlyPhone: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
});