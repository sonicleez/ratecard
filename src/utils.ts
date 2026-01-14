export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};
