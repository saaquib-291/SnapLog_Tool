/**
 * shared/constants.kt
 *
 * Kotlin constants for the SnapLog Android app.
 * Manually kept in sync with constants.json and section_enum.json.
 *
 * IMPORTANT: If you change constants.json or section_enum.json,
 * you MUST update this file to match, and vice versa.
 * Announce any changes to the team.
 */

package com.snaplog.shared

/**
 * Canonical section names for evidence capture.
 * Must match exactly the values in section_enum.json.
 */
enum class Section(val id: String, val displayName: String) {
    TIMELINE("timeline", "Timeline / Feed"),
    POSTS("posts", "Posts / Media"),
    MESSAGES("messages", "Messages / Chat"),
    FRIENDS("friends", "Friends List"),
    FOLLOWERS("followers", "Followers List"),
    FOLLOWING("following", "Following List"),
    ACCOUNT_INFO("account_info", "Account Information / Profile");

    companion object {
        /**
         * Look up a Section by its string ID.
         * @param id Section string ID (e.g. "timeline")
         * @return Section enum value, or null if not found
         */
        fun fromId(id: String): Section? = entries.find { it.id == id }

        /** All valid section ID strings */
        val allIds: List<String> = entries.map { it.id }
    }
}

/**
 * Supported social media platforms.
 * Must match exactly the platforms array in constants.json.
 */
data class Platform(
    val id: String,
    val displayName: String,
    val supportedSections: List<Section>
)

/**
 * Operating system enum for the metadata schema.
 */
enum class CaptureOS(val id: String) {
    WINDOWS("windows"),
    ANDROID("android")
}

/**
 * Pre-populated platform definitions matching constants.json.
 */
object SnapLogConstants {

    val PLATFORMS: List<Platform> = listOf(
        Platform(
            id = "instagram",
            displayName = "Instagram",
            supportedSections = listOf(
                Section.TIMELINE, Section.POSTS, Section.FOLLOWERS,
                Section.FOLLOWING, Section.ACCOUNT_INFO, Section.MESSAGES
            )
        ),
        Platform(
            id = "facebook",
            displayName = "Facebook",
            supportedSections = listOf(
                Section.TIMELINE, Section.POSTS, Section.FRIENDS,
                Section.ACCOUNT_INFO, Section.MESSAGES
            )
        ),
        Platform(
            id = "twitter",
            displayName = "Twitter / X",
            supportedSections = listOf(
                Section.TIMELINE, Section.POSTS, Section.FOLLOWERS,
                Section.FOLLOWING, Section.ACCOUNT_INFO, Section.MESSAGES
            )
        ),
        Platform(
            id = "whatsapp",
            displayName = "WhatsApp Web / Mobile",
            supportedSections = listOf(
                Section.MESSAGES, Section.ACCOUNT_INFO
            )
        ),
        Platform(
            id = "telegram",
            displayName = "Telegram Web / Mobile",
            supportedSections = listOf(
                Section.MESSAGES, Section.ACCOUNT_INFO
            )
        ),
        Platform(
            id = "google",
            displayName = "Google Account / History",
            supportedSections = listOf(
                Section.TIMELINE, Section.ACCOUNT_INFO
            )
        )
    )

    /** All valid platform IDs */
    val PLATFORM_IDS: List<String> = PLATFORMS.map { it.id }

    /** All valid section names */
    val SECTIONS: List<String> = Section.allIds

    /**
     * Look up a platform by its ID.
     * @param id Platform ID (e.g. "instagram")
     * @return Platform object, or null if not found
     */
    fun getPlatformById(id: String): Platform? = PLATFORMS.find { it.id == id }

    /**
     * Check if a section name is valid.
     * @param section Section ID to validate
     * @return true if valid
     */
    fun isValidSection(section: String): Boolean = Section.fromId(section) != null

    /**
     * Check if a platform ID is valid.
     * @param platformId Platform ID to validate
     * @return true if valid
     */
    fun isValidPlatform(platformId: String): Boolean = PLATFORM_IDS.contains(platformId)

    /**
     * Get the supported sections for a given platform.
     * @param platformId Platform ID
     * @return List of supported Sections, or empty if platform not found
     */
    fun getSupportedSections(platformId: String): List<Section> =
        getPlatformById(platformId)?.supportedSections ?: emptyList()
}
