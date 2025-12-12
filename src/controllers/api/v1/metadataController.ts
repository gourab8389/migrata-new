import { Request, Response } from 'express';
import getSfdcTokenConnection from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import prisma from '../../../config/database';
import * as fs from 'fs';
import * as path from 'path';

export const getMetadataDeployStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetOrg, deployId } = req.query;
    if (!targetOrg || !deployId) {
      res.status(400).json({ success: false, error: 'Missing targetOrg or deployId' });
      return;
    }

    const conn = await getSfdcTokenConnection(String(targetOrg));
    if (!conn) {
      res.status(401).json({ success: false, error: 'Could not connect to target org' });
      return;
    }

    const deployStatus = await conn.metadata.checkDeployStatus(String(deployId));

    await prisma.metadataDeployLog.upsert({
      where: { deployId: String(deployId) },
      update: {
        status: deployStatus.done ? (deployStatus.success ? 'Completed' : 'Failed') : 'InProgress',
        componentsDeployed: deployStatus.numberComponentsDeployed || 0,
        componentsTotal: deployStatus.numberComponentsDeployed || 0,
        testsCompleted: deployStatus.numberTestsCompleted || 0,
        testsTotal: deployStatus.numberTestsCompleted || 0,
        testErrors: deployStatus.numberTestErrors || 0,
      },
      create: {
        targetOrg: String(targetOrg),
        deployId: String(deployId),
        status: deployStatus.done ? (deployStatus.success ? 'Completed' : 'Failed') : 'InProgress',
        componentsDeployed: deployStatus.numberComponentsDeployed || 0,
        componentsTotal: deployStatus.numberComponentsDeployed || 0,
        testsCompleted: deployStatus.numberTestsCompleted || 0,
        testsTotal: deployStatus.numberTestsCompleted || 0,
        testErrors: deployStatus.numberTestErrors || 0,
      },
    });

    res.status(200).json({
      success: deployStatus.success,
      msg: deployStatus.done ? (deployStatus.success ? 'Metadata deployed successfully!' : 'Metadata deployment failed!') : 'Deployment in progress...',
      targetOrg,
      deployId,
      status: deployStatus.done ? (deployStatus.success ? 'Completed' : 'Failed') : 'In Progress',
      details: {
        componentsDeployed: deployStatus.numberComponentsDeployed || 0,
        componentsTotal: deployStatus.numberComponentsDeployed || 0,
        testsCompleted: deployStatus.numberTestsCompleted || 0,
        testsTotal: deployStatus.numberTestsCompleted || 0,
        testErrors: deployStatus.numberTestErrors || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Status Check Error!', error: error.message });
  }
};

export const deployMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetOrg } = req.query;
    if (!targetOrg) {
      res.status(400).json({ success: false, error: 'Missing targetOrg parameter' });
      return;
    }

    const conn = await getSfdcTokenConnection(String(targetOrg));
    if (!conn) {
      res.status(401).json({ success: false, error: 'Could not connect to target org' });
      return;
    }

    const packageZipPath = path.join(__dirname, '../../../sfdc_deploy/package.zip');
    if (!fs.existsSync(packageZipPath)) {
      res.status(400).json({ success: false, error: 'Package.zip not found' });
      return;
    }

    const zipData = fs.readFileSync(packageZipPath);
    const deployOptions = {
      allowMissingFiles: false,
      autoUpdatePackage: false,
      checkOnly: false,
      ignoreWarnings: false,
      performRetrieve: false,
      purgeOnDelete: false,
      rollbackOnError: true,
      runTests: ['MigrataDateInfoBatchTest', 'TargetOrgMaintenanceBatchTest', 'TargetOrgMaintenanceApiTest', 'ObjectFieldsApiTest'],
      singlePackage: true,
      testLevel: 'RunSpecifiedTests',
    };

    const deployResult = await conn.metadata.deploy(zipData, deployOptions);

    await prisma.metadataDeployLog.create({
      data: {
        targetOrg: String(targetOrg),
        deployId: deployResult.id,
        status: 'InProgress',
      },
    });

    res.status(202).json({
      success: true,
      msg: 'Metadata deployment started successfully!',
      targetOrg,
      deployId: deployResult.id,
      status: 'In Progress',
      checkStatusUrl: `/api/v1/metadata/deploy-status?targetOrg=${targetOrg}&deployId=${deployResult.id}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Deployment Error!', error: error.message });
  }
};

export const checkDeployStatus = getMetadataDeployStatus;

export const deployMetadataOld = deployMetadata;
