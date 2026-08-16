package com.snaplog.forensic.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.snaplog.forensic.ui.components.CaseCard
import com.snaplog.forensic.ui.components.ProfileIcon
import com.snaplog.forensic.viewmodel.AuthViewModel
import com.snaplog.forensic.viewmodel.CaseViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    authViewModel: AuthViewModel,
    caseViewModel: CaseViewModel,
    onCaseClick: (String) -> Unit,
    onProfileClick: () -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cases") },
                actions = {
                    ProfileIcon(
                        initials = authViewModel.examinerName.take(2).uppercase().ifBlank { "EX" },
                        onClick = onProfileClick
                    )
                    Spacer(Modifier.width(12.dp))
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add case")
            }
        }
    ) { padding ->
        if (caseViewModel.isLoading) {
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(caseViewModel.cases) { case ->
                    CaseCard(case = case, onClick = { onCaseClick(case.id) })
                }
            }
        }
    }

    if (showAddDialog) {
        AddCaseDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { title, number, date ->
                caseViewModel.addCase(title, number, date)
                showAddDialog = false
            }
        )
    }
}
