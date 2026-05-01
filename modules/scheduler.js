import { Storage } from './storage.js';
import { Bridges } from './bridges.js';

export const Scheduler = {
  timers: {},

  init() {
    this.requestPermission();
    this.schedulePending();
  },

  async requestPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
  },

  schedulePending() {
    const intents = Storage.getIntents();
    const now = new Date();

    intents.forEach(intent => {
      if (intent.status === 'pending') {
        const scheduled = new Date(intent.scheduledTime);
        const delay = scheduled.getTime() - now.getTime();

        if (delay <= 0) {
           // Missed intent, fire immediately or mark ready
           this.fireIntent(intent);
        } else {
           this.schedule(intent, delay);
        }
      }
    });
  },

  schedule(intent, delay) {
    // Clear existing timer if any
    if (this.timers[intent.id]) {
        clearTimeout(this.timers[intent.id]);
    }

    this.timers[intent.id] = setTimeout(() => {
        this.fireIntent(intent);
    }, delay);
  },

  fireIntent(intent) {
    Storage.updateIntentStatus(intent.id, 'ready');

    if ('Notification' in window && Notification.permission === 'granted') {
      const title = `Recall: Send to ${intent.contactName}`;
      const bridgeUrl = Bridges.getBridgeUrl(intent);
      const platformName = intent.preferredPlatform ? 
          intent.preferredPlatform.charAt(0).toUpperCase() + intent.preferredPlatform.slice(1) : 
          'WhatsApp';

      const options = {
        body: intent.messageContent,
        icon: '/pwa-192x192.png', // Assuming we generate this
        vibrate: [200, 100, 200],
        data: { 
            url: `/#intents`,
            bridgeUrl: bridgeUrl
        },
        actions: [
            { action: 'send', title: `Send via ${platformName}` },
            { action: 'review', title: 'Review in App' }
        ]
      };
      
      try {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
      } catch (e) {
         // Fallback to basic notification if SW fails
         new Notification(title, options);
      }
    } else {
        // Fallback: visual toast if app is open
        window.dispatchEvent(new CustomEvent('showToast', { detail: `Ready to send message to ${intent.contactName}` }));
    }
  }
};
