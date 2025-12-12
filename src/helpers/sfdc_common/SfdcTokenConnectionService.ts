import { Connection as JSForceConnection } from 'jsforce';
import prisma from '../../config/database';

/**
 * Get a Salesforce connection using stored tokens for a given domain
 */
export const getSfdcTokenConnection = async (domainName: string): Promise<JSForceConnection | null> => {
  try {
    const registeredOrg = await prisma.registeredOrg.findUnique({
      where: { domainName: domainName.toLowerCase() },
    });

    if (!registeredOrg) {
      console.error(`No org found with domain name: ${domainName}`);
      return null;
    }

    const connObj: any = {
      oauth2: {
        clientId: process.env.MIGRATA_CLIENT_ID,
        clientSecret: process.env.MIGRATA_CLIENT_SECRET,
        redirectUri: process.env.REDIRECT_URI,
      },
      instanceUrl: registeredOrg.instanceUrl,
      accessToken: registeredOrg.accessToken,
      refreshToken: registeredOrg.refreshToken,
    };

    const conn = new JSForceConnection(connObj);

    // Test the connection
    try {
      await conn.query('SELECT Id FROM User LIMIT 1');
      return conn;
    } catch (error: any) {
      if (error.errorCode === 'INVALID_SESSION_ID' && registeredOrg.refreshToken) {
        try {
          // Attempt to refresh the token
          await new Promise((resolve, reject) => {
            (conn as any).oauth2?.refresh((err: any, res: any) => {
              if (err) reject(err);
              else resolve(res);
            });
          });
          return conn;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return null;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Connection creation failed:', error);
    return null;
  }
};

export default getSfdcTokenConnection;
