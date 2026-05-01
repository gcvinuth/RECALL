package com.example.recall

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp

@Composable
fun FloatingComposeUI(onRecordHold: () -> Unit) {
    var isRecording by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .size(72.dp)
            .clip(CircleShape)
            .background(Color(0xCC121212)) // Glassmorphism Dark Theme
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isRecording = true
                        onRecordHold()
                        tryAwaitRelease()
                        isRecording = false
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            painter = painterResource(id = android.R.drawable.ic_btn_speak_now),
            contentDescription = "Record",
            tint = if (isRecording) Color(0xFF007AFF) else Color.White,
            modifier = Modifier.size(36.dp)
        )
    }
}
