import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../database/db';
import { Resp, Tresp } from '../../resp/resp';
import axios from 'axios';

import { getSession } from 'next-auth/client';
import { deresponse } from './message';

const querystring = require('querystring');

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await getAmount();
    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  async function getAmount() {
    try {
      const session = await getSession({ req });
      if (!session) {
        res.json(Resp.backendCheckSessionFail);
        return;
      }

      const query = querystring.stringify({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
      });

      const { data } = await axios.get(`${process.env.SMSDOMAIN}/api/mtk/SmQuery?${query}`);

      let { Error, AccountPoint } = deresponse(data);

      res.json({ ...Resp.success, Error, AccountPoint });
    } catch (error) {
      console.log(error.message);
      res.json({ error: error.message, ...Resp.sqlExecFail });
    }
  }
};
