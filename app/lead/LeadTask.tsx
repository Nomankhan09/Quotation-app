import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { editTask, ITask, loadTasksByLead } from '@/store/slices/taskSlice';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import { ILead } from '@/interface/leads';

// ─── Props ────────────────────────────────────────────────────────────────────
interface LeadTasksProps {
    lead: { id: number; name?: string; company?: string;[key: string]: any };
}

// ─── Component ────────────────────────────────────────────────────────────────
const LeadTasks: React.FC<LeadTasksProps> = ({ lead }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { tasks, loading } = useSelector((state: RootState) => state.tasks);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<ITask | null>(null);

    useEffect(() => {
        if (!lead?.id) return;

        dispatch(loadTasksByLead(lead.id));
    }, []); // ❗ only once

    const openAdd = () => {
        setEditingTask(null);
        setModalVisible(true);
    };

    const openEdit = (task: ITask) => {
        setEditingTask(task);
        setModalVisible(true);
    };

    const toggleComplete = (task: ITask) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        dispatch(editTask({
            id: String(task.id),
            data: {
                contact_id: lead.id,
                title: task.title,
                status: newStatus,
                due_date: task.due_date,
                priority: Number(task.priority),
                notes: task.notes,
            },
        }));
    };

    const onClose = () => {
        setModalVisible(false);
    }

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Related tasks</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.75}>
                    <Text style={styles.addBtnText}>+ Add Task</Text>
                </TouchableOpacity>
            </View>

            {/* ── List ── */}
            <TaskList
                loading={loading as boolean}
                tasks={tasks}
                openEdit={openEdit}
                toggleComplete={toggleComplete}
            />

            {/* Add Edit Modal */}
            <TaskForm
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                onClose={onClose}
                lead={lead as ILead}
                editingTask={editingTask}
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    addBtn: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
    },
    addBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
});

export default LeadTasks;