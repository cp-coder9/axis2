import React, { useState, useRef } from 'react';
import { Send, Bold, Italic, Code, Link, AtSign } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showFormatting?: boolean;
  showMentions?: boolean;
  mentionUsers?: Array<{ id: string; name: string; avatar?: string }>;
  className?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSubmit,
  onTypingStart,
  onTypingStop,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 1000,
  showFormatting = true,
  showMentions = true,
  mentionUsers = [],
  className
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (newValue.length <= maxLength) {
      onChange(newValue);
      
      if (newValue.trim()) {
        onTypingStart();
      } else {
        onTypingStop();
      }
      
      // Check for mentions
      if (showMentions) {
        checkForMentions(newValue, e.target.selectionStart);
      }
    }
  };

  const checkForMentions = (text: string, position: number) => {
    const beforeCursor = text.substring(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionPopover(true);
      setCursorPosition(position);
    } else {
      setShowMentionPopover(false);
      setMentionQuery('');
    }
  };

  const insertMention = (user: { id: string; name: string }) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const beforeMention = beforeCursor.replace(/@\w*$/, '');
    
    const newValue = `${beforeMention}@${user.name} ${afterCursor}`;
    onChange(newValue);
    setShowMentionPopover(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = beforeMention.length + user.name.length + 2;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertFormatting = (format: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let formattedText = '';
    let newCursorPos = start;
    
    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '****';
        newCursorPos = selectedText ? end + 4 : start + 2;
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '**';
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
      case 'code':
        formattedText = selectedText ? `\`${selectedText}\`` : '``';
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
      case 'link':
        formattedText = selectedText ? `[${selectedText}](url)` : '[text](url)';
        newCursorPos = selectedText ? end + 6 : start + 11;
        break;
    }
    
    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
    
    // Set cursor position
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    // Format shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertFormatting('bold');
          break;
        case 'i':
          e.preventDefault();
          insertFormatting('italic');
          break;
        case 'k':
          e.preventDefault();
          insertFormatting('link');
          break;
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      onChange('');
      onTypingStop();
    }
  };

  const filteredMentionUsers = mentionUsers.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className={cn('relative', className)}>
      {/* Formatting Toolbar */}
      {showFormatting && (
        <div className="flex items-center gap-1 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('bold')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('italic')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('code')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('link')}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Link (Ctrl+K)"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          {showMentions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(value + '@');
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Mention"
            >
              <AtSign className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {/* Message Input */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[2.5rem] max-h-32 resize-none"
            rows={1}
          />
          
          {/* Mention Popover */}
          {showMentionPopover && filteredMentionUsers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2">Mention someone</div>
                {filteredMentionUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md text-left"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm">{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Character Count */}
      <div className="flex justify-between items-center px-3 pb-2 text-xs text-muted-foreground">
        <div>
          {showFormatting && (
            <span>Use **bold**, *italic*, `code`, or @mention</span>
          )}
        </div>
        <div className={cn(
          'transition-colors',
          value.length > maxLength * 0.9 && 'text-yellow-600',
          value.length >= maxLength && 'text-red-600'
        )}>
          {value.length}/{maxLength}
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;