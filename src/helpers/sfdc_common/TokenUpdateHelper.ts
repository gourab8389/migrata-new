import prisma from '../../config/database';

interface TokenUpdateData {
  orgId: string;
  userId: string;
  userName: string;
  userEmail: string;
  instanceUrl: string;
  accessToken: string;
  refreshToken: string;
  domainName: string;
  profileId: string;
}

/**
 * Update tokens in the database for an org
 */
export const updateToken = async (data: TokenUpdateData): Promise<any> => {
  try {
    const registeredOrg = await prisma.registeredOrg.upsert({
      where: { domainName: data.domainName.toLowerCase() },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        userEmail: data.userEmail,
        profileId: data.profileId,
      },
      create: {
        domainName: data.domainName.toLowerCase(),
        instanceUrl: data.instanceUrl,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        orgId: data.orgId,
        userId: data.userId,
        userEmail: data.userEmail,
        profileId: data.profileId,
      },
    });

    return {
      success: true,
      message: 'Token updated successfully',
      orgId: registeredOrg.orgId,
    };
  } catch (error) {
    console.error('Error updating token:', error);
    throw error;
  }
};

export default updateToken;
