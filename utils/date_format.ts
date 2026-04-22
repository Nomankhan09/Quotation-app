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