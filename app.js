// app.js
import { Haptics } from './modules/haptics.js';
import { Storage } from './modules/storage.js';
import { Bridges } from './modules/bridges.js';
import { Parser } from './modules/parser.js';
import { Recorder } from './modules/recorder.js';
import { Scheduler } from './modules/scheduler.js';

const App = {
  init() {
    this.bindEvents();
    this.handleRoute();
    Scheduler.init();
    this.renderPeople();
    this.renderIntents();

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  },

  bindEvents() {
    // Navigation
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Recording
    const recordBtn = document.getElementById('recordBtn');
    const statusText = document.getElementById('statusText');
    
    // Hold to record pattern for touch & mouse
    const startRecord = (e) => {
        e.preventDefault();
        recordBtn.classList.add('recording');
        statusText.textContent = "Listening...";
        Recorder.start(
            // Live result (not used in this simplified version since continuous=false)
            (text) => { statusText.textContent = `"${text}"`; },
            // End callback
            () => this.processRecording()
        );
    };

    const stopRecord = (e) => {
        e.preventDefault();
        if(Recorder.isRecording) {
            recordBtn.classList.remove('recording');
            statusText.textContent = "Processing...";
            Recorder.stop();
        }
    };

    recordBtn.addEventListener('pointerdown', startRecord);
    window.addEventListener('pointerup', stopRecord);
    // Prevent context menu on long press
    recordBtn.addEventListener('contextmenu', e => e.preventDefault());

    // Custom Events
    window.addEventListener('contactsUpdated', () => this.renderPeople());
    window.addEventListener('intentsUpdated', () => this.renderIntents());
    window.addEventListener('showToast', (e) => this.showToast(e.detail));
  },

  handleRoute() {
    const hash = window.location.hash || '#home';
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const viewId = hash.substring(1) + 'View';
    const view = document.getElementById(viewId);
    if (view) view.classList.add('active');
    
    const nav = document.querySelector(`.nav-item[href="${hash}"]`);
    if (nav) nav.classList.add('active');
  },

  processRecording() {
      const statusText = document.getElementById('statusText');
      // Wait a tiny bit for the final transcript from Speech API
      setTimeout(() => {
          // If we had a real callback with the final text, we'd use it here.
          // Since continuous is false, the onresult callback fires once at the end usually.
          // We need a slight modification to recorder to store the last result.
          // For now, let's assume Recorder gives it to us or we update statusText directly.
          const text = statusText.textContent.replace(/^"|"$/g, '');
          
          if (text === "Listening..." || text === "Processing...") {
              statusText.textContent = "Hold to speak";
              return;
          }

          try {
              const parsed = Parser.parse(text);
              this.saveParsedResult(parsed);
              Haptics.success();
              statusText.textContent = "Saved!";
              setTimeout(() => { statusText.textContent = "Hold to speak"; }, 2000);
          } catch(e) {
              console.error(e);
              Haptics.error();
              statusText.textContent = "Could not parse.";
              setTimeout(() => { statusText.textContent = "Hold to speak"; }, 2000);
          }
      }, 500);
  },

  saveParsedResult(parsed) {
      if (!parsed.contactName) return; // Ignore if no contact found

      const contact = {
          name: parsed.contactName,
          notes: parsed.contextualNotes ? [parsed.contextualNotes] : []
      };

      const savedContact = Storage.saveContact(contact);

      if (parsed.taskIntent) {
          const intent = {
              contactId: savedContact.id,
              contactName: savedContact.name,
              messageContent: parsed.messageContent,
              scheduledTime: parsed.scheduledTime,
              preferredPlatform: parsed.preferredPlatform
          };
          Storage.saveIntent(intent);
          Scheduler.schedulePending();
          this.showToast(`Intent scheduled for ${savedContact.name}`);
      } else {
          this.showToast(`Noted for ${savedContact.name}`);
      }
  },

  renderPeople() {
      const list = document.getElementById('peopleList');
      const contacts = Storage.getContacts();
      
      if (contacts.length === 0) {
          list.innerHTML = `<p style="text-align:center; margin-top:20px;">No connections yet. Tap and hold mic to add one.</p>`;
          return;
      }

      list.innerHTML = contacts.sort((a,b) => new Date(b.lastInteraction) - new Date(a.lastInteraction)).map(c => `
          <div class="card">
              <div class="card-header">
                  <h2>${c.name}</h2>
              </div>
              ${c.notes && c.notes.length > 0 ? `<p>Last note: ${c.notes[c.notes.length-1]}</p>` : ''}
              <div class="card-actions">
                  <button class="btn btn-secondary" onclick="window.promptContactMsg('${c.name}')">Message Now</button>
              </div>
          </div>
      `).join('');
  },

  renderIntents() {
      const list = document.getElementById('intentsList');
      const intents = Storage.getIntents().filter(i => i.status !== 'completed');
      
      if (intents.length === 0) {
          list.innerHTML = `<p style="text-align:center; margin-top:20px;">No pending intents.</p>`;
          return;
      }

      list.innerHTML = intents.sort((a,b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)).map(i => {
          const timeStr = new Date(i.scheduledTime).toLocaleString([], {hour: '2-digit', minute:'2-digit', month:'short', day:'numeric'});
          const isReady = i.status === 'ready';
          
          return `
          <div class="card" id="intent-${i.id}">
              <div class="card-header">
                  <h2>${i.contactName}</h2>
                  <span class="badge ${isReady ? 'ready' : ''}">${isReady ? 'Ready' : timeStr}</span>
              </div>
              <p>"${i.messageContent}"</p>
              <p style="font-size:12px; margin-top:5px; color:var(--accent)">Via ${i.preferredPlatform}</p>
              <div class="card-actions">
                  <button class="btn btn-primary" onclick="window.executeBridge('${i.id}')">Send via Bridge</button>
                  <button class="btn btn-secondary" onclick="window.dismissIntent('${i.id}')">Dismiss</button>
              </div>
          </div>
          `;
      }).join('');
  },

  showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
  }
};

// Global handlers for inline HTML onclicks
window.executeBridge = (id) => {
    const intents = Storage.getIntents();
    const intent = intents.find(i => i.id === id);
    if(intent) {
        Bridges.executeBridge(intent);
        Storage.updateIntentStatus(id, 'completed');
    }
};

window.dismissIntent = (id) => {
    Storage.deleteIntent(id);
};

window.promptContactMsg = (name) => {
    const msg = prompt(`What do you want to say to ${name}?`);
    if(msg) {
        Bridges.executeBridge({ preferredPlatform: 'whatsapp', contactName: name, messageContent: msg });
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());
