import dayjs from 'dayjs';
import { Prisma } from '.prisma/client';

import { ISOStringFormat } from './datetimeFormat';

export const checkDuration = (
  id: string,
  durationStart: any,
  durationEnd: any,
): Prisma.MessageListWhereInput | null => {
  if (typeof durationStart !== 'string' || typeof durationEnd !== 'string') {
    return null;
  }
  if (!ISOStringFormat(durationStart) || !ISOStringFormat(durationEnd)) {
    return null;
  }

  let where: Prisma.MessageListWhereInput = {
    serviceId: id,
    AND: [
      {
        createdAt: {
          gte: dayjs(durationStart).set('hour', 0).set('m', 0).set('s', 0).toDate(),
        },
      },
      {
        createdAt: {
          lte: dayjs(durationEnd).set('hour', 23).set('m', 59).set('s', 59).toDate(),
        },
      },
    ],
  };
  return where;
};
