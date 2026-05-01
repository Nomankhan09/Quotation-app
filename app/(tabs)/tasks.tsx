import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskForm from '@/components/TaskForm'; // ← your existing TaskForm
import { editTask, ITask, loadTasks } from '@/store/slices/taskSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { loadAllLeads } from '@/store/slices/leadsSlice';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterTab = 'All' | 'Today' | 'High' | 'Done';
const FILTERS: FilterTab[] = ['All', 'Today', 'High', 'Done'];
type Priority = 'Low' | 'Medium' | 'High';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isOverdue = (dateStr: string) => new Date(dateStr.replace(' ', 'T')) < new Date();
const isToday = (dateStr: string) => {
    const d = new Date(dateStr.replace(' ', 'T'));
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};
const formatShort = (dateStr: string) => {
    const d = new Date(dateStr.replace(' ', 'T'));
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
};
const getDaysOverdue = (dateStr: string) => {
    const date = new Date(dateStr.replace(' ', 'T'));
    const now = new Date();

    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    }) + `, ${time}`;
};

const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
    Low: { color: '#22c55e', bg: '#dcfce7' },
    Medium: { color: '#f59e0b', bg: '#fef3c7' },
    High: { color: '#ef4444', bg: '#fee2e2' },
};

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#14b8a6', '#8b5cf6'];
const avatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 34 }: { name: string; size?: number }) => {
    const color = avatarColor(name);
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color + '22', justifyContent: 'center', alignItems: 'center',
        }}>
            <Text style={{ fontSize: size * 0.35, fontWeight: '700', color }}>{initials}</Text>
        </View>
    );
};

