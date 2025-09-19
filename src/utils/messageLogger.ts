/**
 * Debug Logger for Chat Debugging
 * Provides a clean, organized way to log chat-related events
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export enum LogCategory {
  UNREAD = 'UNREAD',
  KEYBOARD = 'KEYBOARD',
  TIMER = 'TIMER'
}

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  timestamp: string;
}

class MessageLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private enabled = __DEV__; // Only log in development

  private formatTimestamp(): string {
    return new Date().toLocaleTimeString();
  }

  private addLog(level: LogLevel, category: LogCategory, message: string, data?: any) {
    if (!this.enabled) return;

    const entry: LogEntry = {
      level,
      category,
      message,
      data,
      timestamp: this.formatTimestamp()
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Also log to console with nice formatting
    const prefix = `[${entry.timestamp}] ${entry.category}:`;
    const fullMessage = `${prefix} ${entry.message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(fullMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, data || '');
        break;
      case LogLevel.DEBUG:
        console.debug(fullMessage, data || '');
        break;
      default:
        console.log(fullMessage, data || '');
    }
  }

  // Unread count logging
  unreadCountUpdated(activityId: string, count: number, lastRead: number) {
    // Always log when count > 0, or when debugging
    if (count > 0 || this.enabled) {
      this.addLog(LogLevel.INFO, LogCategory.UNREAD,
        `Unread count for ${activityId}: ${count} (lastRead: ${new Date(lastRead).toLocaleTimeString()})`);
    }
  }

  // Special debugging for red dot issues
  debugUnreadCalculation(activityId: string, userEmail: string, userId: string, messages: any[], lastReadTimestamp: number, unreadCount: number) {
    this.addLog(LogLevel.DEBUG, LogCategory.UNREAD,
      `Unread calculation for ${activityId}: userEmail=${userEmail}, lastRead=${new Date(lastReadTimestamp).toLocaleTimeString()}, calculated=${unreadCount}`);

    // Log details about each message from others (using userId for comparison since senderId stores user.id)
    const messagesFromOthers = messages.filter(msg => msg.senderId !== userId);
    if (messagesFromOthers.length > 0) {
      this.addLog(LogLevel.DEBUG, LogCategory.UNREAD,
        `Messages from others (${messagesFromOthers.length}): ${messagesFromOthers.map(m => {
          const msgTime = typeof m.createdAt === 'number' ? m.createdAt : new Date(m.createdAt).getTime();
          const isUnread = msgTime > lastReadTimestamp;
          return `${m.senderId}(${new Date(msgTime).toLocaleTimeString()},${isUnread ? 'UNREAD' : 'read'})`;
        }).join(', ')}`);
    }
  }

  markAsReadExecuted(activityId: string) {
    this.addLog(LogLevel.INFO, LogCategory.UNREAD,
      `Marked messages as read for ${activityId}`);
  }

  markAsReadTimerStarted(activityId: string, delay: number) {
    this.addLog(LogLevel.DEBUG, LogCategory.TIMER,
      `Started markAsRead timer for ${activityId} (${delay}ms)`);
  }

  markAsReadTimerCleared(activityId: string) {
    this.addLog(LogLevel.DEBUG, LogCategory.TIMER,
      `Cleared markAsRead timer for ${activityId}`);
  }

  // Keyboard and scroll logging
  keyboardToggle(visible: boolean, height?: number) {
    this.addLog(LogLevel.DEBUG, LogCategory.KEYBOARD,
      `Keyboard ${visible ? 'opened' : 'closed'}${height ? ` (height: ${height}px)` : ''}`);
  }

  // Utility methods
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  clearLogs() {
    this.logs = [];
    console.log('[DebugLogger] Logs cleared');
  }

  dumpLogs() {
    console.log('\n=== DEBUG LOGGER DUMP ===');
    this.logs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.level} ${log.category}: ${log.message}`, log.data || '');
    });
    console.log('=== END DUMP ===\n');
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

export const messageLogger = new MessageLogger();

// Global access for debugging
if (__DEV__) {
  (global as any).messageLogger = messageLogger;
}