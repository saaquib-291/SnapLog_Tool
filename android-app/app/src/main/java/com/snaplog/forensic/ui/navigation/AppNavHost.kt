package com.snaplog.forensic.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.snaplog.forensic.ui.screens.CaseDetailScreen
import com.snaplog.forensic.ui.screens.DashboardScreen
import com.snaplog.forensic.ui.screens.LoginScreen
import com.snaplog.forensic.ui.screens.ProfileScreen
import com.snaplog.forensic.viewmodel.AuthViewModel
import com.snaplog.forensic.viewmodel.CaptureViewModel
import com.snaplog.forensic.viewmodel.CaseViewModel

@Composable
fun AppNavHost(navController: NavHostController = rememberNavController()) {
    val authViewModel: AuthViewModel = viewModel()
    val caseViewModel: CaseViewModel = viewModel()
    val captureViewModel: CaptureViewModel = viewModel()

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("dashboard") {
            DashboardScreen(
                authViewModel = authViewModel,
                caseViewModel = caseViewModel,
                onCaseClick = { caseId -> navController.navigate("case_detail/$caseId") },
                onProfileClick = { navController.navigate("profile") }
            )
        }
        composable("case_detail/{caseId}") { backStackEntry ->
            val caseId = backStackEntry.arguments?.getString("caseId") ?: return@composable
            CaseDetailScreen(
                caseId = caseId,
                caseViewModel = caseViewModel,
                captureViewModel = captureViewModel,
                onBack = { navController.popBackStack() }
            )
        }
        composable("profile") {
            ProfileScreen(
                authViewModel = authViewModel,
                onBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate("login") {
                        popUpTo(0)
                    }
                }
            )
        }
    }
}
