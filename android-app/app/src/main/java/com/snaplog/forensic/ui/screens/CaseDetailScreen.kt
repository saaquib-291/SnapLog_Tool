package com.snaplog.forensic.ui.screens

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.snaplog.forensic.data.model.Case
import com.snaplog.forensic.ui.components.CaptureProgressBar
import com.snaplog.forensic.ui.components.PlatformTile
import com.snaplog.forensic.ui.components.SubjectProfileCard
import com.snaplog.forensic.viewmodel.CaptureViewModel
import com.snaplog.forensic.viewmodel.CaseViewModel

private val platforms = listOf(
    "Instagram" to "https://www.instagram.com/accounts/login/",
    "Facebook" to "https://www.facebook.com/login/",
    "Twitter / X" to "https://x.com/i/flow/login",
    "Telegram" to "https://web.telegram.org/",
    "WhatsApp" to "https://web.whatsapp.com/",
    "Google account" to "https://accounts.google.com/"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseDetailScreen(
    caseId: String,
    caseViewModel: CaseViewModel,
    captureViewModel: CaptureViewModel,
    onBack: () -> Unit
) {
    var case by remember { mutableStateOf<Case?>(null) }
    var webViewUrl by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(caseId) {
        case = caseViewModel.getCaseById(caseId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text(case?.title ?: "Case detail", style = MaterialTheme.typography.titleMedium)
                        if (case != null) {
                            Text(
                                case!!.caseNumber, 
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                case?.let {
                    item {
                        SubjectProfileCard(case = it)
                    }
                }

                item {
                    Text(
                        "Platforms", 
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }

                items(platforms) { (platformName, url) ->
                    PlatformTile(
                        platform = platformName,
                        isCapturing = captureViewModel.activePlatform == platformName,
                        onOpenClick = { webViewUrl = url },
                        onStopClick = { captureViewModel.stopCapture() } // Assuming stopCapture exists or will be added
                    )
                }

                captureViewModel.progress?.let { progress ->
                    item {
                        Spacer(Modifier.height(8.dp))
                        CaptureProgressBar(sectionLabel = progress.section, percent = progress.percent)
                    }
                }
            }

            // WebView Overlay
            webViewUrl?.let { url ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background)
                ) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shadowElevation = 4.dp,
                            color = MaterialTheme.colorScheme.surface
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(8.dp)
                                    .fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "Platform Login",
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.padding(start = 8.dp)
                                )
                                IconButton(onClick = { webViewUrl = null }) {
                                    Icon(Icons.Default.Close, contentDescription = "Exit WebView")
                                }
                            }
                        }
                        
                        AndroidView(
                            factory = { context ->
                                WebView(context).apply {
                                    layoutParams = android.view.ViewGroup.LayoutParams(
                                        android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                                        android.view.ViewGroup.LayoutParams.MATCH_PARENT
                                    )
                                    webViewClient = WebViewClient()
                                    settings.apply {
                                        javaScriptEnabled = true
                                        domStorageEnabled = true
                                        setSupportZoom(true)
                                        builtInZoomControls = true
                                        displayZoomControls = false
                                        loadWithOverviewMode = true
                                        useWideViewPort = true
                                    }
                                    loadUrl(url)
                                }
                            },
                            modifier = Modifier.weight(1f).fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}
