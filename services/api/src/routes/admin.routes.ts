import { Router } from 'express';
import { requireRoles } from '../shared/authorization.middleware';
import { observabilityRegistry } from '../shared/observability';

const router = Router();

// Enforce strict isolated ADMIN authorization guard across all admin sub-routes
router.use(requireRoles(['ADMIN']));

/**
 * GET /api/v1/admin/health-metrics
 * System health, AI cost monitoring & token usage telemetry
 */
router.get('/health-metrics', (req, res) => {
  const metrics = observabilityRegistry.getMetricsSummary();
  res.json({
    statusCode: 200,
    metrics,
    systemStatus: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

import { featureFlagManager } from '../shared/featureFlags';

/**
 * GET /api/v1/admin/feature-flags
 * Dynamic admin feature flag management
 */
router.get('/feature-flags', (req, res) => {
  res.json({
    statusCode: 200,
    flags: featureFlagManager.getFlags(),
  });
});

/**
 * PUT /api/v1/admin/feature-flags
 * Dynamic admin feature flag toggle
 */
router.put('/feature-flags', (req, res) => {
  const updated = featureFlagManager.updateFlags(req.body);
  res.json({
    statusCode: 200,
    message: 'Feature flags updated successfully',
    flags: updated,
  });
});

/**
 * POST /api/v1/admin/content-review
 * NCTB curriculum content review & ingestion approval
 */
router.post('/content-review', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Content review processed successfully',
    reviewedBy: (req as any).user?.userId,
  });
});

export default router;
