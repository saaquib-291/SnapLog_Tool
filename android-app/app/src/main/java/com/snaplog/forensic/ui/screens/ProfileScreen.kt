package com.snaplog.forensic.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.snaplog.forensic.permissions.PermissionHelper
import com.snaplog.forensic.ui.components.SettingsQuickAccess
import com.snaplog.forensic.viewmodel.AuthViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel,
    onBack: () -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
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
            Text("Examiner", style = MaterialTheme.typography.bodyMedium)
            Text(authViewModel.examinerName, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(12.dp))
            Text("Department", style = MaterialTheme.typography.bodyMedium)
            Text(authViewModel.department, style = MaterialTheme.typography.titleMedium)

            Spacer(Modifier.height(24.dp))
            SettingsQuickAccess(
                onOpenAccessibility = { PermissionHelper.launchAccessibilitySettings(context) },
                onOpenAppSettings = { PermissionHelper.launchAppSettings(context) },
                onViewAppInfo = { PermissionHelper.launchAppSettings(context) }
            )

            Spacer(Modifier.height(32.dp))
            Button(
                onClick = {
                    authViewModel.logout()
                    onLogout()
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Logout")
            }
        }
    }
}
