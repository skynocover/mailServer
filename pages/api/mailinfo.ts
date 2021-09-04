import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import dayjs from 'dayjs';
import crypto from 'crypto';

import { getSession } from 'next-auth/client';

import { prisma } from '../../database/db';
import { Resp, Tresp } from '../../resp/resp';
import credotlog from '../../utils/credotlog';
import { ISOStringFormat } from '../../utils/datetimeFormat';
import { Prisma } from '.prisma/client';
import { checkDuration } from '../../utils/messageList';
import { SendMail } from '../../utils/mailer';
import { ISOFormat } from '../../utils/dayFormat';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await getMail();

    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  async function getMail() {
    try {
      const { id } = req.query;

      if (typeof id !== 'string') {
        res.json(Resp.paramInputFormateError);
        return;
      }

      const info = await prisma.mailInfo.findFirst({
        where: { mailListId: id },
        select: {
          accepted: true,
          rejected: true,
          response: true,
          envelope: true,
          messageId: true,
        },
      });

      res.json({ ...Resp.success, info });
    } catch (error: any) {
      credotlog.log('Err', `post message fail, error: ${error.message}`);
      res.json({ ...Resp.commandExecFail, error: error.message });
    }
  }
};
