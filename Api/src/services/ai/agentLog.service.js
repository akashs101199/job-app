const prisma = require('../../config/prisma');

const logAgentAction = async (userId, agentType, action, input, output, status, error = null) => {
  try {
    const log = await prisma.agentLog.create({
      data: {
        userId,
        agentType,
        action,
        input,
        output,
        status,
        error,
      },
    });

    return log;
  } catch (err) {
    console.error('Error logging agent action:', err);
    throw err;
  }
};

const getAgentLogs = async (userId, agentType = null) => {
  try {
    const logs = await prisma.agentLog.findMany({
      where: {
        userId,
        ...(agentType && { agentType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs;
  } catch (err) {
    console.error('Error retrieving agent logs:', err);
    throw err;
  }
};

module.exports = { logAgentAction, getAgentLogs };
