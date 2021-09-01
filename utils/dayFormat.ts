import dayjs from 'dayjs';

export const ISOFormat = (input: string): boolean => dayjs(input).toISOString() === input;
