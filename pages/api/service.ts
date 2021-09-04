import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getSession } from 'next-auth/client';

import { prisma } from '../../database/db';
import { Resp, Tresp } from '../../resp/resp';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST':
      return await postSerivce();
    case 'PATCH':
      return await enableService();
    case 'PUT':
      return await changeSecret();

    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  async function changeSecret() {
    try {
      const session = await getSession({ req });
      if (!session) {
        res.json(Resp.backendCheckSessionFail);
        return;
      }

      const id = req.query.id;
      if (typeof id !== 'string') {
        res.json(Resp.paramInputFormateError);
        return;
      }

      const secret = crypto
        .createHash('sha256')
        .update(`${Math.random()}`)
        .digest('hex')
        .substring(0, 30);

      await prisma.service.update({ data: { secret }, where: { id } });
      res.json(Resp.success);
    } catch (error: any) {
      console.log(error.message);
      res.json({ error: error.message, ...Resp.sqlExecFail });
    }
  }

  async function postSerivce() {
    try {
      const session = await getSession({ req });
      if (!session) {
        res.json(Resp.backendCheckSessionFail);
        return;
      }

      const { code, name, note } = req.body;

      const secret = crypto
        .createHash('sha256')
        .update(`${Math.random()}`)
        .digest('hex')
        .substring(0, 30);

      await prisma.service.create({ data: { code, name, note, secret } });
      res.json(Resp.success);
    } catch (error: any) {
      console.log(error.message);
      res.json({ error: error.message, ...Resp.sqlExecFail });
    }
  }

  async function enableService() {
    try {
      const session = await getSession({ req });
      if (!session) {
        res.json(Resp.backendCheckSessionFail);
        return;
      }

      const id = req.query.id;
      if (typeof id !== 'string') {
        res.json(Resp.paramInputFormateError);
        return;
      }

      const enable = req.query.enable;
      switch (enable) {
        case 'true':
          await prisma.service.update({ data: { enable: true }, where: { id } });
          break;
        case 'false':
          await prisma.service.update({ data: { enable: false }, where: { id } });
          break;
        default:
          res.json(Resp.paramInputFormateError);
          return;
      }

      res.json(Resp.success);
    } catch (error: any) {
      console.log(error.message);
      res.json({ error: error.message, ...Resp.sqlExecFail });
    }
  }
};
