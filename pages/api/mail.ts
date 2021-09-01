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

const querystring = require('querystring');

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await getMail();

    case 'POST':
      return await postMail();
    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  async function getMail() {
    try {
      const { offset, limit, service, durationStart, durationEnd, checksum } = req.query;

      if (!service) {
        res.json(Resp.paramInputEmpty);
        return;
      }
      if (typeof service !== 'string') {
        res.json(Resp.paramInputFormateError);
        return;
      }

      if (offset) {
        if (isNaN(+offset)) {
          res.json(Resp.paramInputFormateError);
          return;
        }
      }
      if (limit) {
        if (isNaN(+limit)) {
          res.json(Resp.paramInputFormateError);
          return;
        }
        if (+limit > 100) {
          res.json(Resp.paramInputFormateError);
          return;
        }
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

      if (checksum) {
        const hash = crypto
          .createHash('sha256')
          .update(`${service}${durationStart}${durationEnd}${s.secret}`)
          .digest('hex');

        if (hash !== checksum) {
          res.json(Resp.hashError);
          return;
        }
      } else {
        const session = await getSession({ req });
        if (!session) {
          res.json(Resp.backendCheckSessionFail);
          return;
        }
      }

      const mailList = await prisma.mailList.findMany({
        where,
        skip: offset ? +offset : undefined,
        take: limit ? +limit : undefined,
        orderBy: { id: 'desc' },
      });
      const count = await prisma.mailList.count({ where: { serviceId: s.id } });

      const messages = mailList.map((mail) => {
        return {
          id: mail.id,
          target: mail.target,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
          errorMessage: mail.errorMessage,
          createdAt: dayjs(mail.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
        };
      });

      res.json({ ...Resp.success, messages, count });
    } catch (error) {
      credotlog.log('Err', `post message fail, error: ${error.message}`);
      res.json({ ...Resp.commandExecFail, error: error.message });
    }
  }

  async function postMail() {
    try {
      const { service, target, subject, text, html, checksum, datetime } = req.body;

      if (!(service && target && subject && checksum && datetime)) {
        res.json(Resp.paramInputFormateError);
        return;
      }

      if (
        typeof service !== 'string' ||
        typeof subject !== 'string' ||
        typeof checksum !== 'string' ||
        !ISOFormat(datetime)
      ) {
        res.json(Resp.paramInputFormateError);
        return;
      }

      if (!Array.isArray(target)) {
        res.json(Resp.paramInputFormateError);
        return;
      }

      if (text && typeof text !== 'string') {
        res.json(Resp.paramInputFormateError);
        return;
      }
      if (html && typeof html !== 'string') {
        res.json(Resp.paramInputFormateError);
        return;
      }

      if (!XOR(text, html)) {
        res.json(Resp.paramInputFormateError);
        return;
      }

      if (dayjs().subtract(3000000, 'minute').isAfter(dayjs(datetime))) {
        res.json(Resp.datetimeExpire);
        return;
      }

      for (const to of target) {
        if (!/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/.test(to)) {
          res.json({ ...Resp.paramInputFormateError, error: `${to} is not a valid e-mail` });
          return;
        }
      }

      const s = await prisma.service.findFirst({ where: { code: service, enable: true } });
      if (!s) {
        res.json(Resp.queryNotFound);
        return;
      }

      const hash = crypto
        .createHash('sha256')
        .update(`${service}${subject}${datetime}${s.secret}`)
        .digest('hex');

      if (hash !== checksum) {
        res.json(Resp.hashError);
        return;
      }

      //發送email
      const info = await SendMail({ to: target, subject, text, html });

      // 成功後紀錄DB
      const record = await prisma.mailList.create({
        data: {
          service: { connect: { id: s.id } },
          subject,
          target,
          text,
          html,
        },
      });

      // 紀錄發送訊息
      await prisma.mailInfo.create({
        data: {
          mail: { connect: { id: record.id } },
          accepted: info.accepted.map((item) => `${item}`),
          rejected: info.rejected.map((item) => `${item}`),
          response: info.response,
          envelope: JSON.stringify(info.envelope),
          messageId: info.messageId,
        },
      });

      res.json(Resp.success);
    } catch (error) {
      credotlog.log('Err', `post message fail, error: ${error.message}`);
      res.json({ ...Resp.commandExecFail, error: error.message });
    }
  }
};

const XOR = (a: any, b: any) => (a || b) && !(a && b);
