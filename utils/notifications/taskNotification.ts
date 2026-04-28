import * as Notifications from 'expo-notifications';
import { parseDate } from '../date_format';

export const scheduleTaskNotification = async (task: {
    id: string | number;
    title: string;
    due_date: string;
    priority?: string | null;
}) => {
    const due = parseDate(task.due_date);
    if (isNaN(due.getTime()) || due.getTime() <= Date.now()) return null;

    const priorityEmoji =
        task.priority === 'high' ? '🔴' :
            task.priority === 'medium' ? '🟡' : '🟢';

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: `${priorityEmoji} Task Due`,
            body: task.title,
            data: { taskId: task.id },
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: due,
            channelId: 'default',
        },
    });

    return id;
};

export const cancelTaskNotification = async (notificationId: string) => {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (_) { }
};