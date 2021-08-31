import React from 'react';
import * as antd from 'antd';
import { useRouter } from 'next/router';

import { AppContext } from '../components/AppContext';
import { Notification } from '../components/Notification';

export const AddService = () => {
  const appCtx = React.useContext(AppContext);
  const router = useRouter();
  React.useEffect(() => {}, []);

  const onFinish = async (values: any) => {
    appCtx.setModal(null);

    const data = await appCtx.fetch('post', `/api/service`, {
      code: values.code,
      name: values.name,
      note: values.note,
    });

    if (data) {
      router.push('/Home');
      Notification.add('success', 'Success Add');
    }
  };

  return (
    <antd.Form onFinish={onFinish}>
      <h5 className="font-weight-bold mb-4">Add Service</h5>
      <antd.Form.Item
        name="code"
        label="Service代號"
        rules={[{ required: true, message: 'Input Service Code' }]}
      >
        <antd.Input
          prefix={<i className="fa fa-desktop" />}
          placeholder="Please Input Service Code"
        />
      </antd.Form.Item>
      <antd.Form.Item
        name="name"
        label="Service名稱"
        rules={[{ required: true, message: 'Input Service Name' }]}
      >
        <antd.Input
          prefix={<i className="fa fa-desktop" />}
          placeholder="Please Input Service Name"
        />
      </antd.Form.Item>
      <antd.Form.Item name="note" label="Service Note">
        <antd.Input
          prefix={<i className="fa fa-desktop" />}
          placeholder="Please Input Service Note"
        />
      </antd.Form.Item>

      <antd.Form.Item className="text-center">
        <antd.Button type="primary" htmlType="submit">
          新增
        </antd.Button>
      </antd.Form.Item>
    </antd.Form>
  );
};
