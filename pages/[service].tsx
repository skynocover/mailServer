import React from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { AppContext } from '../components/AppContext';
import * as antd from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { DangerButton } from '../components/DangerButton';
import { MainPage } from '../components/MainPage';
import { Notification } from '../components/Notification';
import { getSession } from 'next-auth/client';
import { prisma } from '../database/db';
import dayjs from 'dayjs';
import moment, { Moment } from 'moment';

import axios from 'axios';
// import querystring from 'querystring';
const querystring = require('querystring');

interface messageList {
  id: string;
  phone: string;
  errorMessage?: string;
  createdAt: string;
}

export default function Service({ error }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const appCtx = React.useContext(AppContext);
  const [dataSource, setDataSource] = React.useState<messageList[]>([]); //coulmns data

  const router = useRouter();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [total, setTotal] = React.useState<number>(0);
  const pageSize = 10;
  const [serviceName, setServiceName] = React.useState<string>('');
  const [timeRange, setTimeRange] = React.useState<[Moment, Moment]>([
    moment().subtract(1, 'month'),
    moment(),
  ]);

  const init = async () => {
    if (!timeRange[0].toISOString() || !timeRange[1].toISOString()) {
      Notification.add('error', '起始及結束時間都需要填入');
      return;
    }

    const query = querystring.stringify({
      service: router.query.service as string,
      offset: (currentPage - 1) * pageSize,
      limit: pageSize,
      durationStart: timeRange[0].toISOString(),
      durationEnd: timeRange[1].toISOString(),
    });

    const data = await appCtx.fetch('get', `/api/message?${query}`);
    if (data) {
      setDataSource(data.messages);
      setTotal(data.count);
    }
  };

  React.useEffect(() => {
    if (error) {
      Notification.add('error', error);
    } else if (appCtx.menus.length === 0) {
      router.push('/Home');
    } else {
      init();
      setServiceName(router.query.service as string);
    }
  }, [router.query.service]);

  const columns: ColumnsType<messageList> = [
    {
      title: '手機號碼',
      align: 'center',
      dataIndex: 'phone',
    },
    {
      title: '簡訊內容',
      align: 'center',
      dataIndex: 'message',
    },
    {
      title: '錯誤訊息',
      align: 'center',
      dataIndex: 'errorMessage',
    },
    {
      title: '發送時間',
      align: 'center',
      dataIndex: 'createdAt',
    },
  ];

  const selectTime = (_: any, dateStrings: [string, string]) => {
    setTimeRange([moment(dateStrings[0]), moment(dateStrings[1])]);
  };

  const content = (
    <>
      <div className="d-flex mb-2">
        <antd.DatePicker.RangePicker defaultValue={timeRange} onChange={selectTime} />
        <antd.Button type="primary" onClick={init}>
          區間搜尋
        </antd.Button>
        <div className="flex-fill" />
        <antd.Button
          type={'primary'}
          onClick={() => {
            const query = querystring.stringify({
              service: router.query.service as string,
              durationStart: moment(timeRange[0]).toISOString(),
              durationEnd: moment(timeRange[0]).toISOString(),
            });
            const link = `/api/download?${query}`;
            window.open(link, '_blank');
          }}
        >
          下載
        </antd.Button>
      </div>
      <antd.Table
        dataSource={dataSource}
        columns={columns}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page) => setCurrentPage(page),
        }}
      />
    </>
  );
  return <MainPage content={content} menuKey={router.query.service as string} />;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  try {
    const session = await getSession({ req });
    if (!session) {
      return {
        redirect: {
          permanent: false,
          destination: '/',
        },
        props: {},
      };
    }

    return { props: {} };
  } catch (error) {
    return { props: { error: error.message } };
  }
};
