package com.snaplog.forensic.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.snaplog.forensic.ui.theme.SnapLogTheme
import com.snaplog.forensic.data.model.Case

@Composable
fun SubjectProfileCard(case: Case) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(32.dp),
                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            
            Spacer(Modifier.width(16.dp))
            
            Column {
                Text(
                    text = case.subjectName ?: "Unknown Subject",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Badge(
                        containerColor = if (case.subjectType == "Accused") 
                            MaterialTheme.colorScheme.errorContainer 
                        else 
                            MaterialTheme.colorScheme.secondaryContainer
                    ) {
                        Text(
                            text = case.subjectType ?: "Unknown",
                            modifier = Modifier.padding(horizontal = 4.dp),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "ID: ${case.id.takeLast(8)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun SubjectProfileCardPreview() {
    SnapLogTheme {
        Box(Modifier.padding(16.dp)) {
            SubjectProfileCard(
                case = Case(
                    id = "CASE-123",
                    title = "Sample Case",
                    caseNumber = "FIR-2026-001",
                    date = "16 Aug 2026",
                    subjectName = "Rajesh Sharma",
                    subjectType = "Accused",
                    platformsCaptured = emptyList()
                )
            )
        }
    }
}
