import { history } from 'umi';
import { getLocale } from '@@/plugin-locale/localeExports';
import moment, { isMoment } from 'moment';
import { routes } from '../config/routes';
import { IndexURL, RedirectURL } from './const';

const getResourcePath = () => {
  const { pathname } = history.location;
  if (pathname.startsWith('/templates')) {
    const pathArr = /templates\/(.*?)\/-\/releases\/(.*?)(?:\/edit)?\/?$/.exec(pathname);
    if (pathArr != null) {
      return `/${pathArr[1]}/${pathArr[2]}`;
    }
  }
  const filteredPath = pathname
    .split('/')
    .filter(
      (item) => item !== ''
        && item !== 'groups'
        && item !== 'applications'
        && item !== 'clusters'
        && item !== 'templates',
    );
  let path = '';
  for (let i = 0; i < filteredPath.length; i += 1) {
    const item = filteredPath[i];
    if (item === '-') {
      break;
    }
    path += `/${item}`;
  }
  return path;
};

const getBreadcrumbs = (fullName: string) => {
  const result = [];
  const { pathname } = history.location;
  if (pathname.startsWith('/admin/') || pathname.startsWith('/profile')) {
    const filteredPath = pathname.split('/').filter((item) => item !== '');
    let currentLink = '';
    for (let i = 0; i < filteredPath.length; i += 1) {
      const item = filteredPath[i];
      currentLink += `/${item}`;
      result.push({
        path: currentLink,
        breadcrumbName: item,
      });
    }
    return result;
  }

  if (pathname.startsWith('/templates')) {
    if (pathname === '/templates/new') {
      return result;
    }
    const releasePattern = /\/templates\/.*\/-\/releases\/(.*?)(\/edit)?\/?$/;
    const isRelease = releasePattern.test(pathname);
    const path = pathname.replace(/\/-.+$/, '');
    const filteredPath = path.split('/').filter((item) => item !== '' && item !== 'templates');
    let currentLink = '';
    filteredPath.slice(0, filteredPath.length - 1).forEach((x) => {
      currentLink += `/${x}`;
      result.push({
        path: currentLink,
        breadcrumbName: x,
      });
    });
    const item = filteredPath[filteredPath.length - 1];
    currentLink += `/${item}`;
    result.push({
      path: `/templates${currentLink}/-/detail`,
      breadcrumbName: item,
    });
    const res = releasePattern.exec(pathname);
    if (isRelease) {
      currentLink += `/-/releases/${res[1]}`;
      result.push({
        path: `/templates${currentLink}`,
        breadcrumbName: res[1],
      });
      if (pathname.endsWith('/edit')) {
        currentLink += '/edit';
        result.push({
          path: `/templates${currentLink}`,
          breadcrumbName: 'edit',
        });
      }
    }
    return result;
  }

  const filteredFullName = fullName.split('/').filter((item) => item !== '');
  const filteredPath = pathname
    .split('/')
    .filter(
      (item) => item !== '' && item !== 'groups' && item !== 'applications' && item !== 'clusters',
    );
  let currentLink = '';
  for (let i = 0; i < filteredPath.length; i += 1) {
    const item = filteredPath[i];
    if (item === '-') {
      break;
    }
    currentLink += `/${item}`;
    result.push({
      path: currentLink,
      breadcrumbName: filteredFullName[i],
    });
  }

  const p = pathname.split('/').filter((item) => item !== '');
  const idx = p.indexOf('-');
  const funcURL = idx > -1;
  if (funcURL) {
    currentLink += '/-';
    for (let i = idx + 1; i < p.length; i += 1) {
      const item = p[i];
      currentLink += `/${item}`;
      result.push({
        path: `/${p[0]}${currentLink}`,
        breadcrumbName: item,
        subResource: true,
      });
    }
  }

  return result;
};

const getAvatarColorIndex = (title: string) => {
  let count = 0;
  for (let i = 0; i < title.length; i += 1) {
    const t = title[i];
    const n = t.charCodeAt(0);
    count += n;
  }

  return (count % 7) + 1;
};

function timeFromNow(oldTime: string) {
  return moment(oldTime).local().locale(getLocale()).fromNow();
}

function timeSecondsDuration(startedAt: string, finishedAt: string) {
  return moment(finishedAt).diff(moment(startedAt), 'seconds', true);
}

