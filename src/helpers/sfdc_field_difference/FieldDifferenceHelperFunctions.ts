import { getDataFields } from '../../services/sfdc/DataMetaDataService';

export const filterFieldsToScope = async (orgObjectsMap: any, dataFieldSchemaMap: Record<string, string[]>) => {
  try {
    const returnObj: Record<string, any> = {};
    for (const objectName of Object.keys(dataFieldSchemaMap)) {
      returnObj[objectName] = {};
      for (const fieldName of dataFieldSchemaMap[objectName] || []) {
        if (orgObjectsMap[objectName] && Object.prototype.hasOwnProperty.call(orgObjectsMap[objectName], fieldName)) {
          returnObj[objectName][fieldName] = orgObjectsMap[objectName][fieldName];
        }
      }
    }
    return returnObj;
  } catch (error) {
    console.error('Error in filterFieldsToScope:', error);
    return {};
  }
};

export const getDataFieldSchemaMap = async (consoleOrgConn: any, objectNames: string[]) => {
  try {
    const schemaMap: Record<string, string[]> = {};
    for (const objectName of objectNames) {
      schemaMap[objectName] = await getDataFields(consoleOrgConn, objectName);
    }
    return schemaMap;
  } catch (error) {
    console.error('Error in getDataFieldSchemaMap:', error);
    return {};
  }
};

export const isModifiable = (objectName: string) => {
  try {
    const data = objectName.split('__');
    return data.length === 2;
  } catch (error) {
    console.error('Error in isModifiable:', error);
    return false;
  }
};

export const arePicklistValuesSame = async (source: any, target: any) => {
  try {
    if (!Array.isArray(source.picklistValues) || !Array.isArray(target.picklistValues)) return false;
    if (source.picklistValues.length !== target.picklistValues.length) return false;

    const srcMap: Record<string, any> = {};
    const tgtMap: Record<string, any> = {};
    for (const v of source.picklistValues) srcMap[v.value] = v;
    for (const v of target.picklistValues) tgtMap[v.value] = v;

    for (const k of Object.keys(srcMap)) {
      const s = srcMap[k];
      const t = tgtMap[k];
      if (!t) return false;
      if (s.active !== t.active || s.defaultValue !== t.defaultValue || s.label !== t.label || s.validFor !== t.validFor) return false;
    }
    return true;
  } catch (error) {
    console.error('Error in arePicklistValuesSame:', error);
    return false;
  }
};

export const areSourceAndTargetOrgFieldsSame = async (source: any, target: any) => {
  try {
    if (!source || !target) return false;
    if (
      source.name === target.name &&
      source.label === target.label &&
      source.type === target.type &&
      source.length === target.length &&
      source.unique === target.unique &&
      source.nillable === target.nillable &&
      source.calculated === target.calculated &&
      source.scale === target.scale &&
      source.custom === target.custom &&
      (await arePicklistValuesSame(source, target))
    ) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in areSourceAndTargetOrgFieldsSame:', error);
    return false;
  }
};

export const areNonPicklistFieldsSame = async (source: any, target: any) => {
  try {
    if (source.type !== 'picklist' && target.type !== 'picklist') {
      const same =
        source.name === target.name &&
        source.label === target.label &&
        source.type === target.type &&
        source.length === target.length &&
        source.unique === target.unique &&
        source.nillable === target.nillable &&
        source.calculated === target.calculated &&
        source.scale === target.scale &&
        source.custom === target.custom;
      return same;
    }
    return false;
  } catch (error) {
    console.error('Error in areNonPicklistFieldsSame:', error);
    return false;
  }
};

export default {
  filterFieldsToScope,
  getDataFieldSchemaMap,
  isModifiable,
  arePicklistValuesSame,
  areSourceAndTargetOrgFieldsSame,
  areNonPicklistFieldsSame,
};
