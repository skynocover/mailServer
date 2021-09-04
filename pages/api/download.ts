import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import crypto from 'crypto';
import xlsx from 'xlsx';
import dayjs from 'dayjs';

import { Prisma } from '.prisma/client';
import { getSession } from 'next-auth/client';

import { prisma } from '../../database/db';
import { Resp, Tresp } from '../../resp/resp';
import credotlog from '../../utils/credotlog';
import { messageXlsx } from '../../utils/sheetGenerate';
import { ISOStringFormat } from '../../utils/datetimeFormat';
import { checkDuration } from '../../utils/messageList';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await download();

    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  async function download() {
    try {
      const session = await getSession({ req });
      if (!session) {
        res.json(Resp.backendCheckSessionFail);
        return;
      }

      const { service, durationStart, durationEnd } = req.query;
      if (!service) {
        res.json(Resp.paramInputEmpty);
        return;
      }
      if (typeof service !== 'string') {
        res.json(Resp.paramInputFormateError);
        return;
      }

      const s = await prisma.service.findFirst({ where: { code: service } });
      if (!s) {
        res.json(Resp.queryNotFound);
        return;
      }

      const where = checkDuration(s.id, durationStart, durationEnd);
      if (!where) {
        res.json(Resp.paramInputFormateError);
        return;
      }

      const maillist = await prisma.mailList.findMany({ where });
      const messages = maillist.map((message) => {
        return [
          message.id,
          message.text,
          message.errorMessage || '',
          dayjs(message.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
        ];
      });

      const sheetBook = await messageXlsx(messages);
      const buff = xlsx.write(sheetBook, { bookType: 'xlsx', type: 'buffer' });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment;filename=${encodeURIComponent(`${s.name}簡訊結算表.xlsx`)}`,
      );

      res.send(buff);
    } catch (error: any) {
      credotlog.log('Err', `post message fail, error: ${error.message}`);
      res.json({ ...Resp.commandExecFail, error: error.message });
    }
  }
};
