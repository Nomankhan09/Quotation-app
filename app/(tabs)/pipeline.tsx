import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
    StatusBar,
    Animated,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { getQuotationsPerLead, updateQuotationStageThunk } from '@/store/slices/quotationsSlice';
import { formatDate } from '@/utils/date_format';
import { useRouter } from 'expo-router';
import { Lead } from '@/store/slices/leadsSlice';

// ─── Types ────────────────────────────────────────────────────────────────────
type Stage = 'Proposal' | 'Negotiation' | 'Won';

interface IDeal {
    id: string;
    customer: string;
    company?: string;
    amount: number;
    probability: number;
    date: string;
    stage: Stage;
    lead_id?: string;
    lead: Lead;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const COLUMN_WIDTH = SW * 0.72;

const STAGE_CONFIG: Record<Stage, { color: string; dot: string; bg: string; gradient: string; badge: string }> = {
    Proposal: { color: '#7c3aed', dot: '#7c3aed', bg: '#f5f3ff', gradient: '#ede9fe', badge: '#ede9fe' },
    Negotiation: { color: '#d97706', dot: '#f59e0b', bg: '#fffbeb', gradient: '#fef3c7', badge: '#fef3c7' },
    Won: { color: '#16a34a', dot: '#22c55e', bg: '#f0fdf4', gradient: '#dcfce7', badge: '#dcfce7' },
};

const STAGES: Stage[] = ['Proposal', 'Negotiation', 'Won'];

const AVATAR_PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#14b8a6', '#8b5cf6', '#ef4444', '#0ea5e9'];
const getAvatarColor = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

const formatAmount = (n: number) => {
    if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) {
        const val = Math.floor(n / 100) / 10; // 👈 key change
        return `₹${val}K`;
    }
    return `₹${n}`;
};

const totalByStage = (deals: IDeal[], stage: Stage) =>
    deals.filter(d => d.stage === stage).reduce((s, d) => s + d.amount, 0);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 38 }: { name: string; size?: number }) => {
    const color = getAvatarColor(name);
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color + '20',
            borderWidth: 1.5, borderColor: color + '40',
            justifyContent: 'center', alignItems: 'center',
        }}>
            <Text style={{ fontSize: size * 0.33, fontWeight: '800', color, letterSpacing: -0.3 }}>{initials}</Text>
        </View>
    );
};

