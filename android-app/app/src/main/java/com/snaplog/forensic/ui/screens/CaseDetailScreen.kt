package com.snaplog.forensic.ui.screens

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Launch
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import android.net.Uri
import android.widget.Toast
import com.snaplog.forensic.data.model.Case
import com.snaplog.forensic.permissions.PermissionHelper
import com.snaplog.forensic.ui.components.CaptureProgressBar
import com.snaplog.forensic.ui.components.PermissionDashboard
import com.snaplog.forensic.ui.components.PlatformTile
import com.snaplog.forensic.ui.components.SubjectProfileCard
import com.snaplog.forensic.viewmodel.CaptureViewModel
import com.snaplog.forensic.viewmodel.CaseViewModel

private val platforms = listOf(
    "Instagram" to listOf("com.instagram.android", "com.instagram.lite"),
    "Facebook" to listOf("com.facebook.katana", "com.facebook.lite"),
    "Twitter / X" to listOf("com.twitter.android"),
    "Telegram" to listOf("org.telegram.messenger", "org.thunderdog.challegram"),
    "WhatsApp" to listOf("com.whatsapp", "com.whatsapp.w4b"),
    "Google account" to listOf("com.google.android.googlequicksearchbox", "com.android.chrome")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseDetailScreen(
    caseId: String,
    caseViewModel: CaseViewModel,
    captureViewModel: CaptureViewModel,
    onBack: () -> Unit,
    onViewEvidence: () -> Unit
) {
    val context = LocalContext.current
    var case by remember { mutableStateOf<Case?>(null) }
    var isAccessibilityEnabled by remember { mutableStateOf(PermissionHelper.isAccessibilityServiceEnabled(context)) }

    val mediaProjectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    val projectionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            captureViewModel.startMediaProjectionService(context, result.resultCode, result.data!!)
            Toast.makeText(context, "Capture Service Started", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(context, "Capture Permission Denied", Toast.LENGTH_SHORT).show()
        }
    }

    LaunchedEffect(caseId) {
        val foundCase = caseViewModel.getCaseById(caseId)
        if (foundCase == null) {
            android.util.Log.e("CaseDetail", "Case NOT found for ID: $caseId")
            // Handle error or back
        }
        case = foundCase
        captureViewModel.bindCaptureService(context)
    }

    DisposableEffect(Unit) {
        onDispose {
            captureViewModel.unbindCaptureService(context)
        }
    }

    SideEffect {
        isAccessibilityEnabled = PermissionHelper.isAccessibilityServiceEnabled(context)
    }

    fun openExternalApp(packageNames: List<String>) {
        val packageManager = context.packageManager
        var launchIntent: Intent? = null
        var targetPkg: String = packageNames.first()

        for (pkg in packageNames) {
            launchIntent = packageManager.getLaunchIntentForPackage(pkg)
            if (launchIntent != null) {
                targetPkg = pkg
                break
            }
        }

        if (launchIntent != null) {
            context.startActivity(launchIntent)
        } else {
            try {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$targetPkg")))
            } catch (e: Exception) {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$targetPkg")))
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(case?.title ?: "Loading case...", style = MaterialTheme.typography.titleMedium)
                        case?.let {
                            Text(
                                it.caseNumber,
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
                actions = {
                    IconButton(onClick = onViewEvidence) {
                        Icon(Icons.Default.Visibility, contentDescription = "View Evidence")
                    }
                }
            )
        },
        floatingActionButton = {
            Column(horizontalAlignment = Alignment.End) {
                if (captureViewModel.isServiceBound) {
                    ExtendedFloatingActionButton(
                        onClick = {
                            captureViewModel.captureManualScreenshot(context, caseId)
                        },
                        icon = { Icon(Icons.Default.CameraAlt, contentDescription = null) },
                        text = { Text("Take Screenshot") },
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                    Spacer(Modifier.height(8.dp))
                }

                ExtendedFloatingActionButton(
                    onClick = {
                        try {
                            projectionLauncher.launch(mediaProjectionManager.createScreenCaptureIntent())
                        } catch (e: Exception) {
                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    },
                    icon = { Icon(Icons.AutoMirrored.Filled.Launch, contentDescription = null) },
                    text = { Text(if (captureViewModel.isServiceBound) "Restart Service" else "Start Capture Service") }
                )
            }
        }
    ) { padding ->
        if (case == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    SubjectProfileCard(case = case!!)
                }

                item {
                    PermissionDashboard(
                        isAccessibilityEnabled = isAccessibilityEnabled,
                        isCaptureServiceActive = captureViewModel.isServiceBound
                    )
                }

                item {
                    Text(
                        "Platforms",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }

                items(platforms) { (platformName, packageNames) ->
                    PlatformTile(
                        platform = platformName,
                        isCapturing = captureViewModel.activePlatform == platformName,
                        onOpenClick = { openExternalApp(packageNames) },
                        onStopClick = { captureViewModel.stopCapture() }
                    )
                }

                captureViewModel.progress?.let { progress ->
                    item {
                        Spacer(Modifier.height(8.dp))
                        CaptureProgressBar(sectionLabel = progress.section, percent = progress.percent)
                    }
                }

                item {
                    Spacer(Modifier.height(120.dp)) // Extra space for multi-FAB
                }
            }
        }
    }
}
