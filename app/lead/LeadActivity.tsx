import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { loadActivityByLead, IActivity } from '@/store/slices/activitySlice';
import { Calendar, ChevronRight, Circle, Mail, PanelRightCloseIcon, Pen, Phone } from 'lucide-react-native';

// ─── Icon map ─────────────────────────────────────────
const getActivityMeta = (type: string) => {
    const map: any = {
        email: { icon: Mail, color: '#6366f1', bg: '#eef2ff' },
        meeting: { icon: Calendar, color: '#0ea5e9', bg: '#e0f2fe' },
        call: { icon: Phone, color: '#10b981', bg: '#ecfdf5' },
        note: { icon: Pen, color: '#f59e0b', bg: '#fffbeb' },
        stage_change: { icon: ChevronRight, color: '#3b82f6', bg: '#eff6ff' },
        task: { icon: PanelRightCloseIcon, color: '#8b5cf6', bg: '#f5f3ff' },
        default: { icon: Circle, color: '#6b7280', bg: '#f3f4f6' },
    };
    return map[type] ?? map.default;
};

// ─── Helpers ──────────────────────────────────────────
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true, // remove if you want 24h
    });
};

const formatType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Component ────────────────────────────────────────
const LeadActivity = ({ lead }: any) => {
    const dispatch = useDispatch<AppDispatch>();
    const { logs, loading, initialized } = useSelector((state: RootState) => state.activity);

    useEffect(() => {
        if (lead?.id) {
            dispatch(loadActivityByLead(lead.id));
        }
    }, [lead?.id]);

    // ─── Render Item ──────────────────────────────────
    const renderItem = ({ item, index }: { item: IActivity; index: number }) => {
        const meta = getActivityMeta(item.type?.toLowerCase());
        const isLast = index === logs.length - 1;

        return (
            <View style={styles.item}>
                {!isLast && <View style={styles.line} />}

                <View
                    style={[
                        styles.iconBubble,
                        {
                            backgroundColor: meta.bg,
                            borderColor: meta.color,
                        },
                    ]}
                >
                    <meta.icon color={meta.color} size={14} />
                </View>

                <View style={styles.content}>
                    {/* ✅ TITLE */}
                    <Text style={styles.typeLabel}>
                        {item.title || formatType(item.type)}
                    </Text>

                    {/* ✅ NOTES (description) */}
                    {item.notes ? (
                        <Text style={styles.description}>{item.notes}</Text>
                    ) : null}

                    {/* ✅ DATE */}
                    <Text style={styles.date}>
                        {formatDate(item.created_at)}
                    </Text>
                </View>
            </View>
        );
    };
    return (
        <View style={styles.wrapper}>
            {loading && (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading activity…</Text>
                </View>
            )}

            {!loading && initialized && logs.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyText}>No activity yet for this lead.</Text>
                </View>
            )}

            {!loading && logs.length > 0 && (
                <FlatList
                    data={logs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingVertical: 16,
        minHeight: 120,
        backgroundColor: 'white',
        margin: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ebebeb',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 24,
    },
    loadingText: {
        fontSize: 13,
        color: '#9ca3af',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 28,
    },
    emptyText: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
        position: 'relative',
    },
    line: {
        position: 'absolute',
        left: 18, // center of circle
        top: 36,  // start from bottom of circle
        height: '100%', // dynamic height
        width: 1.5,
        backgroundColor: '#e5e7eb',
    },
    iconBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        marginRight: 14,
    },
    content: {
        flex: 1,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    description: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    date: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
});

export default LeadActivity;