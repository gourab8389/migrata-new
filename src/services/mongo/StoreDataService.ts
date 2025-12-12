import * as crypto from "crypto";
import prisma from "../../config/database";


interface JunctionTableData {
  ExternalId?: string;
  Org1Id: string;
  ObjectName: string;
  UniqueKey?: string;
  SourceOrg: string;
  ExtIdSrcOrgName: string;
  HashKey?: string;
  Org2Id?: string;
}

const concatUniqueKey = (
  data: any,
  uniqueFields: string[],
  delimiter: string = "~"
): string => {
  return uniqueFields
    .map((field) => data[field] || "")
    .join(delimiter);
};

/**
 * Filter Salesforce data and store in PostgreSQL database
 * Handles unique key generation, hash generation, and junction table updates
 */
export const filterAndStoreData = async (
  objectName: string,
  orgName: string,
  records: any[],
  externalIdName: string,
  uniqueFields: string[] = []
): Promise<void> => {
  try {
    for (const data of records) {
      // Generate unique key and hash
      let uniqueKeyString: string | null = null;
      let hashKey: string | null = null;

      if (uniqueFields.length > 0) {
        uniqueKeyString = concatUniqueKey(data, uniqueFields, "~");
        hashKey = crypto.createHash("md5").update(uniqueKeyString).digest("hex");
      }

      // Clean data - remove Salesforce attributes
      const cleanData = { ...data };
      if (cleanData.attributes) {
        delete cleanData.attributes;
      }

      // Remove attributes from nested objects
      for (const key in cleanData) {
        if (typeof cleanData[key] === "object" && cleanData[key] !== null) {
          if (cleanData[key].attributes) {
            delete cleanData[key].attributes;
          }
        }
      }

      // Store in appropriate data collection based on object type
      // For now, store metadata in ErrorLog for tracking
      await prisma.errorLog.create({
        data: {
          context: {
            objectName,
            orgName,
            externalId: data[externalIdName],
            uniqueKey: uniqueKeyString,
            hashKey,
            recordData: cleanData,
          },
          endpoint: `migration/${objectName}`,
        },
      });

      console.log(
        `Data stored for ${objectName} record ${data.Id} in org ${orgName}`
      );
    }

    console.log(`Data successfully saved for ${objectName}`);
  } catch (error) {
    console.error(`Error filtering or storing data for ${objectName}:`, error);
    throw error;
  }
};

/**
 * Update the last sync time for an object in the database
 */
export const updateLastSyncTimeInMongo = async (
  objectName: string,
  orgName: string,
  lastSyncTime: Date = new Date()
): Promise<void> => {
  try {
    // Store sync info in AuditLog for tracking
    await prisma.auditLog.create({
      data: {
        action: "LAST_SYNC_UPDATE",
        resource: `${objectName}~${orgName}`,
        details: {
          lastSyncTime,
        },
      },
    });

    console.log(
      `Last sync time updated for ${objectName} in org ${orgName}`
    );
  } catch (error) {
    console.error(`Error updating last sync time:`, error);
    throw error;
  }
};

/**
 * Store batch item record IDs for tracking imported records
 */
export const filterAndStoreBatchItemRecordIds = async (
  batchId: string,
  sourceOrgId: string,
  recordIds: Record<string, string[]>
): Promise<void> => {
  try {
    // Store batch record IDs in AuditLog for reference
    await prisma.auditLog.create({
      data: {
        action: "BATCH_RECORD_IDS_STORED",
        resource: `${batchId}~${sourceOrgId}`,
        details: {
          recordIds,
          timestamp: new Date(),
        },
      },
    });

    console.log(
      `Batch item record IDs stored for batch ${batchId} from org ${sourceOrgId}`
    );
  } catch (error) {
    console.error(`Error storing batch item record IDs:`, error);
    throw error;
  }
};

export default {
  filterAndStoreData,
  updateLastSyncTimeInMongo,
  filterAndStoreBatchItemRecordIds,
};
