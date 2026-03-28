const prisma = require('../config/prisma');

const getRecordsByUser = (email) =>
  prisma.application.findMany({ where: { userId: email } });

const getJobIdsByUser = async (email) => {
  const apps = await prisma.application.findMany({
    where: { userId: email },
    select: { jobListingId: true },
  });
  return apps.map((a) => a.jobListingId);
};

const getJobIdsByStatus = async (email) => {
  const apps = await prisma.application.findMany({
    where: {
      userId: email,
      status: { in: ['Selected', 'Rejected'] },
    },
    select: { jobListingId: true },
  });
  return apps.map((a) => a.jobListingId);
};

const updateRecordStatus = async (email, id, value, platformName) => {
  const updatedRecord = await prisma.application.update({
    where: {
      userId_jobListingId: { userId: email, jobListingId: id },
    },
    data: { status: value },
  });

  if (value === 'Rejected' || value === 'Selected') {
    await prisma.performanceMetrics.update({
      where: {
        userId_platformName: { userId: email, platformName },
      },
      data:
        value === 'Rejected'
          ? { rejections: { increment: 1 } }
          : { interviews: { increment: 1 } },
    });
  }

  return updatedRecord;
};

const insertApplication = async ({
  email,
  jobId,
  status,
  dateApplied,
  dateUpdated,
  notes,
  jobTitle,
  employer_name,
  apply_link,
  publisher,
}) => {
  // Ensure platform exists
  await prisma.platformName.upsert({
    where: { platformName: publisher },
    update: {},
    create: { platformName: publisher, createdDate: new Date() },
  });

  // Create the application record
  const newApplication = await prisma.application.create({
    data: {
      userId: email,
      jobListingId: jobId,
      status,
      dateApplied: new Date(dateApplied),
      dateUpdated: dateUpdated ? new Date(dateUpdated) : null,
      notes: notes || null,
      jobName: jobTitle,
      companyName: employer_name,
      jobLink: apply_link,
      platformName: publisher,
    },
  });

  // Single upsert for performance metrics — fixes double-increment bug
  await prisma.performanceMetrics.upsert({
    where: {
      userId_platformName: { userId: email, platformName: publisher },
    },
    update: { jobsApplied: { increment: 1 } },
    create: {
      userId: email,
      platformName: publisher,
      totalJobsViewed: 0,
      jobsApplied: 1,
      rejections: 0,
      interviews: 0,
    },
  });

  return newApplication;
};

module.exports = {
  getRecordsByUser,
  getJobIdsByUser,
  getJobIdsByStatus,
  updateRecordStatus,
  insertApplication,
};
