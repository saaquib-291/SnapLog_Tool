package com.snaplog.forensic.data.repository

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class MockCaptureRepository : CaptureRepository {

    private val sections = listOf("Timeline", "Posts", "Messages", "Friends & followers", "Account info")

    override fun startCapture(caseId: String, platform: String): Flow<CaptureProgress> = flow {
        sections.forEachIndexed { index, section ->
            delay(600)
            val percent = ((index + 1) * 100) / sections.size
            emit(CaptureProgress(section = section, percent = percent, completed = index == sections.lastIndex))
        }
    }
}
