import React from 'react';
import {Divider} from "antd";
import DynamicTagForm from '@/components/DynamicTagForm'

import {getClusterTags, updateClusterTags} from "@/services/clusters/clusters";
import Detail from '@/components/PageWithBreadcrumb'

export default (): React.ReactNode => {
  return (
    <Detail>
      <h1>{"标签管理"}</h1>
      <Divider/>
      <DynamicTagForm
        queryTags={getClusterTags}
        updateTags={updateClusterTags}
      />
    </Detail>
  );
};