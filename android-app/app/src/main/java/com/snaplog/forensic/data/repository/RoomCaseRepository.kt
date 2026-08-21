package com.snaplog.forensic.data.repository

import com.snaplog.forensic.data.model.Case

/**
 * Implementation of [CaseRepository] using Room database.
 * To be implemented in Phase 5.
 */
class RoomCaseRepository : CaseRepository {
    override suspend fun getAllCases(): List<Case> = emptyList()
    override suspend fun getCaseById(id: String): Case? = null
    override suspend fun addCase(case: Case) {}
}
