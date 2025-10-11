import React, { useState, useEffect, useMemo } from 'react';
import { EnhancedChatInterface } from './EnhancedChatInterface';
import { useAppContext } from '../contexts/AppContext';
import { ChatType, Project } from '../types';
import { Message, ChannelType } from '../types/messaging';

interface ProjectChatInterfaceProps {
    project: Project;
    chatType?: ChatType;
    recipientId?: string; // For private chats
    className?: string;
    messages?: Message[]; // Add messages as a prop since Project doesn't have messages
}

export const ProjectChatInterface: React.FC<ProjectChatInterfaceProps> = ({
    project,
    chatType = ChatType.GENERAL,
    recipientId,
    className,
    messages = [] // Default to empty array
}) => {
    const {
        user,
        addEnhancedMessageToProject,
        setTypingStatus,
        getTypingUsers
    } = useAppContext();

    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    // Filter messages based on chat type and recipient
    const filteredMessages = useMemo(() => {
        if (!messages || messages.length === 0) return [];

        return messages.filter((message: Message) => {
            // Filter by chat type - convert enum values for comparison
            if (message.channelType && chatType) {
                // Map ChatType to ChannelType for comparison
                const channelTypeMap = {
                    [ChatType.GENERAL]: ChannelType.PROJECT_GENERAL,
                    [ChatType.FREELANCER]: ChannelType.PROJECT_TEAM,
                    [ChatType.PRIVATE]: ChannelType.DIRECT_MESSAGE
                };

                const expectedChannelType = channelTypeMap[chatType];
                if (message.channelType !== expectedChannelType) return false;
            }

            // For private chats, filter by recipient
            if (recipientId) {
                return (
                    (message.senderId === user?.id && message.channelId?.includes(recipientId)) ||
                    (message.senderId === recipientId && message.channelId?.includes(user?.id || ''))
                );
            }

            // For group chats, include all non-private messages
            return message.channelType !== ChannelType.DIRECT_MESSAGE;
        });
    }, [messages, chatType, recipientId, user?.id]);

    // Update typing indicators
    useEffect(() => {
        if (!getTypingUsers) return;

        const updateTypingUsers = () => {
            const currentTypingUsers = getTypingUsers(project.id, chatType);
            // Convert TypingIndicator array to string array for compatibility
            if (Array.isArray(currentTypingUsers)) {
                const userNames = currentTypingUsers.map((indicator: any) =>
                    typeof indicator === 'string' ? indicator : indicator.userName || indicator.userId
                );
                setTypingUsers(userNames);
            } else {
                setTypingUsers(currentTypingUsers || []);
            }
        };

        // Update immediately
        updateTypingUsers();

        // Set up interval to check for typing updates
        const interval = setInterval(updateTypingUsers, 1000);

        return () => clearInterval(interval);
    }, [project.id, chatType, getTypingUsers]);

    const handleSendMessage = async (content: string, recipientIds?: string[]) => {
        if (!addEnhancedMessageToProject) {
            console.error('addEnhancedMessageToProject not available');
            return;
        }

        try {
            await addEnhancedMessageToProject(
                project.id,
                content,
                chatType,
                recipientIds
            );
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleTypingStatusChange = async (isTyping: boolean) => {
        if (!setTypingStatus) {
            console.error('setTypingStatus not available');
            return;
        }

        try {
            await setTypingStatus(project.id, chatType, isTyping);
        } catch (error) {
            console.error('Failed to update typing status:', error);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Please log in to access chat</div>
            </div>
        );
    }

    return (
        <EnhancedChatInterface
            projectId={project.id}
            chatType={chatType}
            recipientId={recipientId}
            messages={filteredMessages}
            onSendMessage={handleSendMessage}
            onTypingStatusChange={handleTypingStatusChange}
            typingUsers={typingUsers}
            className={className}
        />
    );
};

export default ProjectChatInterface;