export const formatAmount = (n: number) => {

    const format = (
        value: number,
        suffix: string
    ) => {

        const formatted = value % 1 === 0 ? value.toString()
            : value.toFixed(2).replace(/\.?0+$/, '');

        return `₹${formatted}${suffix}`;
    };

    if (n >= 1_00_00_000) {
        return format(n / 1_00_00_000, 'Cr');
    }

    if (n >= 1_00_000) {
        return format(n / 1_00_000, 'L');
    }

    if (n >= 1_000) {
        return format(n / 1_000, 'K');
    }

    return `₹${n}`;
};