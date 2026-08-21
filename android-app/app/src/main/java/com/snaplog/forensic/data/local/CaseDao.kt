package com.snaplog.forensic.data.local

import androidx.room.*
import com.snaplog.forensic.data.local.entities.CaseEntity
import com.snaplog.forensic.data.local.entities.ScreenshotEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CaseDao {
    @Query("SELECT * FROM cases ORDER BY timestamp DESC")
    fun getAllCases(): Flow<List<CaseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCase(case: CaseEntity)

    @Delete
    suspend fun deleteCase(case: CaseEntity)

    @Query("SELECT * FROM screenshots WHERE case_id = :caseId ORDER BY sequence_number ASC")
    fun getScreenshotsForCase(caseId: String): Flow<List<ScreenshotEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScreenshot(screenshot: ScreenshotEntity)
}
