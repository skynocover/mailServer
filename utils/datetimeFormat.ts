import dayjs from 'dayjs';
export const ISOStringFormat = (datetime: string): boolean => {
  return dayjs(datetime).toISOString() === datetime;
};
