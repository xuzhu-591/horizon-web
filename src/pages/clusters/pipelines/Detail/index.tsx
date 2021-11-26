import PageWithBreadcrumb from '@/components/PageWithBreadcrumb'
import type {Param} from '@/components/DetailCard'
import DetailCard from '@/components/DetailCard'
import CodeEditor from '@/components/CodeEditor'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/sql/sql'
import 'codemirror/addon/hint/show-hint.css'
import './index.less'
import 'codemirror/addon/display/fullscreen.css'
import 'codemirror/addon/display/fullscreen'
import {Button, Card} from "antd";
import {CopyOutlined, FullscreenOutlined} from "@ant-design/icons";
import styles from './index.less'
import copy from "copy-to-clipboard";
import FullscreenModal from '@/components/FullscreenModal'
import {useState} from "react";
import CodeDiff from '@/components/CodeDiff'
import {useParams} from 'umi';
import {useRequest} from "@@/plugin-request/request";
import {getPipeline, getPipelineDiffs, queryPipelineLog} from "@/services/pipelineruns/pipelineruns";
import Utils from '@/utils'
import {PublishType} from "@/const";
import {useIntl} from "@@/plugin-locale/localeExports";
import {useModel} from "@@/plugin-model/useModel";
import {rollback} from "@/services/clusters/clusters";
import {history} from "@@/core/history";

export default (props: any) => {
  const params = useParams<{id: string}>();
  const pipelineID = parseInt(params.id)

  const intl = useIntl();
  const {location} = props;
  const {query} = location;
  // 1. true 2. false
  const {rollback: showRollback = false} = query

  const {initialState} = useModel('@@initialState');
  const {id, fullPath} = initialState!.resource;
  const [loading, setLoading] = useState(false)

  const {data: pipeline} = useRequest(() => getPipeline(pipelineID))
  const {data: diff} = useRequest(() => getPipelineDiffs(pipelineID))
  const {data: buildLog} = useRequest(() => queryPipelineLog(pipelineID), {
    formatResult: (res) => {
      return res
    }
  })

  const formatMessage = (suffix: string, defaultMsg: string) => {
    return intl.formatMessage({id: `pages.pipelineNew.${suffix}`, defaultMessage: defaultMsg})
  }

  const data: Param[][] = [
    [
      {
        key: '状态/Status',
        value: pipeline?.status || 'Unknown',
      },
      {
        key: '启动时间/Started',
        value: Utils.timeToLocal(pipeline?.startedAt || ''),
      },
      {
        key: '持续时间/Duration',
        value: pipeline ? `${Utils.timeSecondsDuration(pipeline!.startedAt, pipeline!.finishedAt)}s` : '',
      },
    ],
    [
      {
        key: '触发者/Trigger',
        value: pipeline?.createdBy.userName || '',
      },
      {
        key: 'Git info',
        value: {
          'Commit ID': pipeline?.gitCommit || '',
        }
      }
    ]
  ]

  const cardTab = (pipeline && pipeline.action === PublishType.BUILD_DEPLOY) ? [
    {
      key: "Changes",
      tab: "变更内容"
    },
    {
      key: "BuildLog",
      tab: "构建日志"
    },
  ] : [
    {
      key: "Changes",
      tab: "变更内容"
    },
  ];

  const [fullscreen, setFullscreen] = useState(false)
  const {successAlert, errorAlert} = useModel('alert')
  const onFullscreenClick = () => {
    setFullscreen(true)
  }

  const onCopyClick = () => {
    if (copy(props.content)) {
      successAlert('复制成功')
    } else {
      errorAlert('复制失败')
    }
  }

  const onClose = () => {
    setFullscreen(false)
  }

  const content = {
    'BuildLog': <CodeEditor
      content={buildLog}
    />,
    'Changes': <div>
      {
        pipeline?.action === PublishType.BUILD_DEPLOY &&
        <Card title={formatMessage('codeChange', '代码变更')} className={styles.gapBetweenCards}>
          <b>Commit ID</b>
          <br/>
          {diff?.codeInfo.commitID}
          <br/>
          <br/>
          <b>Commit Log</b>
          <br/>
          {diff?.codeInfo.commitMsg}
          <br/>
          <br/>
          <b>Commit History</b>
          <br/>
          <a href={diff?.codeInfo.link}>Link</a>
        </Card>
      }
      <Card title={formatMessage('configChange', '配置变更')} className={styles.gapBetweenCards}>
        <CodeDiff diff={diff?.configDiff.diff || ''}/>
      </Card>
    </div>
  }

  const [activeTabKey, setActiveTabKey] = useState('Changes')

  return <PageWithBreadcrumb>
    <DetailCard
      title={<span>基础信息</span>}
      data={data}
      extra={showRollback ? <Button loading={loading} onClick={() => {
        setLoading(true)
        rollback(id, {pipelinerunID: pipelineID}).then(() => {
          successAlert('提交回滚成功')
          history.push(`/clusters${fullPath}/-/pods`)
        });
      }}>
        确认回滚
      </Button> : null}
    />
    <Card
      tabList={cardTab}
      bodyStyle={{height: '500px'}}
      onTabChange={setActiveTabKey}
      tabBarExtraContent={(
        <div>
          <Button className={styles.buttonClass}>
            <CopyOutlined className={styles.iconCommonModal} onClick={onCopyClick}/>
          </Button>
          <Button className={styles.buttonClass}>
            <FullscreenOutlined className={styles.iconCommonModal} onClick={onFullscreenClick}/>
          </Button>
        </div>
      )}
    >
      {content[activeTabKey]}
    </Card>
    <FullscreenModal
      title={''}
      visible={fullscreen}
      onClose={onClose}
      fullscreen={true}
      supportFullscreenToggle={false}
    >
      {content[activeTabKey]}
    </FullscreenModal>
  </PageWithBreadcrumb>
}
