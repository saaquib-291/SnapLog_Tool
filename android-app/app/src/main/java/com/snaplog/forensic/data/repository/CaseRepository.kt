package com.snaplog.forensic.data.repository

import com.snaplog.forensic.data.model.Case

interface CaseRepository {
    suspend fun getAllCases(): List<Case>
    suspend fun getCaseById(id: String): Case?
    suspend fun addCase(case: Case)
}
