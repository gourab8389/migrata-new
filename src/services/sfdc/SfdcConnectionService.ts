import { Connection, OAuth2 } from 'jsforce';
import prisma from '../../config/database';
import { ISfdcConnection } from '../../types';

export const createSfdcConnection = async (
  credentials: ISfdcConnection
): Promise<Connection | null> => {
  try {
    const oauth2 = new OAuth2({
      clientId: process.env.MIGRATA_CLIENT_ID || '',
      clientSecret: process.env.MIGRATA_CLIENT_SECRET || '',
      redirectUri: process.env.REDIRECT_URI || '',
    } as any);

    const conn = new Connection({
      oauth2,
      instanceUrl: credentials.instanceUrl,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
    });

    try {
      await conn.query('SELECT Id FROM User LIMIT 1');
      return conn;
    } catch (error: any) {
      if (error.errorCode === 'INVALID_SESSION_ID' && credentials.refreshToken) {
        try {
          if (oauth2) {
            await (oauth2 as any).refreshToken(credentials.refreshToken);
          }
          return conn;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Token refresh failed - re-authentication required');
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Connection creation failed:', error);
    return null;
  }
};

export const getSfdcTokenConnection = async (
  domainName: string
): Promise<Connection | null> => {
  try {
    const regOrg = await prisma.registeredOrg.findUnique({
      where: { domainName },
    });

    if (!regOrg) {
      throw new Error(`No Org Found with Domain Name: ${domainName}`);
    }

    const conn = await createSfdcConnection({
      instanceUrl: regOrg.instanceUrl,
      accessToken: regOrg.accessToken,
      refreshToken: regOrg.refreshToken || undefined,
    });

    if (conn) {
      console.log(`Successfully Connected to SFDC Org: ${domainName}`);
      return conn;
    }

    return null;
  } catch (error) {
    console.error('Error getting SFDC connection:', error);
    return null;
  }
};

export const validateSfdcOrgs = async (
  sourceOrgId: string,
  targetOrgId: string
): Promise<{
  sourceConn: Connection | null;
  targetConn: Connection | null;
}> => {
  try {
    const sourceOrg = await prisma.registeredOrg.findUnique({
      where: { id: sourceOrgId },
    });

    const targetOrg = await prisma.registeredOrg.findUnique({
      where: { id: targetOrgId },
    });

    if (!sourceOrg || !targetOrg) {
      throw new Error('Source or Target Org not found');
    }

    const sourceConn = await createSfdcConnection({
      instanceUrl: sourceOrg.instanceUrl,
      accessToken: sourceOrg.accessToken,
      refreshToken: sourceOrg.refreshToken || undefined,
    });

    const targetConn = await createSfdcConnection({
      instanceUrl: targetOrg.instanceUrl,
      accessToken: targetOrg.accessToken,
      refreshToken: targetOrg.refreshToken || undefined,
    });

    return { sourceConn, targetConn };
  } catch (error) {
    console.error('Error validating SFDC orgs:', error);
    throw error;
  }
};
