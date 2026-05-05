import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { Plus, Search, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Avatar from '@/utils/avatar';
import { loadDeals, loadDealStage } from '@/store/slices/dealSlice';
import { timeAgo } from '@/utils/date_format';

export default function DealsScreen() {
    const dispatch = useDispatch<any>();

    const { deals, deal_stage, loading } = useSelector(
        (state: RootState) => state.deals
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStage, setSelectedStage] = useState('All');
    const [showSearch, setShowSearch] = useState(false);

    // 🔥 LOAD DATA
    useEffect(() => {
        dispatch(loadDealStage());
        dispatch(loadDeals({}));
    }, []);

    // 🔍 FILTER
    const filteredDeals = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return deals.filter((deal: any) => {
            const matchesSearch =
                deal.title?.toLowerCase().includes(q) ||
                deal.lead?.full_name?.toLowerCase().includes(q);

            const matchesStage =
                selectedStage === 'All' ||
                deal.stage?.stage_name === selectedStage;

            return matchesSearch && matchesStage;
        });
    }, [deals, searchQuery, selectedStage]);

    // 📦 RENDER ITEM
    const renderDealItem = ({ item }: any) => {
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
            // onPress={() =>
            //     router.push({
            //         pathname: '/deal/details',
            //         params: { deal: JSON.stringify(item) },
            //     })
            // }
            >
                <Avatar item={item.lead} height={50} width={50} />

                <View style={styles.center}>
                    <Text style={styles.name}>{item.lead?.full_name}</Text>
                    <Text style={styles.sub}>{item.title}</Text>

                    {item.stage && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {item.stage.stage_name}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.right}>
                    <Text style={styles.value}>
                        ₹{item.value?.toLocaleString('en-IN')}
                    </Text>

                    <Text style={styles.time}>
                        {timeAgo(item.created_at)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>

            {/* 🔥 HEADER */}
            <View style={styles.topContainer}>
                <View style={styles.topBar}>

                    {/* LEFT */}
                    <TouchableOpacity
                        style={styles.circleIconBtn}
                        onPress={() => router.push('/deal/create-deal')}
                    >
                        <Plus size={22} color="#111827" />
                    </TouchableOpacity>

                    {/* CENTER */}
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
            <FlatList
                data={filteredDeals}
                renderItem={renderDealItem}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No deals found</Text>
                    </View>
                }
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
        color: '#4f46e5',
    },

    right: { alignItems: 'flex-end' },
    value: { fontSize: 14, fontWeight: '700' },
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
        width: 42,
        height: 42,
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
});