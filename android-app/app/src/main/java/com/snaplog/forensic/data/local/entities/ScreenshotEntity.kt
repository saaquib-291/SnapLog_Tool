package com.snaplog.forensic.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "screenshots")
data class ScreenshotEntity(
    @PrimaryKey val screenshot_id: String,
    val case_id: String,
    val examiner_id: String,
    val platform: String,
    val os: String = "android",
    val section: String,
    val sequence_number: Int,
    val timestamp: String,
    val sha256_hash: String,
    val file_path: String,
    val source_url_or_screen: String = ""
)
