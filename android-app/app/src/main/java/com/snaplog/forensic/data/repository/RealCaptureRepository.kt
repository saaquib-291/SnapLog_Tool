package com.snaplog.forensic.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * Real implementation of [CaptureRepository] using native automation.
 * To be implemented in Phase 6.
 */
class RealCaptureRepository : CaptureRepository {
    override fun startCapture(caseId: String, platform: String): Flow<CaptureProgress> = flow {
        // Implementation will chain AccessibilityEngine and MediaProjectionManager
    }
}
