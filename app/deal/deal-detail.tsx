import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { editDealStage, loadDealById } from '@/store/slices/dealSlice';
import { RootState } from '@/store';
import { StageBadge } from '@/utils/stageBadge';
import { formatOnlyDate } from '@/utils/date_format';
import LeadActivity from '../lead/LeadActivity';
import StatusPickerModal from '@/components/StatusPickerModal';

export default function DealDetailScreen() {
    const { id } = useLocalSearchParams();
    const dispatch = useDispatch<any>();
    const [showStageModal, setShowStageModal] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<any>(null);
    const [isUpdatingStage, setIsUpdatingStage] = useState(false);
    const { selectedDeal: deal, selectedDealLoading } = useSelector((s: RootState) => s.deals);
    const { deal_stage } = useSelector(
        (state: RootState) => state.deals
    );

    useEffect(() => {
        dispatch(loadDealById(Number(id)));
    }, [id]);

    // 🔥 Selected quotation logic
    const selectedQuotation = useMemo(() => {

        if (!deal?.quotation || deal.quotation.length === 0) {
            return null;
        }

        return (
            deal.quotation.find(
                (q: any) => q.id === deal?.quotation_id
            ) || deal.quotation[0]
        );

    }, [deal]);

    const [activeQuote, setActiveQuote] = useState<any>(selectedQuotation);

    useEffect(() => {
        setActiveQuote(selectedQuotation);
    }, [selectedQuotation]);

    if (selectedDealLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />

                <Text style={{ marginTop: 10 }}>
                    Loading deal...
                </Text>
            </View>
        );
    }

    if (!deal) {
        return (
            <View style={styles.center}>
                <Text>No Deal Data</Text>
            </View>
        );
    }

    // status change api
    const handleStageChange = async (stageName: string) => {
        const targetDeal = selectedDeal || deal;
        if (!targetDeal) return;

        try {
            setIsUpdatingStage(true);

            // find stage id from name
            const stageObj = deal_stage.find(
                (s: any) => s.stage_name === stageName
            );

            if (!stageObj) return;

            await dispatch(
                editDealStage({
                    id: targetDeal.id,
                    payload: {
                        stage_id: stageObj.id,
                    },
                })
            ).unwrap();

            setShowStageModal(false);
            setSelectedDeal(null);

        } catch (e) {
            console.log('Stage update error', e);
        } finally {
            setIsUpdatingStage(false);
        }
    };

    const confirmStageChange = (
        stageName: string
    ) => {

        Alert.alert(
            `Mark as ${stageName}?`,
            `Are you sure you want to mark this deal as ${stageName.toLowerCase()}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    style:
                        stageName === 'Lost'
                            ? 'destructive'
                            : 'default',
                    onPress: () =>
                        handleStageChange(stageName),
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.headerIconBtn}
                >
                    <Ionicons
                        name="chevron-back"
                        size={22}
                        color="#111827"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Deal Details
                </Text>

                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                        router.push({
                            pathname: "/deal/create-deal",
                            params: {
                                deal: JSON.stringify(deal),
                                edit: "true",
                            },
                        });
                    }}
                >
                    <Ionicons
                        name="create-outline"
                        size={16}
                        color="#2563eb"
                    />

                    <Text style={styles.editText}>
                        Edit
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
            >

                {/* TOP */}
                <View style={styles.topSection}>

                    <Text style={styles.name}>
                        {deal.lead?.full_name || 'Unknown'}
                    </Text>

                    <Text style={styles.sub}>
                        {deal.title || 'No Title'}
                    </Text>

                    <View style={styles.amountRow}>

                        <Text style={styles.amount}>
                            ₹{Number(
                                activeQuote?.total_amount || 0
                            ).toLocaleString('en-IN')}
                        </Text>

                        <TouchableOpacity style={{ marginLeft: 20 }}
                            onPress={() => {
                                setSelectedDeal(deal);
                                setShowStageModal(true);
                            }}>
                            <StageBadge
                                stage={deal.stage?.stage_name || ''}
                                color={deal.stage?.color}
                            />
                        </TouchableOpacity>
                    </View>

                </View>

                {/* DETAILS */}
                <View style={styles.detailsWrapper}>
                    <View style={styles.detailsSection}>

                        <InfoRow
                            icon="person-outline"
                            label="Lead"
                            value={deal.lead?.full_name}
                        />

                        <InfoRow
                            icon="git-network-outline"
                            label="Pipeline Stage"
                            value={deal.stage?.stage_name}
                        />

                        <InfoRow
                            icon="cube-outline"
                            label="Products"
                            value={`${activeQuote?.products_count || 0}`}
                        />

                        <InfoRow
                            icon="calendar-outline"
                            label="Expected Close Date"
                            value={deal.expected_close_date ? formatOnlyDate(new Date(deal.expected_close_date as any)) : "-"}
                        />

                        <InfoRow
                            icon="time-outline"
                            label="Created On"
                            value={formatOnlyDate(new Date(deal.created_at)) || "-"}
                        />

                    </View>
                </View>

                {/* QUOTATION SELECTOR */}
                <View style={styles.quoteSection}>
                    <Text style={{ fontSize: 20, fontWeight: '700' }}>Quotations </Text>
                    {!deal.quotation || deal.quotation.length === 0 ? (

                        <View
                            style={{
                                marginTop: 14,
                                marginBottom: 12,
                                paddingVertical: 24,
                                borderRadius: 16,
                                backgroundColor: '#f9fafb',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: '#e5e7eb',
                                borderStyle: 'dashed',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#9ca3af',
                                    fontWeight: '600',
                                }}
                            >
                                No quotation yet
                            </Text>
                        </View>

                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.quoteScroll}
                        >
                            {deal.quotation?.map((q: any, index: number) => {

                                const isSelected =
                                    activeQuote?.id === q.id;

                                return (
                                    <View style={styles.quoteContainer} key={index}>
                                        <TouchableOpacity
                                            key={q.id}
                                            activeOpacity={0.85}
                                            onPress={() => setActiveQuote(q)}
                                            style={[
                                                styles.quoteBox,
                                                isSelected &&
                                                styles.quoteBoxActive
                                            ]}
                                        >

                                            <Text
                                                style={[
                                                    styles.quoteText,
                                                    isSelected && {
                                                        color: '#16a34a'
                                                    }
                                                ]}
                                            >
                                                Quote #{q.id}
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.quotePrice,
                                                    isSelected && {
                                                        color: '#16a34a'
                                                    }
                                                ]}
                                            >
                                                ₹{Number(
                                                    q.total_amount || 0
                                                ).toLocaleString('en-IN')}
                                            </Text>

                                            <Text style={styles.quoteMeta}>
                                                {q.products_count || 0} items
                                            </Text>

                                        </TouchableOpacity>
                                    </View>
                                );
                            })}

                        </ScrollView>
                    )}
                </View>

                {/* Lead Activity */}
                {deal?.lead_id &&
                    <View style={styles.activityContainer}>
                        {/* <View style={{}}> */}
                        <Text style={{
                            fontSize: 20, fontWeight: '600', paddingHorizontal: 22,
                            paddingTop: 10, paddingBottom: 10
                        }}>Activity</Text>
                        {/* </View> */}
                        <LeadActivity lead={deal?.lead} embedded />
                    </View>
                }

                <View style={{ height: 80 }} />

            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>

                <TouchableOpacity style={styles.lostBtn} onPress={() => { confirmStageChange("Lost") }} >
                    <Text style={styles.lostText}>
                        Mark Lost
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.winBtn} onPress={() => { confirmStageChange("Won") }} disabled={!activeQuote} >
                    <Text style={styles.winText}>
                        Mark Won
                    </Text>
                </TouchableOpacity>

            </View>

            {/* Deal status change */}
            <StatusPickerModal
                visible={showStageModal}
                onClose={() => setShowStageModal(false)}
                statuses={deal_stage.map((s: any) => ({
                    id: s.id,
                    status: s.stage_name,
                    color: s.color,
                }))}
                currentStatus={selectedDeal?.stage?.stage_name}
                dealLoading={isUpdatingStage}
                onSelect={handleStageChange}
            />
        </View>
    );
}

const InfoRow = ({
    icon,
    label,
    value,
}: any) => (

    <View style={styles.infoRow}>

        <View style={styles.infoLeft}>

            <Ionicons
                name={icon}
                size={18}
                color="#9ca3af"
            />

            <Text style={styles.infoLabel}>
                {label}
            </Text>

        </View>

        <Text style={styles.infoValue}>
            {value || '-'}
        </Text>

    </View>
);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8fc',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eef2f7',
    },

    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },

    editText: {
        marginLeft: 4,
        color: '#2563eb',
        fontWeight: '600',
    },


    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    body: {
        backgroundColor: '#fff',
    },

    topSection: {
        paddingBottom: 12,
        paddingHorizontal: 22,
    },

    name: {
        fontSize: 30,
        fontWeight: '800',
        color: '#111827',
        marginTop: 5,
    },

    sub: {
        marginTop: 4,
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '500',
    },

    amountRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'center'
        // justifyContent: 'space-between',
    },

    amount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#16a34a',
        letterSpacing: -1.5,
    },

    quoteScroll: {
        paddingBottom: 22,
    },

    quoteContainer: {
        marginTop: 10,
    },
    quoteBox: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 12,
        minWidth: 115,
    },

    quoteBoxActive: {
        backgroundColor: '#f0fdf4',
        borderColor: '#16a34a',
    },

    quoteText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },

    quotePrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginTop: 2,
    },

    detailsSection: {
        marginTop: 6,
    },

    section: {
        marginTop: 26,
    },


    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },

    quoteCount: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '600',
        marginRight: 7
    },


    quoteCardActive: {
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
    },

    quoteId: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },

    quoteAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginTop: 10,
    },

    quoteMeta: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 6,
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        // borderBottomWidth: 1,
        // borderBottomColor: '#f5f5f5',
    },

    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoLabel: {
        marginLeft: 12,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },

    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eef2f7',
        gap: 12,
    },

    lostBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#fecaca',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        backgroundColor: '#fff',
    },

    lostText: {
        color: '#dc2626',
        fontWeight: '700',
        fontSize: 15,
    },

    winBtn: {
        flex: 1,
        backgroundColor: '#16a34a',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
    },

    winText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsWrapper: {
        paddingHorizontal: 22,
        // borderTopWidth: 1,
        // borderTopColor: '#f3f4f6',
    },
    quoteSection: {
        paddingHorizontal: 22,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    activityContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        // paddingTop: 14,
        // marginTop: 10,
    },
});