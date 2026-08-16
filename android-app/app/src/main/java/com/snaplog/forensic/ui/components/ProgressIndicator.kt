package com.snaplog.forensic.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun CaptureProgressBar(sectionLabel: String, percent: Int) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text("Capturing: $sectionLabel", style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { percent / 100f },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(2.dp))
        Text("$percent%", style = MaterialTheme.typography.labelSmall)
    }
}
