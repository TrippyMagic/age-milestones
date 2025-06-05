export const formatNice = (n: number) => {
    if (n >= 1_000_000_000) return `${(n/1e9).toFixed(n%1e9?1:0)} billion`;
    if (n >= 1_000_000)     return `${(n/1e6).toFixed(n%1e6?1:0)} million`;
    return n.toLocaleString();
};

export const formatBig = (n: number) => {
    return n >= 1e15 ? n.toExponential(2).replace("+", "") : n.toLocaleString();
};

export const formatSmall = (n: number) => {
    if (n === 0) return '0';
    const [mantissa, exp] = n.toExponential(16).split('e');
    const exponent = parseInt(exp, 10);
    if (exponent >= 0) return n.toFixed(2);
    const digits = mantissa.replace('.', '');
    const zeros = Math.abs(exponent) - 1;
    if (zeros < 4) return n.toFixed(zeros + 2)
    return '0,...' + zeros + ' zeros...' + digits.slice(0, 3)
};
