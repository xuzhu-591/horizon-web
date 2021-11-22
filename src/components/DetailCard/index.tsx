// 一个用于展示多列数据的卡片
import {Card} from "antd";
import styles from './index.less'
import * as React from "react";

enum ValueType {
  String = 'string',
  Array = 'array',
  Object = 'object',
}

interface Props {
  // 标题
  title: React.ReactNode;
  // 数据[列][行]
  data: Param[][];
  // extra
  extra: React.ReactNode;
}

export type Param = {
  key: string,
  value: string | string[] | Record<string, string | number> | React.ReactNode;
}

export default (props: Props) => {
  const {title, data, extra} = props;
  const contents: any = []
  let col = 0
  const columnSeparator = <div className={styles.separator}/>

  function getType(value: any) {
    if (Array.isArray(value)) {
      return ValueType.Array
    }
    return typeof value
  }

  data.forEach((params, index) => {
      const columnContent = <div className={styles.data} key={col++}>
        {index > 0 ? columnSeparator : null}
        <div className={styles.dataColumn}>
          {params.map((param) => {
            let col2 = 0
            const itemContents: any = []
            if (React.isValidElement(param.value)) {
              itemContents.push(<div key={col2++}>{
                param.value
              }
              </div>)
            } else {
              // 获取参数类型，string/array/object
              const valueType = getType(param.value);
              // 根据参数类型返回不同的格式
              if (valueType === ValueType.String) {
                itemContents.push(<div key={col2++} className={styles.textValue}>{param.value}</div>)
              } else if (valueType === ValueType.Array) {
                itemContents.push((param.value as string[]).map((v) => {
                  return <div key={col2++} className={styles.textValue}>
                    {v}
                  </div>
                }))

              } else if (valueType === ValueType.Object) {
                // @ts-ignore
                const keys = Object.keys(param.value)
                for (let key = 0; key < keys.length; key += 1) {
                  const i = keys[key];
                  itemContents.push(<div key={col2++} className={styles.textValue}><span
                    className={styles.textValueKey}>{i}</span>: <span
                    // @ts-ignore
                    className={styles.textValueValue}>{param.value[i]}</span></div>)
                }
              }
            }

            return <div key={param.key} className={styles.dataColumnItem}>
              <div className={styles.textKey}>{param.key}</div>
              {itemContents}
            </div>
          })}
        </div>
      </div>
      contents.push(columnContent)
    }
  );

  return (
    <div className={styles.card}>
      <Card title={title} type={"inner"} bodyStyle={{paddingInline: 0}} extra={extra}>
        <div className={styles.cardBody}>
          {contents}
        </div>
      </Card>
    </div>
  );
};
