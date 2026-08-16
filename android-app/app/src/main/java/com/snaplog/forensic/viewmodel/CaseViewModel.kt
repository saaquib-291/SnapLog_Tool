package com.snaplog.forensic.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.snaplog.forensic.data.model.Case
import com.snaplog.forensic.data.repository.CaseRepository
import com.snaplog.forensic.data.repository.MockCaseRepository
import kotlinx.coroutines.launch

class CaseViewModel(
    private val repository: CaseRepository = MockCaseRepository()
) : ViewModel() {

    var cases by mutableStateOf<List<Case>>(emptyList())
        private set
    var isLoading by mutableStateOf(false)
        private set

    init {
        loadCases()
    }

    fun loadCases() {
        viewModelScope.launch {
            isLoading = true
            cases = repository.getAllCases()
            isLoading = false
        }
    }

    fun addCase(title: String, caseNumber: String, date: String) {
        viewModelScope.launch {
            val newCase = Case(
                id = "CASE-${System.currentTimeMillis()}",
                title = title,
                caseNumber = caseNumber,
                date = date
            )
            repository.addCase(newCase)
            loadCases()
        }
    }

    suspend fun getCaseById(id: String): Case? = repository.getCaseById(id)
}
