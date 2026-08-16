package com.snaplog.forensic.data.model

data class Case(
    val id: String,
    val title: String,
    val caseNumber: String,
    val date: String,
    val subjectName: String? = null,
    val subjectType: String? = null, // "Accused" or "Victim"
    val platformsCaptured: List<String> = emptyList()
)
