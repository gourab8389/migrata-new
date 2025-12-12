import { Request, Response } from 'express';
import axios from 'axios';
import { Connection as JSForceConnection } from 'jsforce';
import prisma from '../../../config/database';
import { getSfdcTokenConnection } from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import { updateToken } from '../../../helpers/sfdc_common/TokenUpdateHelper';

/**
 * Initiates OAuth2 authentication flow to Salesforce
 */
export const authenticate = async (req: Request, res: Response): Promise<void> => {
  try {
    let baseUrlProd = 'https://login.salesforce.com';
    let baseUrlSand = 'https://test.salesforce.com';

    if (req.query.env && String(req.query.env).toLowerCase() === 'sandbox') {
      if (req.query.domain) {
        baseUrlSand = String(req.query.domain).toLowerCase();
      }

      const authUrlSand =
        baseUrlSand +
        '/services/oauth2/authorize?client_id=' +
        process.env.MIGRATA_CLIENT_ID +
        '&redirect_uri=' +
        process.env.REDIRECT_URI +
        '&response_type=code&prompt=login' +
        (req.query.baseUri ? '&state=' + req.query.baseUri : '');

      res.redirect(authUrlSand);
    } else {
      if (req.query.domain) {
        baseUrlProd = String(req.query.domain).toLowerCase();
      }

      const authUrlProd =
        baseUrlProd +
        '/services/oauth2/authorize?client_id=' +
        process.env.MIGRATA_CLIENT_ID +
        '&redirect_uri=' +
        process.env.REDIRECT_URI +
        '&response_type=code&prompt=login' +
        (req.query.baseUri ? '&state=' + decodeURIComponent(String(req.query.baseUri)) : '');

      res.redirect(authUrlProd);
    }
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * OAuth2 callback handler - exchanges code for tokens
 */
export const callback = async (req: Request, res: Response): Promise<void> => {
  try {
    let tokenUrl = 'https://login.salesforce.com/services/oauth2/token';

    const referrer = req.get('Referer') || '';
    if (referrer.includes('.sandbox.') || referrer.includes('test.salesforce.com')) {
      const match = referrer.match(/https:\/\/([^.]+\.sandbox\.my\.salesforce\.com|test\.salesforce\.com)/);
      if (match) {
        tokenUrl = `https://${match[1]}/services/oauth2/token`;
      } else {
        tokenUrl = 'https://test.salesforce.com/services/oauth2/token';
      }
    }

    if (req.query.error) {
      console.error('OAuth Error:', req.query.error, req.query.error_description);
      res.status(400).json({
        success: false,
        error: req.query.error,
        error_description: req.query.error_description,
      });
      return;
    }

    const axiosResult = await axios({
      method: 'POST',
      url: tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        grant_type: 'authorization_code',
        code: req.query.code,
        client_id: process.env.MIGRATA_CLIENT_ID,
        client_secret: process.env.MIGRATA_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
      },
    });

    const data = axiosResult.data;

    const idSplitArr = data.id.split('/');
    const userId = idSplitArr[idSplitArr.length - 1];
    const orgId = idSplitArr[idSplitArr.length - 2];

    const connObj: any = {
      oauth2: {
        clientId: process.env.MIGRATA_CLIENT_ID,
        clientSecret: process.env.MIGRATA_CLIENT_SECRET,
        redirectUri: process.env.REDIRECT_URI,
      },
      instanceUrl: data.instance_url,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };

    const conn = new JSForceConnection(connObj);

    const userInfo = await conn.query(
      `SELECT Id, Name, Email, ProfileId FROM User WHERE Id='${userId}'`
    );

    const domainName = data.instance_url.substring(
      8,
      data.instance_url.indexOf('.')
    );

    const salesOutStatus = await updateToken({
      orgId: orgId,
      userId: userId,
      userName: userInfo.records[0].Name,
      userEmail: userInfo.records[0].Email,
      instanceUrl: data.instance_url,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      domainName: domainName,
      profileId: userInfo.records[0].ProfileId,
    });

    if (req.query.state) {
      const redirectStateUrl = decodeURIComponent(String(req.query.state));
      res.redirect(redirectStateUrl);
    } else {
      res.status(200).json({
        success: true,
        message: 'Org Authentication Successful!',
        salesforceStatus: salesOutStatus,
      });
    }
  } catch (error: any) {
    console.error('Callback error:', error);
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Check if an org is currently authenticated and has valid tokens
 */
export const checkStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.orgName) {
      res.status(400).json({
        success: false,
        error: 'Param orgName Not Found!',
      });
      return;
    }

    const orgName = String(req.query.orgName);

    const registeredOrg = await prisma.registeredOrg.findUnique({
      where: { domainName: orgName.toLowerCase() },
    });

    if (!registeredOrg) {
      res.status(404).json({
        authStatus: false,
        message: 'Org not found or not authenticated!',
        orgName: orgName,
      });
      return;
    }

    const conn = await getSfdcTokenConnection(orgName);
    if (!conn) {
      res.status(403).json({
        authStatus: false,
        message: 'Org Authentication Expired, please re-auth!',
      });
      return;
    }

    const queryData = await conn.query('SELECT Id FROM Account LIMIT 1');
    if (queryData.done === true) {
      res.status(200).json({
        authStatus: true,
        message: 'Org is Authenticated!',
      });
    }
  } catch (error: any) {
    console.error('Check status error:', error);
    res.status(403).json({
      authStatus: false,
      message: 'Org Authentication Expired, please re-auth!',
    });
  }
};

/**
 * Revoke OAuth token for an org
 */
export const revokeAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.orgName) {
      res.status(400).json({
        success: false,
        error: 'Param orgName Not Found!',
      });
      return;
    }

    const orgName = String(req.query.orgName);

    const registeredOrg = await prisma.registeredOrg.findUnique({
      where: { domainName: orgName.toLowerCase() },
    });

    if (!registeredOrg) {
      res.status(404).json({
        authStatus: false,
        message: 'Org not added to Registered Org!',
      });
      return;
    }

    const revokeAuthUrl = `${registeredOrg.instanceUrl}/services/oauth2/revoke?token=${registeredOrg.refreshToken}`;
    await axios.get(revokeAuthUrl);

    // Delete the registered org
    await prisma.registeredOrg.delete({
      where: { id: registeredOrg.id },
    });

    res.status(200).json({
      success: true,
      message: `Token for org ${orgName} revoked successfully.`,
    });
  } catch (error: any) {
    console.error('Revoke auth error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
