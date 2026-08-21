package com.snaplog.forensic.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "cases")
data class CaseEntity(
    @PrimaryKey val caseId: String = UUID.randomUUID().toString(),
    val caseName: String,
    val examinerName: String,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String = "OPEN"
)
