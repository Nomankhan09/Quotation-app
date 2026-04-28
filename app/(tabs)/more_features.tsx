import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Grid3x3, Package, Settings, Users } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchDashboardSummary } from '@/store/slices/dashboardSlice';

type Feature = {
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    bg: string;
    screen: string;
};

export default function MoreFeaturesScreen() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { total_leads, total_products, total_categories, total_conversions } = useSelector((state: RootState) => state.dashboard);

    useEffect(() => {
        dispatch(fetchDashboardSummary());
    }, [dispatch]);

    const FEATURES: Feature[] = [
        { title: 'Category', subtitle: `${total_categories} categories`, icon: Grid3x3, color: '#2563eb', bg: '#eff6ff', screen: '/categories' },
        { title: 'Products', subtitle: `${total_products} products`, icon: Package, color: '#059669', bg: '#ecfdf5', screen: '/products' },
        { title: 'Quotations', subtitle: `${total_conversions} quotes`, icon: FileText, color: '#ea580c', bg: '#fff7ed', screen: '/(tabs)/quotations' },
        // { title: 'Leads', subtitle: '5 active', icon: Users, color: '#6d28d9', bg: '#f5f3ff', screen: 'Leads' },
        { title: 'Settings', subtitle: 'Profile', icon: Settings, color: '#6b7280', bg: '#f3f4f6', screen: '/settings' },

        // { title: 'Reports', subtitle: 'Analytics', icon: 'stats-chart-outline', color: '#7c3aed', bg: '#f5f3ff', screen: 'Reports' },
        // { title: 'Calendar', subtitle: '7 events', icon: 'calendar-outline', color: '#dc2626', bg: '#fef2f2', screen: 'Calendar' },

        // { title: 'Contracts', subtitle: '5 active', icon: 'document-outline', color: '#047857', bg: '#ecfdf5', screen: 'Contracts' },
        // { title: 'Support', subtitle: '2 open', icon: 'alert-circle-outline', color: '#b91c1c', bg: '#fef2f2', screen: 'Support' },
        // { title: 'Goals', subtitle: '80% target', icon: 'flag-outline', color: '#065f46', bg: '#ecfdf5', screen: 'Goals' },

        // { title: 'Notifications', subtitle: '5 alerts', icon: 'notifications-outline', color: '#1d4ed8', bg: '#eff6ff', screen: 'Notifications' },
        // { title: 'Companies', subtitle: '6 accounts', icon: 'briefcase-outline', color: '#374151', bg: '#f3f4f6', screen: 'Companies' },
    ];

    const renderItem = ({ item }: { item: Feature }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(item.screen as never)}
        >
            <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                <item.icon size={22} color={item.color} />
            </View>

            <Text style={styles.title} numberOfLines={1}>
                {item.title}
            </Text>

            <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>More Features</Text>

            <FlatList
                data={FEATURES}
                renderItem={renderItem}
                keyExtractor={(item) => item.title}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    header: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
    },

    list: {
        paddingHorizontal: 14,
        paddingBottom: 30,
    },

    row: {
        justifyContent: 'flex-start',
        gap: 11,
        marginBottom: 14,
    },

    card: {
        width: '31%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 18,   // ✅ medium height
        paddingHorizontal: 10,
        alignItems: 'center',

        // ✨ subtle premium look
        borderWidth: 1,
        borderColor: '#eef2f7',

        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },

    iconWrap: {
        width: 46,
        height: 46,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    title: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 3,
        textAlign: 'center',
    },
});