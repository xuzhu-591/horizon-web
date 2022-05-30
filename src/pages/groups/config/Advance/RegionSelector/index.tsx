import {Card} from 'antd';
import DynamicTagForm, {ValueType} from "@/components/DynamicTagForm";
import {useModel} from "@@/plugin-model/useModel";
import {getGroupByID, updateGroupRegionSelector} from "@/services/groups/groups";

export default () => {

  const {initialState} = useModel('@@initialState');
  const {id} = initialState!.resource

  return (
    <Card title="关联区域">
      <DynamicTagForm
        queryTags={() => getGroupByID(id).then(({data}) => {
          return {
            data: {
              tags: data.regionSelectors
            }
          }
        })}
        updateTags={(data) => updateGroupRegionSelector(id, data.tags)}
        valueType={ValueType.Multiple}
      />
    </Card>
  )
};
