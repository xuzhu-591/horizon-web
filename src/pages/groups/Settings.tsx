import React from 'react';
import { Card } from 'antd';
import Detail from '@/components/PageWithBreadcrumb'

export default (): React.ReactNode => {
  return (
    <Detail>
      <Card>
        <div>group Settings</div>
      </Card>
    </Detail>
  );
};