import * as jsforce from "jsforce";

interface DataObject {
  name: string;
  label: string;
  fields: string[];
}

interface RelationshipData {
  objectName: string;
  lookupFields: string[];
  parentObjects: string[];
}

/**
 * Fetch data objects available for migration from Salesforce
 */
export const getDataObjects = async (
  connection: jsforce.Connection,
  batchName: string,
  namespace: string
): Promise<DataObject[]> => {
  try {
    const query = `
      SELECT ${namespace}DataObject__c, ${namespace}Label__c
      FROM ${namespace}DataBatchItem__c
      WHERE ${namespace}DataBatch__r.Name = '${batchName}'
      AND ${namespace}IsActive__c = true
    `;

    const result = await connection.query(query);
    const dataObjects: DataObject[] = [];

    for (const record of result.records) {
      dataObjects.push({
        name: record[`${namespace}DataObject__c`],
        label: record[`${namespace}Label__c`],
        fields: [],
      });
    }

    return dataObjects;
  } catch (error) {
    console.error("Error fetching data objects:", error);
    throw error;
  }
};

/**
 * Fetch field names for a specific object
 */
export const getDataFields = async (
  connection: jsforce.Connection,
  objectName: string
): Promise<string[]> => {
  try {
    const metadata = await connection.describe(objectName);
    return metadata.fields
      .filter((field: any) => field.updateable || field.createable)
      .map((field: any) => field.name);
  } catch (error) {
    console.error(`Error fetching fields for ${objectName}:`, error);
    return [];
  }
};

/**
 * Fetch relationship/dependency data for objects
 */
export const getRelationshipObject = async (
  connection: jsforce.Connection,
  batchName: string,
  namespace: string
): Promise<RelationshipData[]> => {
  try {
    const query = `
      SELECT ${namespace}DataObject__c, ${namespace}LookupFields__c, ${namespace}ParentObjects__c
      FROM ${namespace}DataRelationship__c
      WHERE ${namespace}DataBatch__r.Name = '${batchName}'
    `;

    const result = await connection.query(query);
    const relationships: RelationshipData[] = [];

    for (const record of result.records) {
      relationships.push({
        objectName: record[`${namespace}DataObject__c`],
        lookupFields: record[`${namespace}LookupFields__c`]?.split(",") || [],
        parentObjects: record[`${namespace}ParentObjects__c`]?.split(",") || [],
      });
    }

    return relationships;
  } catch (error) {
    console.error("Error fetching relationship data:", error);
    return [];
  }
};

/**
 * Get download flow sequence for objects based on dependencies
 */
export const getDownloadFlow = async (
  connection: jsforce.Connection,
  batchName: string,
  namespace: string
): Promise<string[]> => {
  try {
    const relationships = await getRelationshipObject(
      connection,
      batchName,
      namespace
    );

    // Simple topological sort - objects with no parents first
    const downloaded = new Set<string>();
    const flow: string[] = [];

    while (flow.length < relationships.length) {
      for (const rel of relationships) {
        if (
          !downloaded.has(rel.objectName) &&
          rel.parentObjects.every((p) => downloaded.has(p) || p === "")
        ) {
          flow.push(rel.objectName);
          downloaded.add(rel.objectName);
        }
      }
    }

    return flow;
  } catch (error) {
    console.error("Error calculating download flow:", error);
    return [];
  }
};

/**
 * Get upload flow sequence (reverse of download)
 */
export const getUploadFlow = async (
  connection: jsforce.Connection,
  batchName: string,
  namespace: string
): Promise<string[]> => {
  const downloadFlow = await getDownloadFlow(connection, batchName, namespace);
  return [...downloadFlow].reverse();
};

/**
 * Fetch target operation type (Delete All, Insert Only, etc.)
 */
export const getTargetOperation = async (
  connection: jsforce.Connection,
  batchName: string,
  namespace: string
): Promise<string> => {
  try {
    const query = `
      SELECT ${namespace}TargetOperation__c
      FROM ${namespace}DataBatch__c
      WHERE Name = '${batchName}'
      LIMIT 1
    `;

    const result = await connection.query(query);
    return result.records[0]?.[`${namespace}TargetOperation__c`] || "Insert and Update";
  } catch (error) {
    console.error("Error fetching target operation:", error);
    return "Insert and Update";
  }
};

/**
 * Fetch batch item filters (QuickDeploy, filters, etc.)
 */
export const getDataBatchItemFiltersObject = async (
  connection: jsforce.Connection,
  batchName: string,
  namespace: string
): Promise<Record<string, any>> => {
  try {
    const query = `
      SELECT ${namespace}DataObject__c, ${namespace}Filter__c, ${namespace}QuickDeploy__c
      FROM ${namespace}DataBatchItem__c
      WHERE ${namespace}DataBatch__r.Name = '${batchName}'
      AND ${namespace}IsActive__c = true
    `;

    const result = await connection.query(query);
    const filters: Record<string, any> = {};

    for (const record of result.records) {
      const objectName = record[`${namespace}DataObject__c`];
      filters[objectName] = {
        filter: record[`${namespace}Filter__c`],
        quickDeploy: record[`${namespace}QuickDeploy__c`],
      };
    }

    return filters;
  } catch (error) {
    console.error("Error fetching batch item filters:", error);
    return {};
  }
};

/**
 * Get download flow with detailed information
 */
export const getDownloadFlowDetailed = async (
  connection: jsforce.Connection,
  batchName: string,
  namespace: string
): Promise<{
  resultArr: string[];
  resultArrDetailed: RelationshipData[];
  rootObjects: string[];
}> => {
  try {
    const flow = await getDownloadFlow(connection, batchName, namespace);
    const relationships = await getRelationshipObject(
      connection,
      batchName,
      namespace
    );
    const rootObjects = relationships
      .filter((r) => r.parentObjects.length === 0 || r.parentObjects[0] === "")
      .map((r) => r.objectName);

    return {
      resultArr: flow,
      resultArrDetailed: relationships,
      rootObjects,
    };
  } catch (error) {
    console.error("Error getting detailed download flow:", error);
    return {
      resultArr: [],
      resultArrDetailed: [],
      rootObjects: [],
    };
  }
};

export default {
  getDataObjects,
  getDataFields,
  getRelationshipObject,
  getDownloadFlow,
  getUploadFlow,
  getTargetOperation,
  getDataBatchItemFiltersObject,
  getDownloadFlowDetailed,
};
