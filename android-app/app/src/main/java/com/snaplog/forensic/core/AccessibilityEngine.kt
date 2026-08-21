package com.snaplog.forensic.core

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Core service for native app interaction using Android Accessibility API.
 */
class AccessibilityEngine : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        // Log events for debugging and node exploration
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            Log.d(TAG, "Window changed: ${event.packageName}")
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service Interrupted")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "Accessibility Service Connected")
    }

    /**
     * Helper to get the current root node.
     */
    fun getRootNode(): AccessibilityNodeInfo? = rootInActiveWindow

    companion object {
        private const val TAG = "AccessibilityEngine"
    }
}