function timeToLocal(time: string) {
  return moment(time).local().format('YYYY-MM-DD HH:mm:ss').toString();
}

export const mergeDefaultValue = (value: any, defaultValue: { [x: string]: any }) => {
  const result = {
    ...value,
  };
  Object.keys(defaultValue || {}).forEach((e) => {
    const isNull = defaultValue[e] != null && result[e] == null;
    if (Array.isArray(defaultValue[e])) {
      if (isNull) {
        result[e] = Array.from(defaultValue[e]);
      }
      return;
    }
    if (isMoment(defaultValue[e])) {
      if (isNull) {
        result[e] = moment(defaultValue[e]);
      }
      return;
    }
    if (typeof defaultValue[e] === 'object') {
      result[e] = mergeDefaultValue(result[e], defaultValue[e]);
      return;
    }
    if (isNull) {
      result[e] = defaultValue[e];
    }
  });
  return result;
};

// @ts-ignore
const formatValue = (data, type) => {
  if (data === undefined) {
    return data;
  }
  if (type instanceof Function) {
    return type(data);
  }
  if (type === 'array') {
    if (data instanceof Array) {
      return data;
    }
    if (typeof data === 'string') {
      return data.split(',');
    }
    if (typeof data === 'number') {
      return [data];
    }
    return [data];
  }
  if (data instanceof Array) {
    return data.map((e) => formatValue(e, type));
  }
  if (type === 'number') {
    if (typeof data === 'number') {
      return data;
    }
    if (typeof data === 'string') {
      return +data;
    }
    return +data;
  }
  if (type === 'string') {
    if (typeof data === 'number') {
      return `${data}`;
    }
    if (typeof data === 'string') {
      return data;
    }
    return `${data}`;
  }
  if (type === 'boolean') {
    if (typeof data === 'boolean') {
      return data;
    }
    // eslint-disable-next-line no-self-compare
    if (typeof data === 'number' || +data === +data) {
      return !!+data;
    }
    if (typeof data === 'string') {
      return data === 'true';
    }
    return !!data;
  }
  if (type === 'moment') {
    return moment(data, [moment.ISO_8601, 'x', 'YYYY-MM-DD HH:mm:ss']);
  }
  return data;
};

// @ts-ignore
export const formatQueryParam = (data, options) => {
  const result = { ...data };

  Object.keys(options).forEach((key) => {
    if (data[key] === undefined) {
      return;
    }
    let formatter = options[key];
    if (formatter === false) {
      delete result[key];
      return;
    }
    if (!(formatter instanceof Array)) {
      formatter = [formatter];
    }

    // @ts-ignore
    result[key] = formatter.reduce((pre, e) => formatValue(pre, e), data[key]);
  });

  return result;
};

export const pathnameInStaticRoutes = (): boolean => {
  const { pathname } = history.location;
  // handle url end with '/'
  let path = pathname;
  if (pathname.startsWith('/admin') || pathname.startsWith('/profile')) {
    return true;
  }
  if (pathname.endsWith('/')) {
    path = pathname.substring(0, pathname.length - 1);
  }
  if (path === '') {
    return true;
  }

  for (let i = 0; i < routes.length; i += 1) {
    const staticRoute = routes[i];
    if (path === staticRoute.path) {
      return true;
    }
  }

  return false;
};

export const handleHref = (event: any, link: string, type: string = 'window') => {
  const { metaKey, ctrlKey } = event;

  // metaKey for macOS; ctrlKey for others
  // https://developer.mozilla.org/en-US/docs/web/api/navigator/platform#browser_compatibility
  if (navigator.platform.indexOf('Mac') > -1 && metaKey) {
    window.open(link);
    return;
  }
  if (navigator.platform.indexOf('Mac') === -1 && ctrlKey) {
    window.open(link);
    return;
  }
  if (type === 'window') {
    window.location.href = link;
  } else {
    history.push(link);
  }
};

