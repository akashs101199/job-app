import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to verify auto-apply is enabled
 */
export async function autoApplyRequireEnabled(req, res, next) {
  try {
    const userId = req.user?.email;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const config = await prisma.autoApplyConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.enabled) {
      return res.status(403).json({
        error: 'Auto-apply is not enabled',
        message: 'Please enable auto-apply in settings first',
      });
    }

    // Attach config to request for use in handler
    req.autoApplyConfig = config;
    next();
  } catch (error) {
    console.error('Error in autoApplyRequireEnabled middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to verify auto-apply config exists
 */
export async function autoApplyRequireConfig(req, res, next) {
  try {
    const userId = req.user?.email;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const config = await prisma.autoApplyConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      return res.status(400).json({
        error: 'Auto-apply configuration not found',
        message: 'Please initialize auto-apply configuration first',
      });
    }

    // Attach config to request for use in handler
    req.autoApplyConfig = config;
    next();
  } catch (error) {
    console.error('Error in autoApplyRequireConfig middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default {
  autoApplyRequireEnabled,
  autoApplyRequireConfig,
};
