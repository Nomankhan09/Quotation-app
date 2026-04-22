import { IFollowUpType } from '@/interface/followUp';
import * as Notifications from 'expo-notifications';

const getEmoji = (type: IFollowUpType) => {
    switch (type) {
        case 'Call': return '📞';
        case 'Email': return '📧';
        case 'Meeting': return '👥';
        case 'Task': return '📌';
    }
};

export const scheduleFollowUpNotification = async (
    item: any,
    date: Date
) => {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: `${getEmoji(item.type)} ${item.type} Follow-up`,
            body: item.title,
            data: {
                type: item.type,
                id: item.id,
            },
            sound: true,
        },  
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: 'default',
        },
    });

    return id;
};