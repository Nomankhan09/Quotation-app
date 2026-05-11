import React, { useState, useRef, useEffect, useMemo } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { formatOnlyDate } from '@/utils/date_format';
import { useRouter } from 'expo-router';
import { Lead } from '@/store/slices/leadsSlice';
import Avatar from '@/utils/avatar';
import { editDealStage, loadDeals } from '@/store/slices/dealSlice';
import { Plus } from 'lucide-react-native';
import { formatAmount } from '@/utils/amount_format';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DealStage {
    id: number;
    stage_name: string;
    probability: number;
    is_closed: number;
    is_won: number;
    color: string;
}

const hexToRGBA = (hex: string, opacity: number) => {
    const sanitized = hex.replace('#', '');

    const bigint = parseInt(sanitized, 16);

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const getStageConfig = (stage: DealStage) => {
    const color = stage?.color || '#6B7280';

    return {
        color,
        dot: color,
        bg: hexToRGBA(color, 0.08),
        gradient: hexToRGBA(color, 0.12),
        badge: hexToRGBA(color, 0.15),
    };
};


// ─── CHANGE IDeal ─────────────────────────────────────────────

interface IDeal {
    id: string;
    customer: string;
    company?: string;
    amount: number;
    probability: number;
    date: string;
    stage: DealStage;
    lead_id?: string;
    lead: Lead;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const COLUMN_WIDTH = SW * 0.72;

const totalByStage = (deals: IDeal[], stageId: number) =>
    deals
        .filter(d => d.stage?.id === stageId)
        .reduce((s, d) => s + Number(d.amount || 0), 0);

// ─── Stage Move Modal ─────────────────────────────────────────────────────────
const MoveModal = ({
    visible,
    deal,
    onMove,
    onClose,
    stages,
}: {
    visible: boolean;
    deal: IDeal | null;
    onMove: (id: string, stage_id: number) => void;
    onClose: () => void;
    stages: DealStage[];
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
                        {stages.map((stage) => {

                            const cfg = getStageConfig(stage);

                            const active = deal.stage?.id === stage.id;

                            return (
                                <TouchableOpacity
                                    key={stage.id}
                                    style={[
                                        modalStyles.option,
                                        active && {
                                            backgroundColor: cfg.bg,
                                            borderColor: cfg.color + '60'
                                        }
                                    ]}
                                    onPress={() => {
                                        onMove(deal.id, stage.id);
                                        onClose();
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <View
                                        style={[
                                            modalStyles.stageDot,
                                            { backgroundColor: cfg.dot }
                                        ]}
                                    />

                                    <Text
                                        style={[
                                            modalStyles.stageLabel,
                                            { color: active ? cfg.color : '#374151' }
                                        ]}
                                    >
                                        {stage.stage_name}
                                    </Text>

                                    {active && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={18}
                                            color={cfg.color}
                                        />
                                    )}
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
    const cfg = getStageConfig(deal.stage);
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
                            {deal.stage.stage_name}
                        </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={cardStyles.date}>{deal.date}</Text>
                        <Text style={cardStyles.quoteId}>#QUO-{deal.id}</Text>
                    </View>
                </View>

                {/* Customer */}
                <View style={cardStyles.customerRow}>
                    <Avatar item={deal.lead} height={40} width={40} />
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
                <Text style={cardStyles.amount}>
                    {
                        deal.amount > 0 ? (
                            <Text style={cardStyles.amount}>
                                {formatAmount(deal.amount)}
                            </Text>
                        ) : (
                            <Text
                                style={[
                                    cardStyles.amount,
                                    {
                                        fontSize: 16,
                                        color: '#9ca3af',
                                    }
                                ]}
                            >
                                No quotation yet
                            </Text>
                        )
                    }
                </Text>

                {/* Probability bar */}
                <View style={cardStyles.barTrack}>
                    <View style={[cardStyles.barFill, { width: `${deal.probability}%` as any, backgroundColor: cfg.color }]} />
                </View>
                <Text style={[cardStyles.probText, { color: cfg.color }]}>{deal.probability}% probability</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Pipeline Screen ──────────────────────────────────────────────────────────
export default function PipelineScreen() {
    const dispatch = useDispatch<AppDispatch>();
    const { deals, deal_stage, dealLoading } = useSelector((state: RootState) => state.deals);
    const router = useRouter();
    const [moveTarget, setMoveTarget] = useState<IDeal | null>(null);
    const [moveModalVisible, setMoveModalVisible] = useState(false);

    useEffect(() => {
        dispatch(loadDeals({}));
    }, [dispatch]);


    const formattedDeals: IDeal[] = useMemo(() => {
        return deals.map((deal: any) => ({
            id: deal.id.toString(),
            customer: deal.lead?.full_name || 'Unknown',
            company: deal.lead?.company_name,
            amount: Number(deal.quotation[0]?.total_amount || 0),
            probability: deal.stage?.probability || 0,
            date: formatOnlyDate(new Date(deal.created_at)),
            stage: deal.stage,
            lead: deal.lead,
        }))
    }, [deals]);

    const totalPipeline = formattedDeals
        .filter(d => !d.stage?.is_won)
        .reduce((s, d) => s + d.amount, 0);

    const handleMove = (id: string, stage: any) => {
        dispatch(editDealStage({
            id: Number(id),
            payload: {
                stage_id: stage
            }
        }));
    };

    const openMoveModal = (deal: IDeal) => {
        setMoveTarget(deal);
        setMoveModalVisible(true);
    };

    return (
        <>
            {
                dealLoading && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                )
            }
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
                    {/* <View style={screenStyles.wonBadge}>
                    <Ionicons name="trophy-outline" size={13} color="#16a34a" style={{ marginRight: 4 }} />
                    <Text style={screenStyles.wonBadgeText}>{formatAmount(wonTotal)} won</Text>
                </View> */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={screenStyles.newDealButtonContainer}
                        onPress={() => { router.push('/deal/create-deal') }}
                    >
                        <View
                            style={screenStyles.newDealIcon}
                        >
                            <Plus size={18} color="#fff" />
                        </View>

                        <View>
                            <Text
                                style={screenStyles.newDealButtonText}
                            >
                                New Deal
                            </Text>
                        </View>
                    </TouchableOpacity>
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
                    {deal_stage.map((stage: DealStage) => {

                        const cfg = getStageConfig(stage);

                        const stageDeals = formattedDeals.filter(
                            d => d.stage?.id === stage.id
                        );

                        return (
                            <View
                                key={stage.id}
                                style={[
                                    screenStyles.column,
                                    { width: COLUMN_WIDTH }
                                ]}
                            >

                                {/* Column header */}
                                <View style={screenStyles.colHeader}>
                                    <View style={screenStyles.colHeaderLeft}>
                                        <View
                                            style={[
                                                screenStyles.colDot,
                                                { backgroundColor: cfg.dot }
                                            ]}
                                        />

                                        <Text style={screenStyles.colTitle}>
                                            {stage.stage_name}
                                        </Text>

                                        <View
                                            style={[
                                                screenStyles.colCount,
                                                { backgroundColor: cfg.badge }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    screenStyles.colCountText,
                                                    { color: cfg.color }
                                                ]}
                                            >
                                                {stageDeals.length}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text
                                        style={[
                                            screenStyles.colTotal,
                                            { color: cfg.color }
                                        ]}
                                    >
                                        {formatAmount(
                                            totalByStage(
                                                formattedDeals,
                                                stage.id
                                            )
                                        )}
                                    </Text>
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    nestedScrollEnabled
                                >
                                    {stageDeals.length === 0 ? (
                                        <View
                                            style={[
                                                screenStyles.emptyCol,
                                                { borderColor: cfg.dot + '40' }
                                            ]}
                                        >
                                            <Ionicons
                                                name="file-tray-outline"
                                                size={28}
                                                color={cfg.dot + '80'}
                                            />

                                            <Text
                                                style={[
                                                    screenStyles.emptyText,
                                                    { color: cfg.color + '99' }
                                                ]}
                                            >
                                                No deals
                                            </Text>

                                            <Text style={screenStyles.emptyHint}>
                                                Long press a card to move here
                                            </Text>
                                        </View>
                                    ) : (
                                        stageDeals.map(deal => (
                                            <DealCard
                                                key={deal.id}
                                                deal={deal}
                                                onLongPress={() => openMoveModal(deal)}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: '/deal/deal-detail',
                                                        params: {
                                                            id: Number(deal.id),
                                                        },
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
                    stages={deal_stage}
                    onClose={() => {
                        setMoveModalVisible(false);
                        setMoveTarget(null);
                    }}
                />
            </View>
        </>
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

    kanban: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
    column: {
        backgroundColor: '#f1f2f8',
        borderRadius: 10,
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
    newDealIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    newDealButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,

        shadowColor: '#2563eb',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 3,
    },
    newDealButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
    }
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