export const getRoman = (num: number) => {
    const romans = [
        "i", "ii", "iii", "iv", "v",
        "vi", "vii", "viii", "ix", "x"
    ];
    return romans[num - 1] || num;
};