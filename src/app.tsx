import type {MenuDataItem, Settings as LayoutSettings} from '@ant-design/pro-layout';
import {PageLoading} from '@ant-design/pro-layout';
import {Menu, notification} from 'antd';
import type {RequestConfig, RunTimeLayoutConfig} from 'umi';
import {history} from 'umi';
import RBAC from '@/rbac';
import RightContent from '@/components/RightContent';
import Footer from '@/components/Footer';
import {currentUser as queryCurrentUser} from './services/login/login';
import {
  AppstoreOutlined,
  BankOutlined,
  ContactsOutlined,
  SettingOutlined,
  SmileOutlined,
  FundOutlined,
  TagsOutlined
} from '@ant-design/icons/lib';
import Utils, {pathnameInStaticRoutes} from '@/utils';
import {queryResource} from '@/services/core';
import {stringify} from 'querystring';
import {routes} from '../config/routes';
import {ResourceType} from '@/const'
import {queryRoles, querySelfMember} from "@/services/members/members";

const loginPath = '/user/login';

const IconMap = {
  smile: <SmileOutlined/>,
  contacts: <ContactsOutlined/>,
  setting: <SettingOutlined/>,
  bank: <BankOutlined/>,
  appstore: <AppstoreOutlined/>,
  fundout: <FundOutlined/>,
  tags: <TagsOutlined />
};

const loopMenuItem = (menus: MenuDataItem[]): MenuDataItem[] =>
  menus.map(({icon, children, ...item}) => ({
    ...item,
    icon: icon && IconMap[icon as string],
    children: children && loopMenuItem(children),
  }));

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading/>,
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  roles?: API.Role[];
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  resource: API.Resource;
}> {
  const settings: Partial<LayoutSettings> = {};
  const resource: API.Resource = {fullName: '', fullPath: '', id: 0, name: '', type: 'group', parentID: 0};
  let currentUser: API.CurrentUser | undefined = {
    id: 0,
    name: "",
    isAdmin: false,
    role: RBAC.AnonymousRole,
  }
  let roles: API.Role[] = [];


  try {
    const {data: userData} = await queryCurrentUser();

    if (userData?.id && history.location.pathname.startsWith(loginPath)) {
      history.replace('/');
    }

    currentUser.id = userData.id
    currentUser.name = userData.name
    currentUser.isAdmin = userData.isAdmin

    const {data: rolesData} = await queryRoles()
    roles = rolesData


  } catch (e) {
    currentUser = undefined
  }

  // 资源类型的URL
  if (!pathnameInStaticRoutes()) {
    const path = Utils.getResourcePath();
    try {
      const {data: resourceData} = await queryResource(path);
      resource.id = resourceData.id;
      resource.name = resourceData.name;
      resource.type = resourceData.type;
      resource.fullName = resourceData.fullName;
      resource.fullPath = resourceData.fullPath;

      const {data: memberData} = await querySelfMember(resource.type, resource.id)
      if (memberData.total > 0) {
        currentUser!.role = memberData.items[0].role;
      } else {
        currentUser!.role = RBAC.AnonymousRole;
      }
      if (currentUser!.isAdmin) {
        currentUser!.role = RBAC.AdminRole
      }

      RBAC.RefreshPermissions(roles, currentUser!);

    } catch (e) {
      settings.menuRender = false;
    }
  }

  return {
    currentUser,
    roles,
    settings,
    resource,
  };
}

export const request: RequestConfig = {
  responseInterceptors: [
    (response) => {
      if (response.headers.get('X-OIDC-Redirect-To') && !history.location.pathname.startsWith(loginPath)) {
        history.push({
          pathname: loginPath,
          search: stringify({
            redirect: history.location.pathname + history.location.search,
          }),
        });
      }
      return response;
    },
  ],
  errorConfig: {
    adaptor: (resData) => {
      return {
        ...resData,
        success: !resData.errorCode,
      };
    },
  },
  errorHandler: (error: any) => {
    const {response, data} = error;
    if (!response) {
      notification.error({
        message: '网络异常',
        description: '您的网络发生异常，无法连接服务器',
      });
    }
    if (data.errorCode || data.errorMessage) {
      notification.error({
        message: data.errorCode,
        description: data.errorMessage,
      });
    } else {
      notification.error({
        message: response.status,
        description: response.statusText,
      });
    }
    throw error;
  },
};

