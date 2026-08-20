package com.snaplog.forensic.capture

import android.content.Context
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform

/**
 * Bridge to the embedded Python interpreter (Chaquopy). Everything runs
 * in-process on the device — no network, no server, no cable required.
 * The report-pipeline scripts (report_generator.py, hash_utils.py, etc.)
 * get copied into src/main/python/ and called through this same pattern.
 */
object PythonBridge {

    fun ensureStarted(context: Context) {
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(context))
        }
    }

    // Phase 1 sanity check only — proves the Python runtime is wired up
    // correctly before we bring in ReportLab and the real pipeline.
    fun sayHello(context: Context): String {
        ensureStarted(context)
        val module = Python.getInstance().getModule("hello")
        return module.callAttr("greet").toString()
    }
}
