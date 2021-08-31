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

const querystring = require('querystring');

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await getMessage();

    case 'POST':
      return await postMessage();
    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  async function getMessage() {
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

      const messagesList = await prisma.messageList.findMany({
        where,
        skip: offset ? +offset : undefined,
        take: limit ? +limit : undefined,
        orderBy: { id: 'desc' },
      });

      const count = await prisma.messageList.count({ where: { serviceId: s.id } });

      let messages: any[] = [];
      for (const message of messagesList) {
        messages.push({
          id: message.id,
          phone: message.phone,
          message: message.message,
          errorMessage: message.errorMessage,
          createdAt: dayjs(message.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
        });
      }

      res.json({ ...Resp.success, messages, count });
    } catch (error) {
      credotlog.log('Err', `post message fail, error: ${error.message}`);
      res.json({ ...Resp.commandExecFail, error: error.message });
    }
  }

  async function postMessage() {
    try {
      const { service, phone, message, checksum } = req.body;

      if (!(service && phone && message && checksum)) {
        res.json({ errorCode: 2, errorMessage: 'phone or message empty' });
        return;
      }

      if (
        typeof service !== 'string' ||
        typeof phone !== 'string' ||
        typeof message !== 'string' ||
        typeof checksum !== 'string'
      ) {
        res.json(Resp.paramInputFormateError);
        return;
      }

      if (/0[0-9]{9}/.test(phone)) {
        res.json(Resp.paramInputFormateError);
        return;
      }

      const s = await prisma.service.findFirst({ where: { code: service, enable: true } });
      if (!s) {
        res.json(Resp.queryNotFound);
        return;
      }

      const hash = crypto
        .createHash('sha256')
        .update(`${service}${phone}${message}${s.secret}`)
        .digest('hex');

      if (hash !== checksum) {
        res.json(Resp.hashError);
        return;
      }

      const query = querystring.stringify({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
        dstaddr: phone,
        smbody: message,
      });

      const { data } = await axios.post(`${process.env.SMSDOMAIN}/api/mtk/SmSend?${query}`);
      let temp = deresponse(data);
      console.log(`temp: ${JSON.stringify(temp)}`);

      switch (temp.statuscode) {
        case '1':
          res.json({ errorCode: 0 });

          prisma.messageList
            .create({ data: { service: { connect: { id: s.id } }, phone, message } })
            .catch((error) => {
              credotlog.log('Err', `create message list fail, error: ${error.message}`);
            });
          return;

        case '5':
        case '6':
        case '7':
        case '8':
          res.json({ ...Resp.sendMsgFail, error: `send sms error, statuscode:${temp.statuscode}` });

          prisma.messageList
            .create({
              data: {
                service: { connect: { id: s.id } },
                phone,
                message,
                errorMessage: `send sms error, statuscode:${temp.statuscode}`,
              },
            })
            .catch((error) => {
              credotlog.log('Err', `create message list fail, error: ${error.message}`);
            });
          return;

        default:
          prisma.messageList
            .create({
              data: {
                service: { connect: { id: s.id } },
                phone,
                message,
                errorMessage: `send sms error, response:${data}`,
              },
            })
            .catch((error) => {
              credotlog.log('Err', `create message list fail, error: ${error.message}`);
            });
          res.json({ ...Resp.sendMsgFail, error: `send sms error, response:${data}` });
          return;
      }
    } catch (error) {
      credotlog.log('Err', `post message fail, error: ${error.message}`);
      res.json({ ...Resp.commandExecFail, error: error.message });
    }
  }
};

export const deresponse = (input: string): Record<string, any> => {
  let arr = input.split('\r\n');
  let resp: Record<string, any> = {};
  for (const a of arr) {
    let temp = a.split('=');
    if (temp.length === 2) {
      resp[temp[0]] = temp[1];
    }
  }
  return resp;
};
