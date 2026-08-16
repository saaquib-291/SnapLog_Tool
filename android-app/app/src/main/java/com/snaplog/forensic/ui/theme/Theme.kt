package com.snaplog.forensic.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = NavyPrimary,
    secondary = TealAccent,
    background = SurfaceLight,
    surface = SurfaceLight,
    error = ErrorRed
)

private val DarkColors = darkColorScheme(
    primary = TealAccent,
    secondary = NavyPrimary,
    background = SurfaceDark,
    surface = SurfaceDark,
    error = ErrorRed
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
