package com.snaplog.forensic.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.snaplog.forensic.data.model.Case
import com.snaplog.forensic.ui.components.CaptureProgressBar
import com.snaplog.forensic.ui.components.PlatformButton
import com.snaplog.forensic.viewmodel.CaptureViewModel
import com.snaplog.forensic.viewmodel.CaseViewModel

private val platforms = listOf("Instagram", "Facebook", "Twitter / X", "Telegram", "WhatsApp", "Google account")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseDetailScreen(
    caseId: String,
    caseViewModel: CaseViewModel,
    captureViewModel: CaptureViewModel,
    onBack: () -> Unit
) {
    var case by remember { mutableStateOf<Case?>(null) }

    LaunchedEffect(caseId) {
        case = caseViewModel.getCaseById(caseId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(case?.title ?: "Case detail") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            case?.let {
                Text("${it.caseNumber} • ${it.date}", style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(20.dp))
            }

            Text("Select a platform to capture", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(12.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                platforms.forEach { platform ->
                    PlatformButton(
                        platform = platform,
                        isCapturing = captureViewModel.activePlatform == platform,
                        onClick = { captureViewModel.startCapture(caseId, platform) }
                    )
                }
            }

            captureViewModel.progress?.let { progress ->
                Spacer(Modifier.height(20.dp))
                CaptureProgressBar(sectionLabel = progress.section, percent = progress.percent)
            }
        }
    }
}
