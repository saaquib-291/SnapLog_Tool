package com.snaplog.forensic.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = NavyPrimary,
    onPrimary = Color.White,
    primaryContainer = TealLight,
    onPrimaryContainer = NavyPrimary,
    secondary = TealAccent,
    onSecondary = Color.White,
    background = SurfaceLight,
    surface = Color.White,
    onSurface = NavyPrimary,
    onSurfaceVariant = GrayText,
    error = ErrorRed,
    outlineVariant = Color(0xFFE0E0E0)
)

private val DarkColors = darkColorScheme(
    primary = TealAccent,
    onPrimary = Color.Black,
    primaryContainer = NavyPrimary,
    onPrimaryContainer = Color.White,
    secondary = NavyPrimary,
    onSecondary = Color.White,
    background = SurfaceDark,
    surface = Color(0xFF1E1E1E),
    onSurface = Color.White,
    onSurfaceVariant = Color(0xFFB0B0B0),
    error = ErrorRed,
    outlineVariant = Color(0xFF333333)
)

@Composable
fun SnapLogTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = SnapLogTypography,
        content = content
    )
}
