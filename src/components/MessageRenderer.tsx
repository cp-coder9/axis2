import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, Copy, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface MessageRendererProps {
  content: string;
  className?: string;
  onMentionClick?: (userId: string) => void;
  onLinkClick?: (url: string) => void;
}

interface ParsedElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'mention' | 'linebreak';
  content: string;
  url?: string;
  userId?: string;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  className,
  onMentionClick,
  onLinkClick
}) => {
  const parseMessage = (text: string): ParsedElement[] => {
    const elements: ParsedElement[] = [];
    const currentIndex = 0;
    
    // Regex patterns for different formatting
    const patterns = [
      { type: 'bold', regex: /\*\*(.*?)\*\*/g },
      { type: 'italic', regex: /\*(.*?)\*/g },
      { type: 'code', regex: /`(.*?)`/g },
      { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g },
      { type: 'mention', regex: /@(\w+)/g },
      { type: 'linebreak', regex: /\n/g }
    ];
    
    // Find all matches
    const matches: Array<{
      type: string;
      start: number;
      end: number;
      content: string;
      url?: string;
      userId?: string;
    }> = [];
    
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(text)) !== null) {
        if (pattern.type === 'link') {
          matches.push({
            type: pattern.type,
            start: match.index,
            end: match.index + match[0].length,
            content: match[1],
            url: match[2]
          });
        } else if (pattern.type === 'mention') {
          matches.push({
            type: pattern.type,
            start: match.index,
            end: match.index + match[0].length,
            content: match[1],
            userId: match[1]
          });
        } else if (pattern.type === 'linebreak') {
          matches.push({
            type: pattern.type,
            start: match.index,
            end: match.index + match[0].length,
            content: '\n'
          });
        } else {
          matches.push({
            type: pattern.type,
            start: match.index,
            end: match.index + match[0].length,
            content: match[1] || match[0]
          });
        }
      }
    });
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Remove overlapping matches (prefer longer matches)
    const filteredMatches = [];
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const hasOverlap = filteredMatches.some(existing => 
        (current.start >= existing.start && current.start < existing.end) ||
        (current.end > existing.start && current.end <= existing.end)
      );
      
      if (!hasOverlap) {
        filteredMatches.push(current);
      }
    }
    
    // Build elements array
    let lastIndex = 0;
    
    filteredMatches.forEach(match => {
      // Add text before match
      if (match.start > lastIndex) {
        const textContent = text.substring(lastIndex, match.start);
        if (textContent) {
          elements.push({
            type: 'text',
            content: textContent
          });
        }
      }
      
      // Add formatted element
      elements.push({
        type: match.type as any,
        content: match.content,
        url: match.url,
        userId: match.userId
      });
      
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      const textContent = text.substring(lastIndex);
      if (textContent) {
        elements.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    return elements;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const renderElement = (element: ParsedElement, index: number) => {
    switch (element.type) {
      case 'bold':
        return (
          <strong key={index} className="font-semibold">
            {element.content}
          </strong>
        );
        
      case 'italic':
        return (
          <em key={index} className="italic">
            {element.content}
          </em>
        );
        
      case 'code':
        return (
          <code 
            key={index} 
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono relative group"
          >
            {element.content}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(element.content)}
              className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </code>
        );
        
      case 'link':
        return (
          <Button
            key={index}
            variant="link"
            className="h-auto p-0 text-primary underline"
            onClick={() => onLinkClick?.(element.url || '')}
          >
            {element.content}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        );
        
      case 'mention':
        return (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => onMentionClick?.(element.userId || '')}
          >
            @{element.content}
          </Badge>
        );
        
      case 'linebreak':
        return <br key={index} />;
        
      case 'text':
      default:
        return <span key={index}>{element.content}</span>;
    }
  };

  const elements = parseMessage(content);

  return (
    <div className={cn('whitespace-pre-wrap break-words leading-relaxed', className)}>
      {elements.map(renderElement)}
    </div>
  );
};

export default MessageRenderer;