package com.snaplog.forensic.viewmodel

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.snaplog.forensic.capture.MediaProjectionService
import com.snaplog.forensic.capture.ScreenshotSaver
import com.snaplog.forensic.data.repository.CaptureProgress
import com.snaplog.forensic.data.repository.CaptureRepository
import com.snaplog.forensic.data.repository.MockCaptureRepository
import kotlinx.coroutines.launch

class CaptureViewModel(
    private val repository: CaptureRepository = MockCaptureRepository()
) : ViewModel() {

    var activePlatform by mutableStateOf<String?>(null)
        private set
    var progress by mutableStateOf<CaptureProgress?>(null)
        private set

    private var captureService: MediaProjectionService? = null
    var isServiceBound by mutableStateOf(false)
        private set

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as MediaProjectionService.LocalBinder
            captureService = binder.getService()
            isServiceBound = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            captureService = null
            isServiceBound = false
        }
    }

    fun bindCaptureService(context: Context) {
        val intent = Intent(context, MediaProjectionService::class.java)
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    fun unbindCaptureService(context: Context) {
        if (isServiceBound) {
            context.unbindService(serviceConnection)
            isServiceBound = false
        }
    }

    fun startMediaProjectionService(context: Context, resultCode: Int, data: Intent) {
        val intent = Intent(context, MediaProjectionService::class.java).apply {
            putExtra(MediaProjectionService.EXTRA_RESULT_CODE, resultCode)
            putExtra(MediaProjectionService.EXTRA_DATA, data)
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        bindCaptureService(context)
    }

    fun captureManualScreenshot(context: Context, caseId: String) {
        viewModelScope.launch {
            if (captureService == null) {
                android.util.Log.e("CaptureViewModel", "Capture service not bound!")
                return@launch
            }
            val bitmap = captureService?.captureScreenshot()
            if (bitmap != null) {
                val result = ScreenshotSaver.saveScreenshot(context, bitmap, caseId)
                if (result != null) {
                    android.util.Log.i("CaptureViewModel", "Screenshot saved: ${result.first}")
                }
            } else {
                android.util.Log.e("CaptureViewModel", "Failed to capture bitmap")
            }
        }
    }

    fun startCapture(caseId: String, platform: String) {
        activePlatform = platform
        progress = null
        viewModelScope.launch {
            repository.startCapture(caseId, platform).collect { update ->
                progress = update
            }
            activePlatform = null
        }
    }

    fun stopCapture() {
        // Implementation for stopping capture if supported by repository
        activePlatform = null
        progress = null
    }
}
