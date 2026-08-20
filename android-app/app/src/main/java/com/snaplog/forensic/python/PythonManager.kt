package com.snaplog.forensic.report

import android.content.Context
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform

object PythonManager {

    fun getPython(context: Context): Python {
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(context))
        }

        return Python.getInstance()
    }
}