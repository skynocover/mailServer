import React from 'react';
import * as antd from 'antd';
import { useRouter } from 'next/router';

import { AppContext } from '../components/AppContext';
import { Notification } from '../components/Notification';
import { ColumnsType } from 'antd/lib/table';

interface MailInfoProps {
  id: string;
}

interface messageInfo {
  accepted: string[];
  rejected: string[];
  response: string;
  envelope: string;
  messageId: string;
}

export const MailInfo = ({ id }: MailInfoProps) => {
  const appCtx = React.useContext(AppContext);
  const [dataSource, setDataSource] = React.useState<messageInfo>();
  React.useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const data = await appCtx.fetch('get', `/api/mailinfo?id=${id}`);
    if (data) {
      setDataSource(data.info);
    }
  };

  return (
    <>
      <antd.Descriptions bordered column={1}>
        <antd.Descriptions.Item label="accepted">{dataSource?.accepted}</antd.Descriptions.Item>
        <antd.Descriptions.Item label="rejected">{dataSource?.rejected}</antd.Descriptions.Item>
        <antd.Descriptions.Item label="response">{dataSource?.response}</antd.Descriptions.Item>
        <antd.Descriptions.Item label="envelope">{dataSource?.envelope}</antd.Descriptions.Item>
        <antd.Descriptions.Item label="messageId">{dataSource?.messageId}</antd.Descriptions.Item>
      </antd.Descriptions>
    </>
  );
};
