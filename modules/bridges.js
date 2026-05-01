// modules/bridges.js
export const Bridges = {
  getWhatsAppUrl(phone, message) {
    // Strip non-digits from phone, ensure country code if needed
    // In a real app we'd have better phone number formatting. Assuming generic digits for now.
    const cleanPhone = phone.replace(/\D/g, ''); 
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  },

  getIMessageUrl(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    // Using sms: protocol which works for iMessage on iOS natively
    // Note: On iOS, passing body via &body= works.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const separator = isIOS ? '&' : '?';
    return `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
  },
  
  getBridgeUrl(intent) {
      const platform = (intent.preferredPlatform || 'whatsapp').toLowerCase();
      const phone = intent.contactPhone || '';
      const msg = intent.messageContent || '';

      if (platform === 'whatsapp') {
          return this.getWhatsAppUrl(phone, msg);
      } else if (platform === 'imessage' || platform === 'sms') {
          return this.getIMessageUrl(phone, msg);
      } else {
          return this.getWhatsAppUrl(phone, msg);
      }
  },

  executeBridge(intent) {
      const url = this.getBridgeUrl(intent);
      window.open(url, '_blank');
  }
};
