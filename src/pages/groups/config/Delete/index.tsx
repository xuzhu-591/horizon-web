import {Button, Card, Modal} from 'antd';
import {deleteGroup} from "@/services/groups/groups";
import {useModel} from "@@/plugin-model/useModel";
import {history} from "@@/core/history";
import {ExclamationCircleOutlined} from "@ant-design/icons";
import RBAC from "@/rbac";
import {useIntl} from "@@/plugin-locale/localeExports";

export default () => {
  const {successAlert} = useModel('alert');
  const intl = useIntl();
  const {initialState, refresh} = useModel('@@initialState');
  const groupID = initialState!.resource.id

  const onDelete = () => {
    deleteGroup({id: groupID}).then(() => {
      successAlert('Delete Group Success')
      history.push('/');
      refresh()
    });
  }

  const deleteGroupStyle = () => {
    if (RBAC.Permissions.deleteGroup.allowed) {
      return {
        backgroundColor: '#dd2b0e',
         color: 'white'
      }
    } else {
      return {}
    }
  }

  return (
    <Card title="Delete Group" className={'card'}>
      <p>
        {intl.formatMessage({id: "pages.group.delete.desc"})}
      </p>
          <Button
            style={deleteGroupStyle()}
            disabled={!RBAC.Permissions.deleteGroup.allowed}
            onClick={() => {
            Modal.confirm({
              title:  'Delete Group',
              icon: <ExclamationCircleOutlined/>,
              okText: <div>{intl.formatMessage({id: "pages.confirm.ok"})}</div>,
              cancelText: <div>{intl.formatMessage({id: "pages.confirm.cancel"})}</div>,
              onOk: onDelete,
            });
          }}>删除分组</Button>
    </Card>
  );
};