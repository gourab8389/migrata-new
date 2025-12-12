/**
 * Email service for migration notifications
 */
export const sendMigrateDataMail = async (
  connection: any,
  scheduledId: string,
  status: 'Success' | 'Failed',
  batchName: string
): Promise<void> => {
  try {
    console.log(
      `Migration email notification: Batch=${batchName}, Status=${status}, ScheduleId=${scheduledId}`
    );
    // In a real implementation, send actual email via nodemailer or similar
  } catch (error) {
    console.error('Error sending migration email:', error);
    // Don't throw - email failure shouldn't block migration
  }
};

export default { sendMigrateDataMail };
