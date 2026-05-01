package com.example.recall

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.graphics.PixelFormat
import android.view.WindowManager
import android.view.LayoutInflater
import android.view.View
import android.os.Build
import androidx.compose.ui.platform.ComposeView
import android.app.NotificationChannel
import android.app.NotificationManager
import androidx.core.app.NotificationCompat

class FloatingWidgetService : Service() {
    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        // Setup Foreground Service Notification
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, "recall_channel")
            .setContentTitle("Recall Active")
            .setContentText("Listening for quick records")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .build()
        startForeground(1, notification)

        // Setup Floating Widget Layout
        val inflater = LayoutInflater.from(this)
        floatingView = inflater.inflate(R.layout.floating_widget_layout, null)

        val composeView = floatingView.findViewById<ComposeView>(R.id.compose_view)
        composeView.setContent {
            FloatingComposeUI(
                onRecordHold = {
                    // Start Whisper recording process here
                }
            )
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        windowManager.addView(floatingView, params)
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::floatingView.isInitialized) {
            windowManager.removeView(floatingView)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("recall_channel", "Recall Service", NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
