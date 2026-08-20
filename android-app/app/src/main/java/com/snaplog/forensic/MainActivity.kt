package com.snaplog.forensic

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.snaplog.forensic.capture.PythonBridge
import com.snaplog.forensic.ui.navigation.AppNavHost
import com.snaplog.forensic.ui.theme.SnapLogTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("PythonBridge", PythonBridge.sayHello(this))
        setContent {
            SnapLogTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AppNavHost()
                }
            }
        }
    }
}
