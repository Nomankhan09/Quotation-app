import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import React from 'react'
import { ITask } from '@/store/slices/taskSlice';
import { useRouter } from 'expo-router';

interface IPayload {
    loading: boolean;
    tasks: ITask[];
    openEdit?: any;
    toggleComplete: any;
    isDashboard?: boolean
}

export default function TaskList({ loading, tasks, openEdit, toggleComplete, isDashboard }: IPayload) {
    const router = useRouter();
    const isOverdue = (due_date: string | null): boolean => {
        if (!due_date) return false;
        return new Date(due_date.replace(' ', 'T')).getTime() < Date.now();
    };

    const formatDueDate = (due_date: string | null): string => {
        if (!due_date) return '';
        const date = new Date(due_date.replace(' ', 'T'));
        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            // Show time like "2:30 PM"
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }

        // Show date like "Apr 16"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const navigateTasks = () => {
        router.push('/tasks');
    }

    return (
        <View>
            {isDashboard && (
                <View style={styles.taskHeader}>
                    <Text style={styles.taskHeaderTitle}>TODAY'S TASKS</Text>
                    {/* <TouchableOpacity onPress={navigateTasks}>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity> */}
                </View>
            )}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="small" color="#6366f1" />
                </View>
            ) : !tasks || tasks?.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyText}>{isDashboard ? "Today no tasks yet" : "No tasks yet" }</Text>
                </View>
            ) : (
                <>
                    <View style={styles.card}>
                        {tasks?.map((task: ITask, index: number) => {
                            const overdue = isOverdue(task.due_date) && task.status !== 'completed';
                            const dueDateLabel = formatDueDate(task.due_date);
                            const isDone = task.status === 'completed';
                            const isLast = index === tasks.length - 1;

                            return (
                                <View key={task.id}>
                                    <TouchableOpacity
                                        key={task.id}
                                        onPress={() => openEdit && openEdit(task)}
                                        activeOpacity={0.7}
                                        style={[styles.taskRow, !isLast && styles.taskRowBorder]}
                                    >
                                        {/* Circle checkbox */}
                                        <TouchableOpacity
                                            onPress={() => toggleComplete(task)}
                                            style={[
                                                styles.checkbox,
                                                isDone && styles.checkboxDone,
                                            ]}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            {isDone && <Text style={styles.checkmark}>✓</Text>}
                                        </TouchableOpacity>

                                        {/* Title + company */}
                                        <View style={styles.taskInfo}>
                                            <Text
                                                style={[
                                                    styles.taskTitle,
                                                    isDone && styles.taskTitleDone,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {task.title}
                                            </Text>
                                            <Text style={styles.taskNotes}>
                                                {task.notes}
                                            </Text>
                                            {/* {lead.company || lead.name ? (
                                              <Text style={styles.taskNotes}>
                                                  {lead.company ?? lead.name}
                                              </Text>
                                          ) : null} */}
                                        </View>

                                        {/* Due date badge / Done badge */}
                                        {isDone ? (
                                            <View style={styles.badgeDone}>
                                                <Text style={styles.badgeDoneText}>Done</Text>
                                            </View>
                                        ) : dueDateLabel ? (
                                            <View style={[styles.badge, overdue && styles.badgeOverdue]}>
                                                <Text style={[styles.badgeText, overdue && styles.badgeTextOverdue]}>
                                                    {dueDateLabel}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                </>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    // Empty / loading
    centered: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 36,
        gap: 8,
    },
    emptyIcon: { fontSize: 28 },
    emptyText: {
        fontSize: 13,
        color: '#9ca3af',
    },

    // Card
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f0f0f5',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    taskRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f3f4f6',
    },

    // Checkbox
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxDone: {
        borderColor: '#10b981',
        backgroundColor: '#10b981',
    },
    checkmark: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '700',
    },

    // Task info
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 4,
    },

    taskHeaderTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF', // light gray
        letterSpacing: 0.5,
    },

    viewAll: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2563EB', // your primary blue
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        letterSpacing: -0.2,
    },
    taskTitleDone: {
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },
    taskNotes: {
        fontSize: 12,
        color: 'gray',
        marginTop: 2,
        fontWeight: '500',
    },

    // Badge
    badge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    badgeOverdue: {
        backgroundColor: '#fef2f2',
    },
    badgeTextOverdue: {
        color: '#ef4444',
    },
    badgeDone: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeDoneText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
    },
})