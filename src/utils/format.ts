export const formatNice = (n: number) => {
    if (n >= 1_000_000_000) return `${(n/1e9).toFixed(n%1e9?1:0)} billion`;
    if (n >= 1_000_000)     return `${(n/1e6).toFixed(n%1e6?1:0)} million`;
    return n.toLocaleString();
};

export const formatBig = (n: number) => {
    return n >= 1e12 ? n.toExponential(2).replace("+", "") : n.toLocaleString();
}