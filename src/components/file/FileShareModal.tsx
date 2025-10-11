import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Share2,
  Mail,
  Link,
  Copy,
  Check,
  Users,
  Clock,
  Shield,
  AlertCircle,
  X,
  Send
} from 'lucide-react';
import { ProjectFile, User, UserRole } from '@/types';
import { formatDateTime } from '@/utils/formatters';

// File sharing schema
const fileSharingSchema = z.object({
  recipients: z.array(z.string()).min(1, 'Select at least one recipient'),
  message: z.string().optional(),
  allowDownload: z.boolean().optional(),
  expiresAt: z.string().optional(),
  notifyByEmail: z.boolean().optional(),
  requireLogin: z.boolean().optional(),
});

type FileSharingFormData = z.infer<typeof fileSharingSchema>;

interface ShareLink {
  id: string;
  url: string;
  expiresAt?: Date;
  accessCount: number;
  maxAccess?: number;
  createdAt: Date;
  isActive: boolean;
}

interface FileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (shareData: FileSharingFormData) => Promise<void>;
  onCreateShareLink: (options: { expiresAt?: Date; maxAccess?: number }) => Promise<ShareLink>;
  onRevokeShareLink: (linkId: string) => Promise<void>;
  file: ProjectFile;
  availableUsers: User[];
  currentUser: User;
  existingShareLinks?: ShareLink[];
}

export const FileShareModal: React.FC<FileShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  onCreateShareLink,
  onRevokeShareLink,
  file,
  availableUsers,
  currentUser,
  existingShareLinks = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>(existingShareLinks);
  const [activeTab, setActiveTab] = useState<'users' | 'links'>('users');

  const form = useForm<FileSharingFormData>({
    resolver: zodResolver(fileSharingSchema),
    defaultValues: {
      recipients: [],
      message: '',
      allowDownload: true,
      expiresAt: '',
      notifyByEmail: true,
      requireLogin: true,
    },
  });

  useEffect(() => {
    setShareLinks(existingShareLinks);
  }, [existingShareLinks]);

  const handleShare = async (data: FileSharingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await onShare(data);
      form.reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShareLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const expiresAt = form.getValues('expiresAt') 
        ? new Date(form.getValues('expiresAt')!) 
        : undefined;
      
      const newLink = await onCreateShareLink({ expiresAt });
      setShareLinks(prev => [...prev, newLink]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      await onRevokeShareLink(linkId);
      setShareLinks(prev => prev.filter(link => link.id !== linkId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke share link');
    }
  };

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      setError('Failed to copy link to clipboard');
    }
  };

  const selectedRecipients = form.watch('recipients');
  const selectedUsers = availableUsers.filter(user => selectedRecipients.includes(user.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share File
          </DialogTitle>
          <DialogDescription>
            Share "{file.name}" with team members or create shareable links
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('users')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Share with Users
          </Button>
          <Button
            variant={activeTab === 'links' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('links')}
            className="flex-1"
          >
            <Link className="h-4 w-4 mr-2" />
            Share Links
          </Button>
        </div>

        {activeTab === 'users' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleShare)} className="space-y-6">
              {/* User Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Recipients</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose team members to share this file with
                  </p>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="recipients"
                    render={() => (
                      <FormItem>
                        <ScrollArea className="h-48 w-full border rounded-md p-4">
                          <div className="space-y-2">
                            {availableUsers
                              .filter(user => user.id !== currentUser.id)
                              .map((user) => (
                                <FormField
                                  key={user.id}
                                  control={form.control}
                                  name="recipients"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(user.id)}
                                          onCheckedChange={(checked) => {
                                            const updatedValue = checked
                                              ? [...(field.value || []), user.id]
                                              : (field.value || []).filter(id => id !== user.id);
                                            field.onChange(updatedValue);
                                          }}
                                        />
                                      </FormControl>
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium">
                                              {user.name.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                          </div>
                                        </div>
                                        <Badge variant="outline">{user.role}</Badge>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              ))}
                          </div>
                        </ScrollArea>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selected Recipients Summary */}
                  {selectedUsers.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        Selected Recipients ({selectedUsers.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                          <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                            {user.name}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                const currentRecipients = form.getValues('recipients');
                                form.setValue('recipients', currentRecipients.filter(id => id !== user.id));
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Share Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add a message for the recipients..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This message will be included in the notification email
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="allowDownload"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow Download</FormLabel>
                            <FormDescription className="text-xs">
                              Recipients can download the file
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notifyByEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Email Notification</FormLabel>
                            <FormDescription className="text-xs">
                              Send email to recipients
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </FormControl>
                        <FormDescription>
                          Access will be revoked after this date
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || selectedUsers.length === 0}>
                  {isLoading ? (
                    'Sharing...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Share with {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {activeTab === 'links' && (
          <div className="space-y-6">
            {/* Create New Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create Share Link</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate a shareable link that anyone can use to access the file
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Public Link</p>
                    <p className="text-xs text-muted-foreground">
                      Anyone with the link can view the file
                    </p>
                  </div>
                  <Button onClick={handleCreateShareLink} disabled={isLoading}>
                    <Link className="h-4 w-4 mr-2" />
                    Create Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Share Links */}
            {shareLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Share Links</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage existing shareable links
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {shareLinks.map((link) => (
                      <div key={link.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Link className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Share Link</span>
                            <Badge variant={link.isActive ? 'default' : 'secondary'}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeLink(link.id)}
                          >
                            Revoke
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Input
                            value={link.url}
                            readOnly
                            className="flex-1 text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(link.url, link.id)}
                          >
                            {copiedLink === link.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span>Created: {formatDateTime(link.createdAt)}</span>
                            <span>Accessed: {link.accessCount} times</span>
                          </div>
                          {link.expiresAt && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Expires: {formatDateTime(link.expiresAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};