// generate oidc authn link
export function IdpSetState(u: string, link: boolean = false, customRedirect?: string) {
  const url = new URL(u);
  let state = url.searchParams.get('state');
  if (state === null) {
    return u;
  }
  state = window.atob(state);

  const stateParams = new URLSearchParams(state);
  let redirect = history.location.query?.redirect ?? IndexURL;
  if (typeof redirect !== 'string') {
    redirect = (redirect as string[]).at(0) || '';
  }
  if (customRedirect) {
    redirect = customRedirect;
  }
  stateParams.set('redirect', redirect);
  stateParams.set('link', link ? 'true' : 'false');
  url.searchParams.set('state', window.btoa(stateParams.toString()));
  url.searchParams.set('redirect_uri', RedirectURL);
  return url.toString();
}

export const tagShouldOmit = (tag: TAG.Tag) => tag.key.length > 16 || tag.value.length > 16;

export const difference = (object: any, other: any) => {
  const diff = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] === 'object' && typeof other[key] === 'object' && object[key] && other[key]) {
      const subDiff = difference(object[key], other[key]);
      if (Object.keys(subDiff).length !== 0) {
        diff[key] = subDiff;
      }
    } else if (object[key] !== other[key]) {
      diff[key] = object[key];
    }
  });
  return diff;
};

// rollout
const runningState = 'Running';
const onlineState = 'online';
const unknownState = 'unknown';
const offlineState = 'offline';

// PodLifeCycleSchedule specifies whether pod has been scheduled
const PodLifeCycleSchedule = 'PodSchedule';
// PodLifeCycleInitialize specifies whether all init containers have finished
const PodLifeCycleInitialize = 'PodInitialize';
// PodLifeCycleContainerStartup specifies whether the container has passed its startup probe
const PodLifeCycleContainerStartup = 'ContainerStartup';
// PodLifeCycleContainerOnline specified whether the container has passed its postStart hook
const PodLifeCycleContainerOnline = 'ContainerOnline';
// PodLifeCycleHealthCheck specifies whether the container has passed its readiness probe
const PodLifeCycleHealthCheck = 'HealthCheck';
// PodLifeCycleContainerPreStop specifies whether the container is executing preStop hook
const PodLifeCycleContainerPreStop = 'PreStop';

const LifeCycleStatusSuccess = 'Success';
const LifeCycleStatusWaiting = 'Waiting';
const LifeCycleStatusRunning = 'Running';
const LifeCycleStatusAbnormal = 'Abnormal';
const PodErrCrashLoopBackOff = 'CrashLoopBackOff';

const PodScheduled = 'PodScheduled';
const PodInitialized = 'Initialized';
const PodConditionTrue = 'True';

// allContainersStarted determine if all containers have been started
function allContainersStarted(containerStatuses: Kubernetes.ContainerStatus[]): boolean {
  return containerStatuses.filter((item) => !item.started).length === 0;
}

// allContainersRunning determine if all containers running
function allContainersRunning(containerStatuses: Kubernetes.ContainerStatus[]): boolean {
  return containerStatuses.filter((item) => !item.state.running).length === 0;
}

// allContainersReady determine if all containers ready
function allContainersReady(containerStatuses: Kubernetes.ContainerStatus[]): boolean {
  return containerStatuses.filter((item) => !item.ready).length === 0;
}

// oneOfContainersCrash determine if one of containers crash
function oneOfContainersCrash(containerStatuses: Kubernetes.ContainerStatus[]): boolean {
  return containerStatuses.filter((item) => item.state.waiting && item.state.waiting.reason === PodErrCrashLoopBackOff).length !== 0;
}

