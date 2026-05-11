export const formatAmount = (n: number) => {
    if (n >= 1_00_00_000) {
        return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
    }

    if (n >= 1_00_000) {
        return `₹${(n / 1_00_000).toFixed(1)}L`;
    }

    if (n >= 1_000) {
        return `₹${(n / 1_000).toFixed(1)}K`;
    }

    return `₹${n}`;
};