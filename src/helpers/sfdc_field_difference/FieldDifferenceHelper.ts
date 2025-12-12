import * as jsforce from 'jsforce';
import prisma from '../../config/database';
import { emitProgress } from '../../utils/fieldDifferenceSSE';
import {
  filterFieldsToScope,
  getDataFieldSchemaMap,
  isModifiable,
  arePicklistValuesSame,
  areSourceAndTargetOrgFieldsSame,
  areNonPicklistFieldsSame,
} from './FieldDifferenceHelperFunctions';

/**
 * Performs field difference analysis between source and target orgs and stores results in Prisma.
 */
export const getFieldDifferenceAsync = async (
  consoleOrgConn: jsforce.Connection,
  sourceOrgConn: jsforce.Connection,
  targetOrgConn: jsforce.Connection,
  dataScheduleId: string,
  objectNames: Record<string, string>,
  sourceOrg: string,
  targetOrg: string,
  fieldScope: string
) => {
  try {
    const extraFieldsOnSourceOrg: string[] = [];
    const picklistDifference: string[] = [];
    const customFieldDifference: string[] = [];
    const customNonPicklistFields: string[] = [];

    sourceOrgConn.bulk.pollTimeout = 120000;
    targetOrgConn.bulk.pollTimeout = 120000;

    let sourceOrgObjects: Record<string, any> = {};
    let targetOrgObjects: Record<string, any> = {};

    const objectList = Object.keys(objectNames || {});

    for (const objectName of objectList) {
      emitProgress(dataScheduleId, 'progress', `Fetching object: ${objectName}`);

      sourceOrgObjects[objectName] = {};
      const srcDesc = await sourceOrgConn.describe(objectName);
      for (const fieldObj of (srcDesc.fields as any[])) {
        sourceOrgObjects[objectName][fieldObj.name] = {
          name: fieldObj.name,
          label: fieldObj.label,
          type: fieldObj.type,
          length: fieldObj.length,
          unique: fieldObj.unique,
          nillable: fieldObj.nillable,
          calculated: fieldObj.calculated,
          scale: fieldObj.scale,
          picklistValues: fieldObj.picklistValues,
          custom: fieldObj.custom,
        };
      }

      targetOrgObjects[objectName] = {};
      const tgtDesc = await targetOrgConn.describe(objectName);
      for (const fieldObj of (tgtDesc.fields as any[])) {
        targetOrgObjects[objectName][fieldObj.name] = {
          name: fieldObj.name,
          label: fieldObj.label,
          type: fieldObj.type,
          length: fieldObj.length,
          unique: fieldObj.unique,
          nillable: fieldObj.nillable,
          calculated: fieldObj.calculated,
          scale: fieldObj.scale,
          picklistValues: fieldObj.picklistValues,
          custom: fieldObj.custom,
        };
      }
    }

    if (fieldScope === 'schema') {
      emitProgress(dataScheduleId, 'progress', 'Applying schema scope filtering...');
      const dataFieldSchemaMap = await getDataFieldSchemaMap(consoleOrgConn, objectList);
      sourceOrgObjects = await filterFieldsToScope(sourceOrgObjects, dataFieldSchemaMap as any);
      targetOrgObjects = await filterFieldsToScope(targetOrgObjects, dataFieldSchemaMap as any);
      emitProgress(dataScheduleId, 'progress', 'Fields filtered according to schema scope');
    }

    for (const objectName of Object.keys(sourceOrgObjects)) {
      for (const fieldName of Object.keys(sourceOrgObjects[objectName] || {})) {
        const sourceField = sourceOrgObjects[objectName][fieldName];
        const targetField = (targetOrgObjects[objectName] || {})[fieldName];

        if (!targetField) {
          extraFieldsOnSourceOrg.push(`${objectName}.${fieldName}`);
          continue;
        }

        if (sourceField.type === 'picklist') {
          const picklistSame = await arePicklistValuesSame(sourceField, targetField);
          if (!picklistSame) picklistDifference.push(`${objectName}.${fieldName}`);
        }

        if (isModifiable(fieldName)) {
          if (sourceField.custom && sourceField.type !== 'picklist') {
            const nonPicklistSame = await areNonPicklistFieldsSame(sourceField, targetField);
            if (!nonPicklistSame) customNonPicklistFields.push(`${objectName}.${fieldName}`);
          }
          const customFieldSame = await areSourceAndTargetOrgFieldsSame(sourceField, targetField);
          if (!customFieldSame) customFieldDifference.push(`${objectName}.${fieldName}`);
        }
      }
    }

    emitProgress(dataScheduleId, 'progress', 'Analysis complete - updating results...');

    // persist results to prisma
    await prisma.fieldDifferenceLog.upsert({
      where: { dataScheduleId },
      update: {
        status: 'Complete',
        differences: {
          sourceOrgObjects,
          targetOrgObjects,
          extraFieldsOnSourceOrg,
          picklistDifference,
          customFieldDifference,
          customNonPicklistFields,
        },
        progress: 100,
      },
      create: {
        dataScheduleId,
        status: 'Complete',
        differences: {
          sourceOrgObjects,
          targetOrgObjects,
          extraFieldsOnSourceOrg,
          picklistDifference,
          customFieldDifference,
          customNonPicklistFields,
        },
        progress: 100,
      } as any,
    });

    emitProgress(dataScheduleId, 'complete', 'Field difference analysis completed', {
      counts: {
        extra: extraFieldsOnSourceOrg.length,
        picklist: picklistDifference.length,
        custom: customFieldDifference.length,
        nonPicklist: customNonPicklistFields.length,
      },
    });

    return {
      success: true,
      sourceOrgObjects,
      targetOrgObjects,
      extraFieldsOnSourceOrg,
      picklistDifference,
      customFieldDifference,
      customNonPicklistFields,
    };
  } catch (error) {
    console.error('Error in getFieldDifferenceAsync:', error);
    try {
      await prisma.fieldDifferenceLog.updateMany({ where: { dataScheduleId }, data: { status: 'Failed' } });
    } catch (e) {
      // ignore
    }
    emitProgress(dataScheduleId, 'error', 'Error during analysis', { error: String(error) });
    throw error;
  }
};

export default { getFieldDifferenceAsync };
