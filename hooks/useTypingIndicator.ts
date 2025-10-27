import { useCallback, useEffect, useRef } from 'react';

export function useTypingIndicator(
  conversationId: string,
  onTypingChange: (conversationId: string, isTyping: boolean) => void,
  delay = 3000
) {
  //@ts-ignore
  const typingTimeout = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  // Notify when user starts or stops typing
  const setTyping = useCallback((isTyping: boolean) => {
    // Only trigger change if the typing state actually changed
    if (isTyping !== isTypingRef.current) {
      isTypingRef.current = isTyping;
      onTypingChange(conversationId, isTyping);
      
      // If user is typing, set a timeout to automatically set typing to false
      if (isTyping) {
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }
        
        typingTimeout.current = setTimeout(() => {
          isTypingRef.current = false;
          onTypingChange(conversationId, false);
        }, delay);
      }
    }
  }, [conversationId, onTypingChange, delay]);

  // Call this when the user types
  const onType = useCallback(() => {
    setTyping(true);
  }, [setTyping]);

  // Call this when the user submits or cancels typing
  const stopTyping = useCallback(() => {
    setTyping(false);
  }, [setTyping]);

  return {
    onType,
    stopTyping,
  };
}
