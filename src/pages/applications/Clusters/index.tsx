import {Button, Input, Table, Tabs} from "antd";
import PageWithBreadcrumb from '@/components/PageWithBreadcrumb'
import {useState} from "react";
import {history} from "@@/core/history";
import {stringify} from "querystring";
import {useIntl} from "@@/plugin-locale/localeExports";
import {useModel} from "@@/plugin-model/useModel";
import styles from './index.less'
import {useRequest} from "@@/plugin-request/request";
import {queryEnvironments} from "@/services/environments/environments";
import {queryClusters} from "@/services/clusters/clusters";
import RBAC from '@/rbac'
import Utils from '@/utils'
import NoData from "@/components/NoData";
import withTrim from "@/components/WithTrim";

const {TabPane} = Tabs;
const Search = withTrim(Input.Search);

export default (props: any) => {
  const {query: q} = props.location;
  const {environment = ''} = q

  const intl = useIntl();
  const {initialState} = useModel('@@initialState');
  const {id, name: application, fullPath} = initialState!.resource;
  const newCluster = `/applications${fullPath}/-/clusters/new`;

  const pageSize = 10;

  const columns = [
    {
      title: '集群名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => {
        return <a href={`/clusters${fullPath}/${text}/-/pods`}>
          {text}
        </a>
      }
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
    },
    {
      title: '区域',
      dataIndex: 'regionDisplayName',
      key: 'region',
    },
    {
      title: '模版',
      dataIndex: 'template',
      key: 'template',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedTime',
      key: 'updatedTime',
    },
  ]

  const [filter, setFilter] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [query, setQuery] = useState(0);
  const [env2DisplayName, setEnv2DisplayName] = useState<Map<string, string>>();

  const {data: envs} = useRequest(queryEnvironments, {
    onSuccess: () => {
      const e = new Map<string, string>();
      envs!.forEach(item => e.set(item.name, item.displayName))
      setEnv2DisplayName(e)
    }
  });
  const {data: clusters} = useRequest(() => {
    return queryClusters(id, environment ? {
        filter, pageNumber, pageSize, environment
      } : {
        filter, pageNumber, pageSize,
      }
    )
  }, {
    refreshDeps: [query, environment, pageNumber],
  });

  const onChange = (e: any) => {
    const {value} = e.target;
    setFilter(value);
  };

  const onPressEnter = () => {
    setQuery(prev => prev + 1)
  }

  const onSearch = () => {
    setQuery(prev => prev + 1)
  }
  const queryInput = (
    // @ts-ignore
    <div><Search className={styles.antInputGroupWrapper} placeholder="Search" onPressEnter={onPressEnter} value={filter}
                 onSearch={onSearch}
                 onChange={onChange}
    />
      {
        <Button
          type="primary"
          disabled={!RBAC.Permissions.createCluster.allowedEnv(environment)}
          className={styles.createClusterBtn}
          onClick={() => {
            history.push({
              pathname: newCluster,
              search: stringify({
                application,
                environment
              }),
            });
          }}
        >
          {intl.formatMessage({id: 'pages.groups.New cluster'})}
        </Button>
      }
    </div>
  )

  const data = clusters?.items.map(item => {
    const {name, scope, template, updatedAt} = item
    return {
      key: name,
      name: name,
      environment: env2DisplayName?.get(scope.environment),
      regionDisplayName: scope.regionDisplayName,
      template: `${template.name}-${template.release}`,
      updatedTime: Utils.timeToLocal(updatedAt)
    }
  })

  const locale = {
    emptyText: <NoData title={'集群为特定应用的部署实例'} desc={
      '你可以将你的cluster集群部署到各种不同的环境（测试线上）\n' +
      '和区域（杭州、新加坡等），集群继承应用的各项配置，当然也可以对大多数配置进行修改。\n' +
      '为不同人员赋予cluster的不同权限\n' +
      '比如只读guest只能查看、项目owner、maintainer可以进行发布的修改'}
    />
  }

  const table = <Table
    columns={columns}
    dataSource={data}
    locale={locale}
    pagination={{
      position: ['bottomCenter'],
      current: pageNumber,
      hideOnSinglePage: true,
      pageSize,
      total: clusters?.total,
      onChange: (page) => setPageNumber(page),
    }}
  />

  const tabOnChange = (key: string) => {
    history.replace({
      pathname: `/applications${fullPath}/-/clusters`,
      query: key ? {
        environment: key
      } : {}
    })
  }

  return (
    <PageWithBreadcrumb>
      <Tabs activeKey={environment} size={'large'} tabBarExtraContent={queryInput} onChange={tabOnChange}
            animated={false}>
        <TabPane tab={'所有'} key={''}>
          {table}
        </TabPane>
        {
          envs?.map(item => {
            const {name, displayName} = item
            return <TabPane tab={displayName} key={name}>
              {table}
            </TabPane>
          })
        }
      </Tabs>
    </PageWithBreadcrumb>
  )
}