// ProLayout 支持的api https://procomponents.ant.design/components/layout
// @ts-ignore
export const layout: RunTimeLayoutConfig = ({initialState}) => {
  return {
    headerContentRender: () => {
      return <Menu theme="dark" mode="horizontal" style={{marginLeft: '10px', color: '#989898'}} selectable={false}>
        <Menu.Item key="1">
          <a style={{fontWeight: 'bold'}} onClick={() => history.push("/dashboard/clusters")}>Clusters</a>
        </Menu.Item>
        <Menu.Item key="2">
          <a style={{fontWeight: 'bold'}} onClick={() => history.push("/dashboard/applications")}>Applications</a>
        </Menu.Item>
        <Menu.Item key="3">
          <a style={{fontWeight: 'bold'}} onClick={() => history.push("/dashboard/groups")}>Groups</a>
        </Menu.Item>
      </Menu>
    },
    rightContentRender: () => <RightContent/>,
    footerRender: () => <Footer/>,
    onPageChange: () => {
    },
    menuHeaderRender: () => {
      const {name: title, fullPath} = initialState?.resource || {};
      if (!title || !fullPath) {
        return false;
      }
      const firstLetter = title.substring(0, 1).toUpperCase();
      const titleContent = title.length <= 15 ? title : title.substr(0, 12) + '...'
      return (
        <span
          style={{alignItems: 'center', lineHeight: '40px'}}
          onClick={() => {
            window.location.href = fullPath;
          }}
        >
          <span className={`avatar-40 identicon bg${Utils.getAvatarColorIndex(title)}`}>
            {firstLetter}
          </span>
          <span style={{alignItems: 'center', marginLeft: 60, color: 'black', fontSize: '16px'}}>
            {titleContent}
          </span>
        </span>
      );
    },
    menu: {
      // 每当 initialState?.currentUser?.userid 发生修改时重新执行 request
      params: {
        resource: initialState?.resource
      },
      request: async (params, defaultMenuData) => {
        if (pathnameInStaticRoutes() || !initialState) {
          return defaultMenuData;
        }

        // 根据ResourceType决定菜单
        const {type, fullPath} = initialState.resource;
        switch (type) {
          case ResourceType.GROUP:
            return loopMenuItem(formatGroupMenu(fullPath));
          case ResourceType.APPLICATION:
            return loopMenuItem(formatApplicationMenu(fullPath));
          case ResourceType.CLUSTER:
            return loopMenuItem(formatClusterMenu(fullPath));
          default:
            return defaultMenuData;
        }
      },
    },
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    ...initialState?.settings,
    logo: <div/>
  };
};

function formatGroupMenu(fullPath: string) {
  return [
    ...routes,
    {
      name: 'Group overview',
      icon: 'bank',
      path: `${fullPath}`,
    },
    {
      path: `/groups${fullPath}/-/members`,
      name: 'Members',
      icon: 'contacts',
    },
    {
      path: `/groups${fullPath}/-/settings`,
      name: 'Settings',
      icon: 'setting',
      children: [
        {
          path: `/groups${fullPath}/-/edit`,
          name: 'General',
        },
      ],
    },
    {
      path: `/groups${fullPath}/-/newsubgroup`,
      menuRender: false,
    },
    {
      path: `/groups${fullPath}/-/newapplication`,
      menuRender: false,
    },
  ];
}

function formatApplicationMenu(fullPath: string) {
  return [
    ...routes,
    {
      name: 'Application overview',
      icon: 'bank',
      path: `${fullPath}`,
    },
    {
      path: `/applications${fullPath}/-/clusters`,
      name: 'Clusters',
      icon: 'appstore',
    },
    {
      path: `/applications${fullPath}/-/members`,
      name: 'Members',
      icon: 'contacts',
    },
    {
      path: `/applications${fullPath}/-/edit`,
      menuRender: false,
    },
    {
      path: `/applications${fullPath}/-/clusters/new`,
      menuRender: false,
    },
  ];
}

function formatClusterMenu(fullPath: string) {
  return [
    ...routes,
    {
      name: 'Cluster overview',
      icon: 'bank',
      path: `${fullPath}`,
    },
    {
      path: `/clusters${fullPath}/-/pods`,
      name: 'Pods',
      icon: 'appstore',
    },
    {
      path: `/clusters${fullPath}/-/edit`,
      menuRender: false,
    },
    {
      path: `/clusters${fullPath}/-/pipelines`,
      name: 'Pipelines',
      icon: 'tags',
    },
    {
      path: `/clusters${fullPath}/-/pipelines/new`,
      parentKeys: [`/clusters${fullPath}/-/pipelines`],
    },
    {
      path: `/clusters${fullPath}/-/pipelines/:id`,
      parentKeys: [`/clusters${fullPath}/-/pipelines`],
    },
    {
      path: `/clusters${fullPath}/-/monitoring`,
      name: 'Monitoring',
      icon: 'fundout'
    },
    {
      path: `/clusters${fullPath}/-/members`,
      name: 'Members',
      icon: 'contacts',
    },
    {
      path: `/clusters${fullPath}/-/webconsole`,
    },
  ];
}