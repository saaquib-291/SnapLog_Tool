package com.snaplog.forensic.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.snaplog.forensic.data.local.entities.ScreenshotEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EvidenceViewerScreen(
    screenshots: List<ScreenshotEntity>,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Evidence Viewer") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        // Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                        Text("<")
                    }
                }
            )
        }
    ) { padding ->
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = padding,
            modifier = Modifier.fillMaxSize()
        ) {
            items(screenshots) { screenshot ->
                Card(
                    modifier = Modifier.padding(8.dp)
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text(text = "Seq: ${screenshot.sequence_number}", style = MaterialTheme.typography.labelSmall)
                        Text(text = "Hash: ${screenshot.sha256_hash.take(8)}...", style = MaterialTheme.typography.bodySmall)
                        // AsyncImage from Coil would go here to show the PNG
                    }
                }
            }
        }
    }
}
