package com.snaplog.forensic.data.repository

import com.snaplog.forensic.data.model.Case
import kotlinx.coroutines.delay

class MockCaseRepository : CaseRepository {

    private val cases = mutableListOf(
        Case(
            id = "CASE2026-001",
            title = "State vs. Sharma",
            caseNumber = "FIR-2026-0451",
            date = "12 Aug 2026",
            subjectName = "Rajesh Sharma",
            subjectType = "Accused",
            platformsCaptured = listOf("Instagram", "WhatsApp")
        ),
        Case(
            id = "CASE2026-002",
            title = "Cyber Fraud Investigation",
            caseNumber = "FIR-2026-0398",
            date = "05 Aug 2026",
            subjectName = "Amit Kumar",
            subjectType = "Victim",
            platformsCaptured = listOf("Telegram")
        ),
        Case(
            id = "CASE2026-003",
            title = "Missing Persons - Rao",
            caseNumber = "FIR-2026-0512",
            date = "14 Aug 2026",
            subjectName = "Suresh Rao",
            subjectType = "Victim",
            platformsCaptured = emptyList()
        )
    )

    override suspend fun getAllCases(): List<Case> {
        delay(300)
        return cases.toList()
    }

    override suspend fun getCaseById(id: String): Case? {
        delay(150)
        return cases.find { it.id == id }
    }

    override suspend fun addCase(case: Case) {
        delay(200)
        cases.add(0, case)
    }
}
