import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Clock, DollarSign, User, Calendar } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { AllocationApprovalRequest, AllocationApprovalStatus } from '@/types';

export default function AllocationApprovalPanel() {
    const { getApprovalRequests, submitApprovalVote, user } = useAppContext();
    const [requests, setRequests] = useState<AllocationApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<AllocationApprovalRequest | null>(null);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadApprovalRequests();
    }, []);

    const loadApprovalRequests = async () => {
        try {
            setLoading(true);
            const approvalRequests = await getApprovalRequests(AllocationApprovalStatus.PENDING, user?.id);
            setRequests(approvalRequests);
        } catch (error) {
            console.error('Error loading approval requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (decision: 'APPROVE' | 'REJECT' | 'ESCALATE') => {
        if (!selectedRequest) return;

        try {
            setSubmitting(true);
            await submitApprovalVote(selectedRequest.id, decision, comments);
            await loadApprovalRequests(); // Refresh the list
            setSelectedRequest(null);
            setComments('');
        } catch (error) {
            console.error('Error submitting vote:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: AllocationApprovalStatus) => {
        switch (status) {
            case AllocationApprovalStatus.PENDING:
                return <Badge variant="secondary" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case AllocationApprovalStatus.APPROVED:
                return <Badge variant="secondary" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
            case AllocationApprovalStatus.REJECTED:
                return <Badge variant="secondary" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
            case AllocationApprovalStatus.ESCALATED:
                return <Badge variant="secondary" className="text-orange-600"><AlertTriangle className="w-3 h-3 mr-1" />Escalated</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">Loading approval requests...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Time Allocation Approvals
                    </CardTitle>
                    <CardDescription>
                        Review and approve large time allocation requests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                No pending approval requests at this time.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <Card key={request.id} className="border-l-4 border-l-yellow-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold">{request.projectTitle || 'Project'}</h3>
                                                    {getStatusBadge(request.status)}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        <span>{request.freelancerName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{request.allocatedHours}h</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4" />
                                                        <span>{formatCurrency(request.totalValue)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(request.createdAt)}</span>
                                                    </div>
                                                </div>

                                                <p className="text-sm mb-3">{request.reason}</p>

                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Requested by: {request.requestedByName}</span>
                                                    <span>•</span>
                                                    <span>Approvals needed: {request.requiredApprovals}</span>
                                                    <span>•</span>
                                                    <span>Votes: {request.approvals.length}/{request.requiredApprovals}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 ml-4">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedRequest(request)}
                                                        >
                                                            Review
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Review Time Allocation Request</DialogTitle>
                                                            <DialogDescription>
                                                                Review the details and cast your approval vote
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        {selectedRequest && (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-sm font-medium">Project</label>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {selectedRequest.projectTitle || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium">Freelancer</label>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {selectedRequest.freelancerName}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium">Hours Requested</label>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {selectedRequest.allocatedHours} hours
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium">Total Value</label>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {formatCurrency(selectedRequest.totalValue)}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-sm font-medium">Reason</label>
                                                                    <p className="text-sm text-muted-foreground mt-1">
                                                                        {selectedRequest.reason}
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <label className="text-sm font-medium">Current Votes</label>
                                                                    <div className="mt-2 space-y-2">
                                                                        {selectedRequest.approvals.map((vote, index) => (
                                                                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                                                                <span className="text-sm">{vote.adminName}</span>
                                                                                <Badge
                                                                                    variant={vote.decision === 'APPROVE' ? 'default' :
                                                                                        vote.decision === 'REJECT' ? 'destructive' : 'secondary'}
                                                                                >
                                                                                    {vote.decision}
                                                                                </Badge>
                                                                            </div>
                                                                        ))}
                                                                        {selectedRequest.approvals.length === 0 && (
                                                                            <p className="text-sm text-muted-foreground">No votes yet</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-sm font-medium">Comments (Optional)</label>
                                                                    <Textarea
                                                                        placeholder="Add any comments about your decision..."
                                                                        value={comments}
                                                                        onChange={(e) => setComments(e.target.value)}
                                                                        className="mt-1"
                                                                    />
                                                                </div>

                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleVote('REJECT')}
                                                                        disabled={submitting}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        Reject
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleVote('ESCALATE')}
                                                                        disabled={submitting}
                                                                    >
                                                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                                                        Escalate
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleVote('APPROVE')}
                                                                        disabled={submitting}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Approve
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}