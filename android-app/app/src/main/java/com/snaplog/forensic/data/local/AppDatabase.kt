package com.snaplog.forensic.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.snaplog.forensic.data.local.entities.CaseEntity
import com.snaplog.forensic.data.local.entities.ScreenshotEntity

@Database(entities = [CaseEntity::class, ScreenshotEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun caseDao(): CaseDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "forensic.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
