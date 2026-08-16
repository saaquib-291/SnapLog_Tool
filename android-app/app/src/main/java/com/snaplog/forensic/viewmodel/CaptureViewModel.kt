package com.snaplog.forensic.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
}
