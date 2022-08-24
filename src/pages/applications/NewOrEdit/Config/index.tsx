import {useIntl, useRequest} from 'umi';
import {querySchema} from '@/services/templates/templates';
import JsonSchemaForm from '@/components/JsonSchemaForm';
import {Button, Card} from 'antd';
import styles from '../index.less';
import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';

export default forwardRef((props: any, ref) => {
  const intl = useIntl();

  const {readonly = false} = props;
  const formRefs = useRef([])

  // query schema by template and release
  const {data, loading} = useRequest(() => querySchema(props.template.name, props.release), 
    {
      onSuccess: ()=>{
        formRefs.current = formRefs.current.slice(0, Object.keys(data).length)
      }
    }
  );

  const titlePrefix = 'pages.applicationNew.config';

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        // 触发整个rjsf表单组的提交事件
        formRefs.current.forEach((formRef)=>{
          formRef.submit();
        })
      }
    })
  );

  const [totalFormData, setTotalFormData] = useState({});
  // 所有表单提交完成后，才会调用最终的onSubmit
  useEffect(()=>{
    if (!loading && (Object.keys(totalFormData).length >= 
    Object.keys(data).length)) {
      props.onSubmit(totalFormData)
    }

  }, [totalFormData])

  return (
    <div>
      {data &&
      Object.keys(data).map((item, i) => {
        const currentFormData = props.config[item] || {};

        const onChange = ({formData, errors}: any) => {
          if (readonly) {
            return;
          }

          props.setConfig((config: any) => ({...config, [item]: formData}));
          props.setConfigErrors((configErrors: any) => ({...configErrors, [item]: errors}));
        };

        const {jsonSchema, uiSchema} = data[item];

        return (
          <Card
            className={styles.gapBetweenCards}
            key={item}
            title={intl.formatMessage({id: `${titlePrefix}.${item}`})}
          >
            <JsonSchemaForm
              ref={(dom)=>{
                formRefs.current[i] = dom
              }}
              disabled={readonly}
              formData={currentFormData}
              jsonSchema={jsonSchema}
              onChange={onChange}
              onSubmit={(schema: any)=>{
                setTotalFormData((fdts)=>({...fdts, [item]:schema.formData}))
              }}
              uiSchema={uiSchema}
              liveValidate
              showErrorList={false}
            />
          </Card>
        );
      })}
    </div>
  );
});
