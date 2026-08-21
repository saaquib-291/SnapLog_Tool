package com.snaplog.forensic.core

import android.graphics.Rect
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Helper to search and read the accessibility node tree.
 */
object NodeTreeReader {

    /**
     * Finds a node by its resource ID.
     */
    fun findNodeById(root: AccessibilityNodeInfo, resourceId: String): AccessibilityNodeInfo? {
        val nodes = root.findAccessibilityNodeInfosByViewId(resourceId)
        return nodes?.firstOrNull()
    }

    /**
     * Finds a node by its text content.
     */
    fun findNodeByText(root: AccessibilityNodeInfo, text: String): AccessibilityNodeInfo? {
        val nodes = root.findAccessibilityNodeInfosByText(text)
        return nodes?.firstOrNull { it.text?.toString()?.contains(text, ignoreCase = true) == true }
    }

    /**
     * Gets the screen bounds of a node.
     */
    fun getNodeBounds(node: AccessibilityNodeInfo): Rect {
        val rect = Rect()
        node.getBoundsInScreen(rect)
        return rect
    }

    /**
     * Debug helper to print the node tree.
     */
    fun logNodeTree(node: AccessibilityNodeInfo, depth: Int = 0) {
        val indent = "  ".repeat(depth)
        val info = "[${node.className}] ID: ${node.viewIdResourceName}, Text: ${node.text}, Desc: ${node.contentDescription}"
        println("$indent$info")

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            logNodeTree(child, depth + 1)
        }
    }
}
