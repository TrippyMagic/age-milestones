import { describe, it, expect } from 'vitest';
import { formatNice, formatBig, formatSmall } from '../utils/format.ts';

describe('formatNice', () => {
  it('handles numbers less than a million', () => {
    expect(formatNice(999)).toBe('999');
    expect(formatNice(1000)).toBe('1,000');
  });

  it('formats numbers in millions', () => {
    expect(formatNice(1_000_000)).toBe('1 million');
    expect(formatNice(1_500_000)).toBe('1.5 million');
  });

  it('formats numbers in billions', () => {
    expect(formatNice(1_000_000_000)).toBe('1 billion');
    expect(formatNice(1_234_000_000)).toBe('1.2 billion');
  });
});

describe('formatBig', () => {
  it('uses locale string for numbers below 1e12', () => {
    expect(formatBig(1234)).toBe('1,234');
  });

  it('uses exponential notation for large numbers', () => {
    expect(formatBig(1.23e15)).toBe('1.23e15');
  });
});

describe('formatSmall', () => {
  it('shows leading zeros for tiny numbers', () => {
    expect(formatSmall(1e-6)).toBe('0.000001');
  });

  it('handles zero', () => {
    expect(formatSmall(0)).toBe('0');
  });
});
