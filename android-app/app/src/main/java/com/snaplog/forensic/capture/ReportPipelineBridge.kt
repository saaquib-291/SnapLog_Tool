package com.snaplog.forensic.capture

import android.content.Context
import com.chaquo.python.Python
import com.chaquo.python.PyObject
import com.chaquo.python.android.AndroidPlatform

/**
 * Bridge to call the shared Python reporting pipeline via Chaquopy.
 */
class ReportPipelineBridge(context: Context) {

    init {
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(context))
        }
    }

    /**
     * Generates a forensic report by calling report_generator.py.
     * @param dbPath Path to the Room database file.
     * @param imageDir Directory where screenshots are stored.
     * @param caseInfo Map containing case metadata (case_id, examiner_name, etc.)
     * @return Absolute path to the generated PDF report.
     */
    fun generateReport(dbPath: String, imageDir: String, caseInfo: Map<String, String>): String {
        val py = Python.getInstance()
        val module = py.getModule("report_generator")
        val result: PyObject = module.callAttr(
            "generate_report_from_db",
            dbPath,
            imageDir,
            caseInfo
        )
        return result.toString()
    }
}
