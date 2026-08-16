package com.snaplog.forensic.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.snaplog.forensic.data.model.Case

@Composable
fun CaseCard(case: Case, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(case.title, style = MaterialTheme.typography.titleMedium)
            androidx.compose.foundation.layout.Spacer(Modifier.height(4.dp))
            Text(
                "${case.caseNumber} • ${case.date}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (case.platformsCaptured.isNotEmpty()) {
                androidx.compose.foundation.layout.Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    case.platformsCaptured.forEach { platform ->
                        AssistChip(onClick = {}, label = { Text(platform) })
                    }
                }
            }
        }
    }
}