// parsePodLifecycle parse pod lifecycle by pod status
function parsePodLifeCycle(pod: Kubernetes.Pod): CLUSTER.PodLifeCycle[] {
  let lifeCycle: CLUSTER.PodLifeCycle[] = [];
  // if DeletionTimestamp is set, pod is Terminating
  const { metadata, status } = pod;
  if (metadata.deletionTimestamp) {
    lifeCycle.push(
      {
        type: PodLifeCycleContainerPreStop,
        status: LifeCycleStatusRunning,
        message: '',
      },
    );
  } else {
    const conditionMap: Record<string, Kubernetes.Condition> = {};
    const schedule: CLUSTER.PodLifeCycle = {
      type: PodLifeCycleSchedule,
      status: LifeCycleStatusWaiting,
      message: '',
    };
    const initialize: CLUSTER.PodLifeCycle = {
      type: PodLifeCycleInitialize,
      status: LifeCycleStatusWaiting,
      message: '',
    };
    const containerStartup: CLUSTER.PodLifeCycle = {
      type: PodLifeCycleContainerStartup,
      status: LifeCycleStatusWaiting,
      message: '',
    };
    const containerOnline: CLUSTER.PodLifeCycle = {
      type: PodLifeCycleContainerOnline,
      status: LifeCycleStatusWaiting,
      message: '',
    };
    const healthCheck: CLUSTER.PodLifeCycle = {
      type: PodLifeCycleHealthCheck,
      status: LifeCycleStatusWaiting,
      message: '',
    };
    lifeCycle = [
      schedule,
      initialize,
      containerStartup,
      containerOnline,
      healthCheck,
    ];
    if (!status.containerStatuses || status.containerStatuses.length === 0) {
      return lifeCycle;
    }

    status.conditions.forEach((condition) => {
      conditionMap[condition.type] = condition;
    });

    if (PodScheduled in conditionMap) {
      const condition = conditionMap[PodScheduled];
      if (condition.status === PodConditionTrue) {
        schedule.status = LifeCycleStatusSuccess;
        schedule.completeTime = condition.lastTransitionTime;
        initialize.status = LifeCycleStatusRunning;
      } else if (condition.message !== '') {
        schedule.status = LifeCycleStatusAbnormal;
        schedule.message = condition.message;
      }
    } else {
      schedule.status = LifeCycleStatusWaiting;
    }

    if (PodScheduled in conditionMap) {
      const condition = conditionMap[PodInitialized];
      if (condition.status === PodConditionTrue) {
        initialize.status = LifeCycleStatusSuccess;
        initialize.completeTime = condition.lastTransitionTime;
        containerStartup.status = LifeCycleStatusRunning;
      }
    } else {
      initialize.status = LifeCycleStatusWaiting;
    }

    if (allContainersStarted(status.containerStatuses)) {
      containerStartup.status = LifeCycleStatusSuccess;
      containerOnline.status = LifeCycleStatusRunning;
    }

    if (allContainersRunning(status.containerStatuses)) {
      containerOnline.status = LifeCycleStatusSuccess;
      healthCheck.status = LifeCycleStatusRunning;
    }

    if (allContainersReady(status.containerStatuses)) {
      healthCheck.status = LifeCycleStatusSuccess;
    }

    // CrashLoopBackOff means rest items are abnormal
    if (oneOfContainersCrash(status.containerStatuses)) {
      lifeCycle = lifeCycle.map((item) => {
        const { status: itemStatus, ...restItem } = item;
        if (itemStatus === LifeCycleStatusRunning) {
          return { ...restItem, status: LifeCycleStatusAbnormal } as CLUSTER.PodLifeCycle;
        }
        return item;
      });
    }
  }

  return lifeCycle;
}

function getRevision(n: CLUSTER.ResourceNode) {
  if (n.info && n.info.length > 0) {
    const revision = n.info.filter((item) => item.name === 'Revision');
    if (revision.length > 0) {
      return revision[0].value;
    }
  }
  return '';
}

type Tree = {
  parent?: Tree,
  node: CLUSTER.ResourceNode,
  children: Tree[],
};

function genTree(data: CLUSTER.ResourceTree) {
  const roots: Tree[] = [];
  const visited: Record<string, Tree> = {};

  Object.keys(data.nodes).forEach((k) => {
    if (k in visited) {
      return;
    }
    let key = k;

    let preNode: Tree | undefined;

    while (true) {
      let root = visited[key];
      if (root === undefined) {
        root = {
          node: data.nodes[key],
          children: [],
        };
        visited[key] = root;
      }

      if (preNode !== undefined) {
        preNode.parent = root;
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        if (root.children.filter((n) => n.node.uid === preNode?.node.uid).length === 0) {
          root.children.push(preNode);
        }
      }

      if (root.node && root.node.parentRefs && root.node.parentRefs.length !== 0) {
        key = root.node.parentRefs[0].uid;
        preNode = root;
      } else {
        roots.push(root);
        return;
      }
    }
  });
  return visited;
}

function getVersion(revision: string) {
  const pattern = /Rev:([0-9]+)/;
  const matches = pattern.exec(revision);
  if (matches === null || matches.length < 2) {
    return -1;
  }
  const version = parseInt(matches[1], 10);
  if (isNaN(version)) {
    return -1;
  }
  return version;
}

