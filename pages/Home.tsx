import React from 'react';
import * as antd from 'antd';

import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { MainPage } from '../components/MainPage';
import { useRouter } from 'next/router';
import { ColumnsType } from 'antd/lib/table';
import { getSession } from 'next-auth/client';

import { Notification } from '../components/Notification';
import { prisma } from '../database/db';
import { AppContext } from '../components/AppContext';
import { DangerButton } from '../components/DangerButton';
import { AddService } from '../modals/AddService';

const Home = ({ services, error }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const appCtx = React.useContext(AppContext);
  const [dataSource, setDataSource] = React.useState<Service[]>([]);

  const router = useRouter();

  const init = async () => {};

  React.useEffect(() => {
    if (error) {
      console.log(error);
      Notification.add('error', error);
    } else {
      setDataSource(services);
      const temp = [{ key: 'Home', title: 'Home' }].concat(
        services.map((service: Service) => {
          return {
            key: service.code,
            title: service.code,
          };
        }),
      );
      appCtx.setMenus(temp);
      init();
    }
  }, [services, error]);

  interface Service {
    id: string;
    code: string;
    name: string;
    enable: boolean;
    note?: string;
  }

  const enable = async (id: string, enable: boolean) => {
    antd.Modal.confirm({
      title: '確認',
      icon: <i />,
      content: enable ? '啟用服務' : '停用服務',
      okText: '確認',
      cancelText: '取消',
      onOk: async () => {
        const data = await appCtx.fetch('patch', `/api/service?id=${id}&enable=${enable}`);
        if (data) {
          Notification.add('success', enable ? '啟用服務 Success' : '停用服務 Success');
        }
        router.push('/Home');
      },
    });
  };

  const refreshSecret = async (id: string) => {
    const data = await appCtx.fetch('put', `/api/service?id=${id}`);
    if (data) {
      router.push('/Home');
      Notification.add('success', '重新產生Secret Success');
    }
  };

  const columns: ColumnsType<Service> = [
    {
      title: '服務代號',
      align: 'center',
      dataIndex: 'code',
    },
    {
      title: '服務名稱',
      align: 'center',
      dataIndex: 'name',
    },
    {
      title: '備註',
      align: 'center',
      dataIndex: 'note',
    },
    {
      title: 'Secret',
      align: 'center',
      render: (item) => (
        <antd.Typography.Paragraph copyable>{item.secret}</antd.Typography.Paragraph>
      ),
    },
    {
      title: '重新產生Secret',
      align: 'center',
      render: (item) => (
        <DangerButton
          title="Refresh"
          message="重新產生Secret?"
          onClick={() => refreshSecret(item.id)}
        />
      ),
    },
    {
      title: '啟用服務',
      align: 'center',
      render: (item) => (
        <antd.Switch checked={item.enable} onChange={() => enable(item.id, !item.enable)} />
      ),
    },
  ];

  const content = (
    <>
      <div className="d-flex justify-content-end my-2">
        <antd.Button
          type="primary"
          onClick={() => {
            appCtx.setModal(<AddService />);
          }}
        >
          新增服務
        </antd.Button>
      </div>
      <antd.Table dataSource={dataSource} columns={columns} pagination={false} />
    </>
  );

  return <MainPage content={content} menuKey="Home" />;
};

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

    const services = await prisma.service.findMany({
      select: { id: true, code: true, name: true, note: true, enable: true, secret: true },
    });

    return { props: { services } };
  } catch (error: any) {
    console.log(`get home page fail, err: ${error.message}`);
    return { props: { error: error.message } };
  }
};

export default Home;