// ─── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onPress, toggleComplete }: { task: ITask; onPress: () => void, toggleComplete: any }) => {
    const pm = PRIORITY_META[task.priority as Priority] ?? PRIORITY_META.Medium;
    const overdue = isOverdue(task.due_date) && task.status !== 'completed';
    const today = isToday(task.due_date) && !overdue;
    const done = task.status === 'completed';

    return (
        <TouchableOpacity
            style={[cardStyles.card, done && cardStyles.cardDone]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <View style={[cardStyles.bar, { backgroundColor: overdue ? '#ef4444' : done ? '#d1d5db' : pm.color }]} />
            <View style={cardStyles.content}>
                <View style={cardStyles.row}>
                    <TouchableOpacity
                        onPress={() => toggleComplete(task)}
                        style={[cardStyles.check, done && cardStyles.checkDone]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        {done && <Ionicons name="checkmark" size={11} color="#fff" />}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={[cardStyles.title, done && cardStyles.titleDone]} numberOfLines={1}>
                            {task.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: 'gray', fontWeight: '500' }}>
                            {task.notes}
                        </Text>
                        {(task as any).contact && (
                            <Text style={cardStyles.sub} numberOfLines={1}>
                                {(task as any).contact.full_name}
                                {(task as any).contact.company ? ` · ${(task as any).contact.company}` : ''}
                            </Text>
                        )}
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        <View style={[cardStyles.badge, { backgroundColor: pm.bg }]}>
                            <Text style={[cardStyles.badgeText, { color: pm.color }]}>{task.priority}</Text>
                        </View>
                        {overdue && (
                            <View style={[cardStyles.badge, { backgroundColor: '#fee2e2' }]}>
                                <Text style={[cardStyles.badgeText, { color: '#ef4444' }]}>
                                    {`${getDaysOverdue(task.due_date)} overdue`}
                                </Text>
                            </View>
                        )}
                        {today && (
                            <View style={[cardStyles.badge, { backgroundColor: '#fef3c7' }]}>
                                <Text style={[cardStyles.badgeText, { color: '#d97706' }]}>Today</Text>
                            </View>
                        )}
                        {!overdue && !today && !done && (
                            <Text style={cardStyles.dateText}>{formatShort(task.due_date)}</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ─── Reminder Card ────────────────────────────────────────────────────────────
const ReminderCard = ({ task }: { task: ITask }) => {
    const overdue = isOverdue(task.due_date) && task.status !== 'completed';
    const accent = overdue ? '#ef4444' : isToday(task.due_date) ? '#f59e0b' : '#6366f1';
    const bg = overdue ? '#fef2f2' : isToday(task.due_date) ? '#fefce8' : '#f0f4ff';

    return (
        <View style={[remStyles.card, { backgroundColor: bg, borderLeftColor: accent }]}>
            {(task as any).contact && (
                <Avatar name={(task as any).contact.full_name} size={32} />
            )}
            <View style={{ flex: 1, marginLeft: (task as any).contact ? 10 : 0 }}>
                <Text style={remStyles.title} numberOfLines={1}>{task.title}</Text>
                <Text style={remStyles.sub} numberOfLines={1}>
                    {overdue
                        ? `${getDaysOverdue(task.due_date)} overdue`
                        : `${(task as any).contact?.full_name ?? ''} · ${formatShort(task.due_date)}`}
                </Text>
            </View>
            <View style={[remStyles.dot, { backgroundColor: accent }]} />
        </View>
    );
};

// ─── TaskScreen ───────────────────────────────────────────────────────────────
export default function TaskScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<ITask | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

    // ── Wire these to your Redux selectors ──
    const dispatch = useDispatch<AppDispatch>();
    const { tasks } = useSelector((state: RootState) => state.tasks);
    const { leads } = useSelector(
        (state: RootState) => state.leads
    );

    const toggleComplete = React.useCallback((task: ITask) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        dispatch(editTask({
            id: String(task.id),
            data: {
                contact_id: task.contact_id,
                title: task.title,
                status: newStatus,
                due_date: task.due_date,
                priority: task.priority,
                notes: task.notes,
            },
        }));
    }, [dispatch]);

    const dueToday = tasks.filter(t => isToday(t.due_date) && t.status !== 'completed').length;
    const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length;
    const doneCount = tasks.filter(t => t.status === 'completed').length;
    const reminders = tasks.filter(t => (isOverdue(t.due_date) || isToday(t.due_date)) && t.status !== 'completed').slice(0, 3);

    const filtered = tasks.filter(t => {
        if (activeFilter === 'Today') return isToday(t.due_date);
        if (activeFilter === 'High') return t.priority === 'High' && t.status !== 'completed';
        if (activeFilter === 'Done') return t.status === 'completed';
        return true;
    });

    const STATS = [
        { label: 'Due today', value: dueToday, color: '#d97706', bg: '#fef3c7', icon: 'time-outline' as const },
        { label: 'Overdue', value: overdueCount, color: '#ef4444', bg: '#fee2e2', icon: 'alert-circle-outline' as const },
        { label: 'Done', value: doneCount, color: '#16a34a', bg: '#dcfce7', icon: 'checkmark-done-outline' as const },
        { label: 'Total', value: tasks.length, color: '#7c3aed', bg: '#ede9fe', icon: 'list-outline' as const },
    ];

    useEffect(() => {
        dispatch(loadTasks());
        dispatch(loadAllLeads());
    }, [dispatch]);

    return (
        <View style={screenStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />

            {/* ── Header ── */}
            <View style={screenStyles.header}>
                <Text style={screenStyles.pageTitle}>Tasks</Text>
                <TouchableOpacity
                    style={screenStyles.addBtn}
                    onPress={() => { setEditingTask(null); setModalVisible(true); }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={screenStyles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, marginTop: 10 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Stats ── */}
                <View style={screenStyles.statsRow}>
                    {STATS.map(s => (
                        <View key={s.label} style={[screenStyles.statCard, { backgroundColor: s.bg }]}>
                            <Ionicons name={s.icon} size={15} color={s.color} />
                            <Text style={[screenStyles.statNum, { color: s.color }]}>{s.value}</Text>
                            <Text style={screenStyles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Reminders ── */}
                {reminders.length > 0 && (
                    <View style={screenStyles.section}>
                        <View style={screenStyles.sectionHeader}>
                            <Ionicons name="notifications-outline" size={15} color="#6b7280" style={{ marginRight: 6 }} />
                            <Text style={screenStyles.sectionTitle}>Reminders</Text>
                            <View style={screenStyles.countBadge}>
                                <Text style={screenStyles.countBadgeText}>{reminders.length}</Text>
                            </View>
                        </View>
                        {reminders.map(t => <ReminderCard key={String(t.id)} task={t} />)}
                    </View>
                )}

                {/* ── Filter tabs ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 12 }}
                    contentContainerStyle={{ gap: 8 }}
                >
                    {FILTERS.map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[screenStyles.tab, activeFilter === f && screenStyles.tabActive]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[screenStyles.tabText, activeFilter === f && screenStyles.tabTextActive]}>
                                {f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ── Task list ── */}
                {filtered.length === 0 ? (
                    <View style={screenStyles.empty}>
                        <Ionicons name="checkmark-circle-outline" size={52} color="#e5e7eb" />
                        <Text style={screenStyles.emptyTitle}>All clear here!</Text>
                        <Text style={screenStyles.emptySubtitle}>Tap + Add to create a new task</Text>
                    </View>
                ) : (
                    filtered.map((task: ITask) => (
                        <TaskCard
                            key={String(task.id)}
                            task={task}
                            onPress={() => { setEditingTask(task); setModalVisible(true); }}
                            toggleComplete={toggleComplete}
                        />
                    ))
                )}
            </ScrollView>


            <TaskForm
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                onClose={() => { setModalVisible(false); setEditingTask(null); }}
                editingTask={editingTask}
                isTaskDirect={true}
                contacts={leads}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9ff' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 22 : 16,
        paddingBottom: 6,
    },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5, textAlign: 'center', verticalAlign: 'middle' },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
        shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    statCard: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 14, gap: 2,
    },
    statNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontSize: 10, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3 },

    section: {
        backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', flex: 1 },
    countBadge: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
    countBadgeText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },

    tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
    tabActive: { backgroundColor: '#6366f1' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    tabTextActive: { color: '#fff' },

    empty: { alignItems: 'center', paddingVertical: 64 },
    emptyTitle: { color: '#6b7280', fontSize: 16, fontWeight: '700', marginTop: 12 },
    emptySubtitle: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
});

const cardStyles = StyleSheet.create({
    card: {
        flexDirection: 'row', backgroundColor: '#fff',
        borderRadius: 16, marginBottom: 8,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
        elevation: 2, overflow: 'hidden',
    },
    cardDone: { opacity: 0.55 },
    bar: { width: 4 },
    content: { flex: 1, paddingHorizontal: 14, paddingVertical: 13 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    check: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: '#d1d5db',
        justifyContent: 'center', alignItems: 'center',
    },
    checkDone: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
    title: { fontSize: 14, fontWeight: '600', color: '#111827' },
    titleDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
    sub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    dateText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
});

const remStyles = StyleSheet.create({
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
        borderLeftWidth: 3, marginBottom: 8,
    },
    title: { fontSize: 13, fontWeight: '700', color: '#111827' },
    sub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    dot: { width: 7, height: 7, borderRadius: 4, marginLeft: 8 },
});