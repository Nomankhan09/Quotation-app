import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    InteractionManager,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { Plus, Search, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Avatar from '@/utils/avatar';
import { editDealStage, loadDeals, loadDealStage } from '@/store/slices/dealSlice';
import { timeAgo } from '@/utils/date_format';
import StatusPickerModal from '@/components/StatusPickerModal';
import { StageBadge } from '@/utils/stageBadge';
import { Ionicons } from '@expo/vector-icons';

export default function DealsScreen() {
    const dispatch = useDispatch<any>();
    const { deals, deal_stage, dealLoading, initialLoadDone, stagesInitialized } = useSelector(
        (state: RootState) => state.deals
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStage, setSelectedStage] = useState('All');
    const [showSearch, setShowSearch] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<any>(null);
    const [isUpdatingStage, setIsUpdatingStage] = useState(false);

    // 🔥 LOAD DATA
    useEffect(() => {
        dispatch(loadDeals({}));

        InteractionManager.runAfterInteractions(() => {
            if (!stagesInitialized) {
                dispatch(loadDealStage());
            }
        });
    }, []);

    // 🔍 FILTER
    const filteredDeals = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return deals.filter((deal: any) => {
            const matchesSearch =
                deal.title?.toLowerCase().includes(q) ||
                deal.lead?.full_name?.toLowerCase().includes(q);

            const selectedStageObj = deal_stage.find(
                (s: any) => s.stage_name === selectedStage
            );

            const matchesStage =
                selectedStage === 'All' ||
                deal.stage_id === selectedStageObj?.id;

            return matchesSearch && matchesStage;
        });
    }, [deals, searchQuery, selectedStage, deal_stage]);


    // 📦 RENDER ITEM
    const renderDealItem = ({ item }: any) => {
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                    router.push({
                        pathname: '/deal/deal-detail',
                        params: { id: item.id },
                    })
                }
            >
                <Avatar item={item.lead} height={50} width={50} />

                <View style={styles.center}>
                    <Text style={styles.name}>{item.lead?.full_name}</Text>
                    <Text style={styles.sub}>{item.title}</Text>

                    {item.quotation?.[0]?.total_amount &&
                        <Text style={styles.value}>
                            ₹{item.quotation?.[0]?.total_amount?.toLocaleString('en-IN')}
                        </Text>
                    }
                </View>

                <View style={styles.right}>
                    {item.stage && (
                        <TouchableOpacity
                            // style={styles.badge}
                            onPress={() => {
                                setSelectedDeal(item);
                                setShowStageModal(true);
                            }}
                        >
                            <StageBadge
                                stage={item.stage?.stage_name}
                                color={item.stage?.color}
                            />
                        </TouchableOpacity>
                    )}


                    <Text style={styles.time}>
                        {timeAgo(item.created_at)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // status change api
    const handleStageChange = async (stageName: string) => {
        if (!selectedDeal) return;

        try {
            setIsUpdatingStage(true);

            // find stage id from name
            const stageObj = deal_stage.find(
                (s: any) => s.stage_name === stageName
            );

            if (!stageObj) return;

            await dispatch(
                editDealStage({
                    id: selectedDeal.id,
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

    return (
        <View style={styles.container}>

            {/* 🔥 HEADER */}
            <View style={styles.topContainer}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color="#007AFF" />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    {/* CENTER */}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        {!showSearch ? (
                            <Text style={styles.screenTitle}>Deals</Text>
                        ) : (
                            <View style={styles.searchInlineWrap}>
                                <Search size={18} color="#9CA3AF" />
                                <TextInput
                                    autoFocus
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search deals..."
                                    style={styles.inlineSearchInput}
                                />
                            </View>
                        )}
                    </View>

                    {/* Add button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={styles.circleIconBtn}
                            onPress={() => router.push('/deal/create-deal')}
                        >
                            <Plus size={22} color="#111827" />
                        </TouchableOpacity>

                        {/* RIGHT */}
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => {
                                if (showSearch) setSearchQuery('');
                                setShowSearch(!showSearch);
                            }}
                        >
                            {!showSearch ? (
                                <Search size={21} color="#111827" />
                            ) : (
                                <X size={21} color="#111827" />
                            )}
                        </TouchableOpacity>
                    </View>

                </View>

                {/* 🔥 STAGE FILTER */}
                <View style={styles.filterTabsWrap}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[{ stage_name: 'All' }, ...deal_stage].map((item: any) => {
                            const active = selectedStage === item.stage_name;

                            return (
                                <TouchableOpacity
                                    key={item.stage_name}
                                    style={styles.filterTab}
                                    onPress={() => setSelectedStage(item.stage_name)}
                                >
                                    <Text
                                        style={[
                                            styles.filterTabText,
                                            active && styles.filterTabTextActive,
                                        ]}
                                    >
                                        {item.stage_name}
                                    </Text>

                                    {active && <View style={styles.activeLine} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* 📋 LIST */}
            <View style={{ flex: 1 }}>
                <FlatList
                    data={filteredDeals}
                    renderItem={renderDealItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        initialLoadDone && !dealLoading ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No deals found</Text>
                            </View>
                        ) : null
                    }
                />
                {dealLoading && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.6)' // optional blur effect
                    }}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                )}
            </View>

            {/* Deal status */}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    center: { flex: 1, marginLeft: 12 },
    name: { fontSize: 15, fontWeight: '700' },
    sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },

    badge: {
        marginTop: 6,
        backgroundColor: '#eef2ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },

    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        // color: '#4f46e5',
    },

    right: { alignItems: 'flex-end' },
    value: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    time: { fontSize: 12, color: '#9ca3af', marginTop: 4 },

    empty: { marginTop: 50, alignItems: 'center' },
    emptyText: { color: '#64748B' },

    topContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    circleIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 999,

        backgroundColor: '#F8FAFC',

        justifyContent: 'center',
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#EEF2F7',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginLeft: '10%'
    },
    searchInlineWrap: {
        flex: 1,
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 14,
        borderRadius: 999,
        paddingHorizontal: 14,
    },

    inlineSearchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#111827',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },

    filterTabsWrap: {
        paddingHorizontal: 14,
    },

    filterTab: {
        paddingHorizontal: 10,
        paddingBottom: 12,
        marginRight: 18,
        alignItems: 'center',
    },

    filterTabText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '600',
    },

    filterTabTextActive: {
        color: '#2563EB',
        fontWeight: '700',
    },

    activeLine: {
        marginTop: 10,
        width: '100%',
        height: 3,
        borderRadius: 999,
        backgroundColor: '#2563EB',
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: '#007AFF', fontSize: 16, marginLeft: 2 },
    backIcon: {
        fontSize: 24,
        color: "#0f172a",
        marginTop: -2,
        fontWeight: "300",
    },
});