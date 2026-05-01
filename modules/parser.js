// modules/parser.js
// A lightweight, local intent parser using regex and keywords.
export const Parser = {
  parse(transcript) {
    const text = transcript.toLowerCase();
    
    let result = {
      contactName: "",
      contextualNotes: "",
      taskIntent: false,
      messageContent: "",
      scheduledTime: null,
      preferredPlatform: "whatsapp" // Default
    };

    // 1. Detect Platform
    if (text.includes("imessage") || text.includes("message") || text.includes("text")) {
        result.preferredPlatform = "imessage";
    }
    if (text.includes("whatsapp")) {
        result.preferredPlatform = "whatsapp";
    }

    // 2. Detect Intent & Message
    // "send [name] a message saying [message] at [time]"
    // "remind me to text [name] [message] at [time]"
    
    // Very simple extraction for MVP
    const sendMatch = transcript.match(/(?:send|text|tell|message)\s+([A-Za-z]+)\s+(?:that|saying|to)?\s*(.*)/i);
    
    if (sendMatch) {
        result.taskIntent = true;
        result.contactName = sendMatch[1].trim();
        
        let restOfText = sendMatch[2].trim();
        
        // Try to extract time (at 8pm, tomorrow at 9, etc)
        const timeMatch = restOfText.match(/\s+(at|tomorrow|tonight|in)\s+(.*)/i);
        if (timeMatch) {
            result.messageContent = restOfText.substring(0, timeMatch.index).trim();
            result.scheduledTime = this.parseLocalTime(timeMatch[0]);
        } else {
            result.messageContent = restOfText;
            // Default time: 5 minutes from now for demo purposes if no time specified but intent exists
            const d = new Date();
            d.setMinutes(d.getMinutes() + 5);
            result.scheduledTime = d.toISOString();
        }
    } else {
        // Just a note
        const noteMatch = transcript.match(/(?:remember that|note that)\s+([A-Za-z]+)\s+(.*)/i);
        if (noteMatch) {
             result.contactName = noteMatch[1].trim();
             result.contextualNotes = noteMatch[2].trim();
        } else {
             // Fallback
             result.contextualNotes = transcript;
        }
    }

    // Capitalize name
    if (result.contactName) {
        result.contactName = result.contactName.charAt(0).toUpperCase() + result.contactName.slice(1);
    }

    return result;
  },

  parseLocalTime(timeString) {
      // Very crude time parser for MVP.
      const now = new Date();
      let target = new Date(now);

      const str = timeString.toLowerCase();

      if (str.includes("tomorrow")) {
          target.setDate(target.getDate() + 1);
      }

      const hourMatch = str.match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
      if (hourMatch) {
          let hours = parseInt(hourMatch[1], 10);
          const mins = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
          const ampm = hourMatch[3];

          if (ampm === 'pm' && hours < 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;

          target.setHours(hours, mins, 0, 0);
      } else if (str.includes("in ")) {
           const minMatch = str.match(/in\s+(\d+)\s+min/);
           if (minMatch) {
               target.setMinutes(target.getMinutes() + parseInt(minMatch[1], 10));
           } else {
               const hourMatch = str.match(/in\s+(\d+)\s+hour/);
               if (hourMatch) {
                   target.setHours(target.getHours() + parseInt(hourMatch[1], 10));
               }
           }
      }

      // If time has already passed today, assume tomorrow
      if (target <= now && !str.includes("tomorrow")) {
          target.setDate(target.getDate() + 1);
      }

      return target.toISOString();
  }
};
