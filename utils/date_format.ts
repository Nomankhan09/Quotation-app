export const formatDate = (date: Date) => {
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

export const formatOnlyDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const getDaysAgo = (date: Date): string => {
    const today = new Date();

    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diff = Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    if (diff > 0) return `${diff} days ago`;

    const abs = Math.abs(diff);
    if (abs === 1) return 'Tomorrow';
    return `In ${abs} days`;
};

export const parseDate = (str: string) => {
    const [datePart, timePart, meridian] = str.split(' ');

    const [month, day, year] = datePart.split('/');
    let [hours, minutes] = timePart.split(':');

    let h = parseInt(hours, 10);

    if (meridian === 'PM' && h !== 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        h,
        Number(minutes)
    );
};

// for 2 days ago / 2 month ago
export const timeAgo = (
    dateString?: string
) => {

    if (!dateString) return '';

    const now = new Date();

    const past =
        new Date(dateString);

    const seconds =
        Math.floor(
            (now.getTime() - past.getTime()) / 1000
        );

    if (seconds < 60) {
        return `${seconds}s ago`;
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days =
        Math.floor(hours / 24);

    if (days < 30) {
        return `${days}d ago`;
    }

    const months =
        Math.floor(days / 30);

    if (months < 12) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    const years =
        Math.floor(months / 12);

    return `${years} year${years > 1 ? 's' : ''} ago`;
}

export const formatToMySQL = (dateStr: string) => {
    if (!dateStr) return null;

    const [datePart, timePart, modifier] = dateStr.split(' ');
    const [month, day, year] = datePart.split('/');
    let [hours, minutes] = timePart.split(':');

    let h = parseInt(hours);

    if (modifier === 'PM' && h !== 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${String(h).padStart(2, '0')}:${minutes}:00`;
}