export const refreshPodsInfo = (data?: CLUSTER.ResourceTree) => {
  const podsMap: Record<string, CLUSTER.PodInTable[]> = {};
  const currentPods: CLUSTER.PodInTable[] = [];
  const healthyPods: CLUSTER.PodInTable[] = [];
  const notHealthyPods: CLUSTER.PodInTable[] = [];
  if (!data) {
    return {
      podsMap,
      currentPods,
      healthyPods,
      notHealthyPods,
      sortedKey: [],
    };
  }

  const { nodes } = data;

  const trees = genTree(data);

  function getPrefix(k: string) {
    let n = trees[k];
    let res = '';
    while (true) {
      if (res !== '') {
        res = `${n.node.name}/${res}`;
      } else {
        res = n.node.name;
      }
      if (n.parent) {
        n = n.parent;
      } else {
        return res;
      }
    }
  }

  const revisionSet = new Set<Tree>();

  Object.keys(nodes).forEach((uid: string) => {
    const node = nodes[uid];
    if (node.kind === 'Pod') {
      const n = trees[node.uid];
      if (n.parent) {
        revisionSet.add(n.parent);
      }
    }
  });

  const revisions = Array.from(revisionSet);
  const parents: Tree[] = [];

  revisions.forEach((revision) => {
    const pods = revision.children.filter((n) => n.node.kind === 'Pod');
    if (pods && pods.length > 0) {
      const podsInTable = pods.map((podTreeNode) => {
        const pod = podTreeNode.node;
        const {
          status, spec, metadata,
        } = pod.podDetail!;
        const { containers } = spec;
        const { namespace, creationTimestamp } = metadata;
        const {
          containerStatuses, phase, reason, message,
        } = status;

        let readyCount = 0;
        let restartCount = 0;
        let onlineStatus = offlineState;
        if (containerStatuses && containerStatuses.length > 0) {
          restartCount = containerStatuses[0].restartCount;
          if (containerStatuses.length === containers.length) {
            onlineStatus = onlineState;
            if (containers.map((c) => c.readinessProbe)
              .filter((p) => p !== undefined && p !== null).length === 0) {
              onlineStatus = unknownState;
            }
            containerStatuses.forEach(
              (containerStatus: any) => {
                if (!containerStatus.ready) {
                  onlineStatus = offlineState;
                } else {
                  readyCount += 1;
                }
              },
            );
          }
        }

        const podInTable: CLUSTER.PodInTable = {
          key: metadata.name,
          state: {
            state: phase,
            reason,
            message,
          },
          podName: metadata.name,
          createTime: timeToLocal(creationTimestamp),
          ip: status.podIP,
          onlineStatus,
          readyCount,
          lifeCycle: parsePodLifeCycle(pod.podDetail!),
          restartCount,
          containerName: containers[0].name,
          namespace,
          annotations: metadata.annotations,
          deletionTimestamp: metadata.deletionTimestamp,
          // @ts-ignore
          containers: spec.containers,
        };
        if (phase === runningState) {
          healthyPods.push(podInTable);
        } else {
          notHealthyPods.push(podInTable);
        }
        return podInTable;
      });
      podsMap[getPrefix(revision.node.uid)] = podsInTable;
      parents.push(revision);
    }
  });

  const sortedKey = parents.sort((a, b) => {
    const revisionA = getRevision(a.node);
    const revisionB = getRevision(b.node);
    // order by revision desc
    if (revisionA !== '' && revisionB !== '') {
      if (revisionA === revisionB) {
        // order by name desc
        return -a.node.name.localeCompare(b.node.name);
      }
      const versionA = getVersion(revisionA);
      const versionB = getVersion(revisionB);
      return versionB - versionA;
    }
    if (revisionA !== '') {
      return 1;
    }
    if (revisionB !== '') {
      return -1;
    }
    // order by name desc
    return -a.node.name.localeCompare(b.node.name);
  }).map((n) => getPrefix(n.node.uid));

  return {
    podsMap,
    currentPods,
    healthyPods,
    notHealthyPods,
    sortedKey,
  };
};

export default {
  getResourcePath,
  getBreadcrumbs,
  getAvatarColorIndex,
  timeFromNow,
  timeToLocal,
  timeSecondsDuration,
  tagShouldOmit,
};
