package com.snaplog.forensic.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel

class AuthViewModel : ViewModel() {

    var examinerName by mutableStateOf("")
        private set
    var department by mutableStateOf("")
        private set
    var isLoggedIn by mutableStateOf(false)
        private set

    fun login(name: String, dept: String) {
        examinerName = name
        department = dept
        isLoggedIn = true
    }

    fun logout() {
        isLoggedIn = false
        examinerName = ""
        department = ""
    }
}
