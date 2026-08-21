package com.snaplog.forensic.capture

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.*

/**
 * Utility to save captured screenshots as PNGs and calculate hashes.
 */
object ScreenshotSaver {

    private const val TAG = "ScreenshotSaver"

    /**
     * Saves a bitmap to the app's internal storage.
     * @return The absolute path of the saved file and its SHA-256 hash.
     */
    fun saveScreenshot(context: Context, bitmap: Bitmap, caseId: String): Pair<String, String>? {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmssSSS", Locale.US).format(Date())
        val fileName = "screenshot_${caseId}_$timestamp.png"
        val directory = File(context.filesDir, "evidence/$caseId")

        if (!directory.exists()) {
            directory.mkdirs()
        }

        val file = File(directory, fileName)
        return try {
            val out = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.flush()
            out.close()

            val hash = calculateSha256(file)
            Log.d(TAG, "Saved screenshot: ${file.absolutePath}, Hash: $hash")
            Pair(file.absolutePath, hash)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save screenshot", e)
            null
        }
    }

    private fun calculateSha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = file.readBytes()
        val hashBytes = digest.digest(bytes)
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
}
