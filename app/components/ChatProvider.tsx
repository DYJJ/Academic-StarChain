'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChatContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  fetchUnreadMessages: async () => {}
});

export const useChat = () => useContext(ChatContext);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
        return data;
      }
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
    return null;
  };

  useEffect(() => {
    fetchUnreadMessages();
    
    // 设置定时器定期检查未读消息
    const intervalId = setInterval(fetchUnreadMessages, 60000); // 每分钟检查一次
    
    return () => clearInterval(intervalId);
  }, []);

  const value = {
    unreadCount,
    setUnreadCount,
    fetchUnreadMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider; 