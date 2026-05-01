// modules/storage.js
export const Storage = {
  getContacts() {
    return JSON.parse(localStorage.getItem('recall_contacts') || '[]');
  },

  saveContact(contact) {
    const contacts = this.getContacts();
    const existingIndex = contacts.findIndex(c => c.name.toLowerCase() === contact.name.toLowerCase());
    
    if (existingIndex >= 0) {
      // Merge notes
      if (contact.notes && contact.notes.length > 0) {
         contacts[existingIndex].notes = [...(contacts[existingIndex].notes || []), ...contact.notes];
      }
      contacts[existingIndex].lastInteraction = new Date().toISOString();
    } else {
      contact.id = Date.now().toString();
      contact.lastInteraction = new Date().toISOString();
      if (!contact.notes) contact.notes = [];
      contacts.push(contact);
    }
    
    localStorage.setItem('recall_contacts', JSON.stringify(contacts));
    window.dispatchEvent(new Event('contactsUpdated'));
    return contact;
  },

  getIntents() {
    return JSON.parse(localStorage.getItem('recall_intents') || '[]');
  },

  saveIntent(intent) {
    const intents = this.getIntents();
    intent.id = intent.id || Date.now().toString();
    intent.createdAt = intent.createdAt || new Date().toISOString();
    intent.status = intent.status || 'pending';
    
    const existingIndex = intents.findIndex(i => i.id === intent.id);
    if (existingIndex >= 0) {
      intents[existingIndex] = intent;
    } else {
      intents.push(intent);
    }
    
    localStorage.setItem('recall_intents', JSON.stringify(intents));
    window.dispatchEvent(new Event('intentsUpdated'));
    return intent;
  },
  
  updateIntentStatus(id, status) {
      const intents = this.getIntents();
      const intent = intents.find(i => i.id === id);
      if(intent) {
          intent.status = status;
          localStorage.setItem('recall_intents', JSON.stringify(intents));
          window.dispatchEvent(new Event('intentsUpdated'));
      }
  },

  deleteIntent(id) {
    const intents = this.getIntents();
    const filtered = intents.filter(i => i.id !== id);
    localStorage.setItem('recall_intents', JSON.stringify(filtered));
    window.dispatchEvent(new Event('intentsUpdated'));
  }
};
