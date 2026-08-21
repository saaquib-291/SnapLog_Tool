package com.snaplog.forensic.core

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect

/**
 * Helper to build and dispatch gestures via AccessibilityService.
 */
object GestureUtils {

    /**
     * Dispatches a tap at the center of the given rect.
     */
    fun tap(service: AccessibilityService, bounds: Rect, callback: AccessibilityService.GestureResultCallback? = null) {
        val x = bounds.centerX().toFloat()
        val y = bounds.centerY().toFloat()
        val path = Path().apply {
            moveTo(x, y)
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
            .build()
        service.dispatchGesture(gesture, callback, null)
    }

    /**
     * Dispatches a swipe (scroll) from bottom to top.
     */
    fun scrollDown(service: AccessibilityService, callback: AccessibilityService.GestureResultCallback? = null) {
        val metrics = service.resources.displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels

        val startX = width / 2f
        val startY = height * 0.8f
        val endY = height * 0.2f

        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(startX, endY)
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 500))
            .build()
        service.dispatchGesture(gesture, callback, null)
    }
}
