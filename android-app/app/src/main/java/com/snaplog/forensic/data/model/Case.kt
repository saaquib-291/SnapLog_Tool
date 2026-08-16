package com.snaplog.forensic.data.model

data class Case(
    val id: String,
    val title: String,
    val caseNumber: String,
    val date: String,
    val platformsCaptured: List<String> = emptyList()
)