// ─── Stage Move Modal ─────────────────────────────────────────────────────────
const MoveModal = ({
    visible,
    deal,
    onMove,
    onClose,
}: {
    visible: boolean;
    deal: IDeal | null;
    onMove: (id: string, stage: Stage) => void;
    onClose: () => void;
}) => {
    if (!deal) return null;
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={modalStyles.sheet}>
                    <View style={modalStyles.handle} />
                    <Text style={modalStyles.title}>Move Deal</Text>
                    <Text style={modalStyles.sub}>{deal.customer}</Text>
                    <View style={modalStyles.options}>
                        {STAGES.map(s => {
                            const cfg = STAGE_CONFIG[s];
                            const active = deal.stage === s;
                            return (
                                <TouchableOpacity
                                    key={s}
                                    style={[modalStyles.option, active && { backgroundColor: cfg.bg, borderColor: cfg.color + '60' }]}
                                    onPress={() => { onMove(deal.id, s); onClose(); }}
                                    activeOpacity={0.75}
                                >
                                    <View style={[modalStyles.stageDot, { backgroundColor: cfg.dot }]} />
                                    <Text style={[modalStyles.stageLabel, { color: active ? cfg.color : '#374151' }]}>{s}</Text>
                                    {active && <Ionicons name="checkmark-circle" size={18} color={cfg.color} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

// ─── Deal Card ────────────────────────────────────────────────────────────────
const DealCard = ({
    deal,
    onLongPress,
    onPress,
}: {
    deal: IDeal;
    onLongPress: () => void;
    onPress: () => void;
}) => {
    const cfg = STAGE_CONFIG[deal.stage];
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, damping: 15 }).start();
    const handlePressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 15 }).start();

    return (
        <TouchableOpacity
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            activeOpacity={0.9}
            delayLongPress={300}
        >
            <Animated.View style={[cardStyles.card, { transform: [{ scale: scaleAnim }] }]}>
                {/* Top row */}
                <View style={cardStyles.topRow}>
                    <View style={[cardStyles.stagePill, { backgroundColor: cfg.badge }]}>
                        <View style={[cardStyles.pillDot, { backgroundColor: cfg.dot }]} />
                        <Text style={[cardStyles.pillText, { color: cfg.color }]}>
                            {deal.stage}
                        </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={cardStyles.date}>{deal.date}</Text>
                        <Text style={cardStyles.quoteId}>#QUO-{deal.id}</Text>
                    </View>
                </View>

                {/* Customer */}
                <View style={cardStyles.customerRow}>
                    <Avatar name={deal.customer} size={40} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={cardStyles.customerName}>{deal.customer}</Text>
                        {deal.company ? (
                            <View style={cardStyles.companyRow}>
                                <Ionicons name="business-outline" size={11} color="#9ca3af" style={{ marginRight: 3 }} />
                                <Text style={cardStyles.companyText}>{deal.company}</Text>
                            </View>
                        ) : (
                            <Text style={cardStyles.noCompany}>Independent</Text>
                        )}
                    </View>
                    <TouchableOpacity style={cardStyles.moveBtn} onPress={onLongPress}>
                        <Ionicons name="swap-horizontal-outline" size={15} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {/* Amount */}
                <Text style={cardStyles.amount}>{formatAmount(deal.amount)}</Text>

                {/* Probability bar */}
                {/* <View style={cardStyles.barTrack}>
                    <View style={[cardStyles.barFill, { width: `${deal.probability}%` as any, backgroundColor: cfg.color }]} />
                </View>
                <Text style={[cardStyles.probText, { color: cfg.color }]}>{deal.probability}% probability</Text> */}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Pipeline Screen ──────────────────────────────────────────────────────────
export default function PipelineScreen() {
    const dispatch = useDispatch<AppDispatch>();
    const { Proposal, Negotiation, Won } = useSelector(
        (state: RootState) => state.quotations.groupedQuotations
    );
    const loading = useSelector(
        (state: RootState) => state.quotations.loading
    );
    const router = useRouter();

    const deals: IDeal[] = [
        ...Proposal.map((q: any) => ({
            id: q.id.toString(),
            customer: q.lead?.full_name || 'Unknown',
            company: q.lead?.company_name,
            amount: Number(q.total_amount || 0),
            probability: 40,
            date: formatDate(new Date(q.created_at)),
            stage: 'Proposal' as Stage,
            lead: q.lead
        })),
        ...Negotiation.map((q: any) => ({
            id: q.id.toString(),
            customer: q.lead?.full_name || 'Unknown',
            company: q.lead?.company_name,
            amount: Number(q.total_amount || 0),
            probability: 70,
            date: formatDate(new Date(q.created_at)),
            stage: 'Negotiation' as Stage,
            lead: q.lead
        })),
        ...Won.map((q: any) => ({
            id: q.id.toString(),
            customer: q.lead?.full_name || 'Unknown',
            company: q.lead?.company_name,
            amount: Number(q.total_amount || 0),
            probability: 100,
            date: formatDate(new Date(q.created_at)),
            stage: 'Won' as Stage,
            lead: q.lead
        })),
    ];
    const [moveTarget, setMoveTarget] = useState<IDeal | null>(null);
    const [moveModalVisible, setMoveModalVisible] = useState(false);

    useEffect(() => {
        dispatch(getQuotationsPerLead());
    }, [dispatch]);

    const totalPipeline = deals
        .filter(d => d.stage !== 'Won')
        .reduce((s, d) => s + d.amount, 0);
    const wonTotal = totalByStage(deals, 'Won');

    const handleMove = (id: string, stage: Stage) => {
        dispatch(updateQuotationStageThunk({
            id: Number(id),
            stage: stage
        }));
    };

    const openMoveModal = (deal: IDeal) => {
        setMoveTarget(deal);
        setMoveModalVisible(true);
    };

    {
        loading && (
            <View style={screenStyles.loaderOverlay}>
                <View style={screenStyles.loaderBox}>
                    <Ionicons name="sync-outline" size={26} color="#6366f1" />
                    <Text style={screenStyles.loaderText}>Loading pipeline...</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={screenStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />

            {/* ── Header ── */}
            <View style={screenStyles.header}>
                <View>
                    <Text style={screenStyles.pageTitle}>Pipeline</Text>
                    <View style={screenStyles.headerMeta}>
                        <Text style={screenStyles.metaText}>{formatAmount(totalPipeline)}</Text>
                        <View style={screenStyles.metaDot} />
                        <Text style={screenStyles.metaText}>{deals.length} deals</Text>
                    </View>
                </View>
                <View style={screenStyles.wonBadge}>
                    <Ionicons name="trophy-outline" size={13} color="#16a34a" style={{ marginRight: 4 }} />
                    <Text style={screenStyles.wonBadgeText}>{formatAmount(wonTotal)} won</Text>
                </View>
            </View>

            {/* ── Stage summary strip ── */}
            <View style={screenStyles.summaryStrip}>
                {STAGES.map(s => {
                    const cfg = STAGE_CONFIG[s];
                    const count = deals.filter(d => d.stage === s).length;
                    const total = totalByStage(deals, s);
                    return (
                        <View key={s} style={[screenStyles.summaryCard, { backgroundColor: cfg.bg }]}>
                            <View style={[screenStyles.summaryDot, { backgroundColor: cfg.dot }]} />
                            <Text style={[screenStyles.summaryStage, { color: cfg.color }]}>{s}</Text>
                            <Text style={[screenStyles.summaryAmount, { color: cfg.color }]}>{formatAmount(total)}</Text>
                            <Text style={screenStyles.summaryCount}>{count} deals</Text>
                        </View>
                    );
                })}
            </View>

            {/* ── Kanban columns ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={screenStyles.kanban}
                decelerationRate="fast"
                snapToInterval={COLUMN_WIDTH + 12}
                snapToAlignment="start"
            >
                {STAGES.map(stage => {
                    const cfg = STAGE_CONFIG[stage];
                    const stageDeals = deals.filter(d => d.stage === stage);

                    return (
                        <View key={stage} style={[screenStyles.column, { width: COLUMN_WIDTH }]}>
                            {/* Column header */}
                            <View style={screenStyles.colHeader}>
                                <View style={screenStyles.colHeaderLeft}>
                                    <View style={[screenStyles.colDot, { backgroundColor: cfg.dot }]} />
                                    <Text style={screenStyles.colTitle}>{stage}</Text>
                                    <View style={[screenStyles.colCount, { backgroundColor: cfg.badge }]}>
                                        <Text style={[screenStyles.colCountText, { color: cfg.color }]}>{stageDeals.length}</Text>
                                    </View>
                                </View>
                                <Text style={[screenStyles.colTotal, { color: cfg.color }]}>
                                    {formatAmount(totalByStage(deals, stage))}
                                </Text>
                            </View>

                            {/* Cards */}
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                nestedScrollEnabled
                            >
                                {stageDeals.length === 0 ? (
                                    <View style={[screenStyles.emptyCol, { borderColor: cfg.dot + '40' }]}>
                                        <Ionicons name="file-tray-outline" size={28} color={cfg.dot + '80'} />
                                        <Text style={[screenStyles.emptyText, { color: cfg.color + '99' }]}>No deals</Text>
                                        <Text style={screenStyles.emptyHint}>Long press a card to move here</Text>
                                    </View>
                                ) : (
                                    stageDeals.map(deal => (
                                        <DealCard
                                            key={deal.id}
                                            deal={deal}
                                            onLongPress={() => openMoveModal(deal)}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/lead/contact-details',
                                                    params: { contact: JSON.stringify(deal.lead) },
                                                })
                                            }
                                        />
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    );
                })}
            </ScrollView>

            {/* ── Move Modal ── */}
            <MoveModal
                visible={moveModalVisible}
                deal={moveTarget}
                onMove={handleMove}
                onClose={() => { setMoveModalVisible(false); setMoveTarget(null); }}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9ff' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 24 : 18,
        paddingBottom: 14,
        backgroundColor: '#f8f9ff',
    },
    pageTitle: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    headerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
    metaText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
    metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#9ca3af' },
    wonBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#dcfce7', borderRadius: 10,
        paddingHorizontal: 11, paddingVertical: 6,
        borderWidth: 1, borderColor: '#bbf7d0',
    },
    wonBadgeText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },

    summaryStrip: {
        flexDirection: 'row', gap: 8,
        paddingHorizontal: 16, marginBottom: 14,
    },
    summaryCard: {
        flex: 1, borderRadius: 14, padding: 10, alignItems: 'center',
    },
    summaryDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 4 },
    summaryStage: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryAmount: { fontSize: 14, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
    summaryCount: { fontSize: 10, color: '#9ca3af', fontWeight: '500', marginTop: 1 },

    kanban: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
    column: {
        backgroundColor: '#f1f2f8',
        borderRadius: 20,
        padding: 14,
        maxHeight: '95%',
    },
    colHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 14,
    },
    colHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    colDot: { width: 9, height: 9, borderRadius: 5 },
    colTitle: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    colCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    colCountText: { fontSize: 12, fontWeight: '700' },
    colTotal: { fontSize: 13, fontWeight: '700' },

    emptyCol: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 36, borderRadius: 14,
        borderWidth: 1.5, borderStyle: 'dashed',
        marginTop: 4,
    },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    emptyHint: { fontSize: 11, color: '#9ca3af', marginTop: 3 },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9ff',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    loaderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },

    loaderBox: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
});

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 15,
        margin: 2,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    quoteId: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '600',
        marginTop: 2,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    stagePill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    },
    pillDot: { width: 6, height: 6, borderRadius: 3 },
    pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
    date: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },

    customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    customerName: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    companyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    companyText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
    noCompany: { fontSize: 11, color: '#c4b5fd', marginTop: 2, fontWeight: '500' },
    moveBtn: {
        width: 30, height: 30, borderRadius: 10,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center', alignItems: 'center',
    },

    amount: { fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.8, marginBottom: 10 },

    barTrack: {
        height: 5, backgroundColor: '#f3f4f6',
        borderRadius: 3, marginBottom: 5, overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 3 },
    probText: { fontSize: 11, fontWeight: '600' },

});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 18 },
    title: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4, letterSpacing: -0.3 },
    sub: { fontSize: 13, color: '#9ca3af', marginBottom: 18, fontWeight: '500' },
    options: { gap: 10 },
    option: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb',
        backgroundColor: '#fafafa',
    },
    stageDot: { width: 10, height: 10, borderRadius: 5 },
    stageLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
});