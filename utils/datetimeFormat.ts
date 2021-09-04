import dayjs from 'dayjs';
export const ISOStringFormat = (datetime: string): boolean =>
  dayjs(datetime).toISOString() === datetime;
