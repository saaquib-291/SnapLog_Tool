package com.snaplog.forensic.data.repository

import kotlinx.coroutines.flow.Flow

data class CaptureProgress(
    val section: String,
    val percent: Int,
    val completed: Boolean
)

interface CaptureRepository {
    fun startCapture(caseId: String, platform: String): Flow<CaptureProgress>
}
