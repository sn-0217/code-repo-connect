import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, X, CheckCircle, XCircle, Clock, Trash2, Calendar, User, FileText, Code, Settings, LogOut, Server, Database, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadSubmissions, updateSubmission, deleteSubmission } from '@/utils/testData';
import { useToastContext } from '@/contexts/ToastContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useAuth } from '@/contexts/AuthContext';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import SubmissionJsonEditor from '@/components/SubmissionJsonEditor';
import ApplicationsManager from '@/components/ApplicationsManager';

// Backend submission interface to match the API response
interface BackendSubmission {
  appData: {
    appName: string;
    changeNumber: string;
    applicationOwner: string;
    maintenanceWindow: string;
    changeDescription: string;
    infrastructureImpact: string;
    hosts: string[];
  };
  formSubmission: {
    changeNumber: string;
    approverName: string;
    approverEmail: string;
    decision: 'Approved' | 'Rejected' | 'Timed';
    environment: string;
    startTime?: string;
    endTime?: string;
    comments?: string;
  };
  submittedAt: string;
  status: string;
}

// Frontend submission interface for the UI
interface Submission {
  id: string;
  appName: string;
  changeNo: string;
  requester: string;
  title: string;
  description: string;
  impact: string;
  decision: string;
  timestamp: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  comments?: string;
}

// Transform function to convert backend data to frontend format
const transformSubmission = (backendSubmission: BackendSubmission, index: number): Submission => {
  return {
    id: `${backendSubmission.appData.appName}-${backendSubmission.formSubmission.changeNumber}-${index}`,
    appName: backendSubmission.appData.appName,
    changeNo: backendSubmission.formSubmission.changeNumber,
    requester: backendSubmission.appData.applicationOwner,
    title: backendSubmission.appData.changeDescription,
    description: backendSubmission.appData.changeDescription,
    impact: backendSubmission.appData.infrastructureImpact,
    decision: backendSubmission.formSubmission.decision,
    timestamp: backendSubmission.submittedAt,
    startTime: backendSubmission.formSubmission.startTime,
    endTime: backendSubmission.formSubmission.endTime,
    comments: backendSubmission.formSubmission.comments
  };
};

// Transform function to convert frontend format back to backend data
const transformToBackend = (submission: Submission, originalBackendData?: BackendSubmission): BackendSubmission => {
  // If we have the original backend data, use it as a base
  if (originalBackendData) {
    return {
      ...originalBackendData,
      appData: {
        ...originalBackendData.appData,
        changeNumber: submission.changeNo,
        applicationOwner: submission.requester,
        changeDescription: submission.title,
        infrastructureImpact: submission.impact
      },
      formSubmission: {
        ...originalBackendData.formSubmission,
        changeNumber: submission.changeNo,
        decision: submission.decision as 'Approved' | 'Rejected' | 'Timed',
        startTime: submission.startTime,
        endTime: submission.endTime,
        comments: submission.comments
      }
    };
  }
  
  // If we don't have the original backend data, create a new one
  // This is a simplified version and might need to be adjusted
  return {
    appData: {
      appName: submission.appName,
      changeNumber: submission.changeNo,
      applicationOwner: submission.requester,
      maintenanceWindow: '',
      changeDescription: submission.title,
      infrastructureImpact: submission.impact,
      hosts: []
    },
    formSubmission: {
      changeNumber: submission.changeNo,
      approverName: '',
      approverEmail: '',
      decision: submission.decision as 'Approved' | 'Rejected' | 'Timed',
      environment: 'DEV',
      startTime: submission.startTime,
      endTime: submission.endTime,
      comments: submission.comments
    },
    submittedAt: submission.timestamp,
    status: 'PENDING'
  };
};

const Admin = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToastContext();
  const { currentEnv } = useEnvironment();
  const { logout, isAdmin } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [backendSubmissions, setBackendSubmissions] = useState<BackendSubmission[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    submissionId: string;
    submissionName: string;
  }>({
    isOpen: false,
    submissionId: '',
    submissionName: ''
  });
  const [activeTab, setActiveTab] = useState('submissions');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        const data = await loadSubmissions();
        const transformedSubmissions = data.map((sub: BackendSubmission, index: number) => 
          transformSubmission(sub, index)
        );
        setBackendSubmissions(data);
        setSubmissions(transformedSubmissions);
      } catch (error) {
        console.error('Failed to load submissions:', error);
        showError('Failed to Load Submissions', 'Unable to fetch submission data. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [showError]);

  const handleEdit = (submission: Submission) => {
    setEditingId(submission.id);
    setEditForm({ ...submission });
  };

  const handleSave = async () => {
    if (!editForm) return;
    
    try {
      setIsLoading(true);
      
      // Find the original backend submission that corresponds to this frontend submission
      const submissionIndex = submissions.findIndex(sub => sub.id === editForm.id);
      if (submissionIndex === -1) {
        showError('Update Failed', 'Could not find the submission to update.');
        return;
      }
      
      const originalBackendSubmission = backendSubmissions[submissionIndex];
      
      // Transform the edited frontend submission back to backend format
      const updatedBackendSubmission = transformToBackend(editForm, originalBackendSubmission);
      
      // Call the API to update the submission
      await updateSubmission(editForm.changeNo, updatedBackendSubmission);
      
      // Refresh the submissions list
      const data = await loadSubmissions();
      const transformedSubmissions = data.map((sub: BackendSubmission, index: number) => 
        transformSubmission(sub, index)
      );
      
      setBackendSubmissions(data);
      setSubmissions(transformedSubmissions);
      showSuccess('Success', 'Submission updated successfully');
    } catch (error) {
      console.error('Failed to update submission:', error);
      showError('Update Failed', 'Failed to update the submission. Please try again.');
    } finally {
      setIsLoading(false);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleDeleteClick = (id: string) => {
    const submission = submissions.find(sub => sub.id === id);
    if (submission) {
      setDeleteDialog({
        isOpen: true,
        submissionId: id,
        submissionName: `${submission.appName} - ${submission.changeNo}`
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsLoading(true);
      
      // Find the submission to delete
      const submissionIndex = submissions.findIndex(sub => sub.id === deleteDialog.submissionId);
      if (submissionIndex === -1) {
        showError('Delete Failed', 'Could not find the submission to delete.');
        return;
      }
      
      const submissionToDelete = submissions[submissionIndex];
      
      // Call the API to delete the submission
      await deleteSubmission(submissionToDelete.changeNo);
      
      // Refresh the submissions list
      const data = await loadSubmissions();
      const transformedSubmissions = data.map((sub: BackendSubmission, index: number) => 
        transformSubmission(sub, index)
      );
      
      setBackendSubmissions(data);
      setSubmissions(transformedSubmissions);
      showSuccess('Success', 'Submission deleted successfully');
    } catch (error) {
      console.error('Failed to delete submission:', error);
      showError('Delete Failed', 'Failed to delete the submission. Please try again.');
    } finally {
      setIsLoading(false);
      setDeleteDialog({ isOpen: false, submissionId: '', submissionName: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, submissionId: '', submissionName: '' });
  };

  const handleLogout = () => {
    logout();
    // Navigation is now handled in the AuthContext logout method
  };

  const getStatusIcon = (decision: string) => {
    switch (decision) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'Timed':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (decision: string) => {
    switch (decision) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Timed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
              <p className="text-slate-600 text-sm">Manage change submissions and configuration</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/home')}
                className="gap-2 hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Badge className="gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200">
                <Settings className="w-4 h-4" />
                {currentEnv}
              </Badge>
              <Badge className="gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200">
                <User className="w-4 h-4" />
                Administrator
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2 hover:scale-105 transition-transform shadow-sm hover:shadow-md bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-700 hover:from-gray-100 hover:to-slate-100"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-2'} max-w-lg`}>
            <TabsTrigger value="submissions" className="gap-2">
              <FileText className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Power className="w-4 h-4" />
              Applications
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="back" className="gap-2">
                  <Server className="w-4 h-4" />
                  Backend
                </TabsTrigger>
                <TabsTrigger value="dev" className="gap-2">
                  <Database className="w-4 h-4" />
                  Dev Tools
                </TabsTrigger>
                <TabsTrigger value="config" className="gap-2">
                  <Code className="w-4 h-4" />
                  Config
                </TabsTrigger>
              </>
            )}  
          </TabsList>

          <TabsContent value="submissions">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Submission Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <FileText className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Loading Submissions...</h3>
                    <p className="text-slate-500">Please wait while we fetch the latest data.</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Submissions Found</h3>
                    <p className="text-slate-500">There are no change submissions to manage yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>App</TableHead>
                          <TableHead>Change #</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Requester</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{submission.appName}</TableCell>
                            <TableCell>
                              <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                                {submission.changeNo}
                              </code>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{submission.title}</TableCell>
                            <TableCell>{submission.requester}</TableCell>
                            <TableCell>
                              <Badge className={`gap-2 ${getStatusColor(submission.decision)}`}>
                                {getStatusIcon(submission.decision)}
                                {submission.decision}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Calendar className="w-3 h-3" />
                                {new Date(submission.timestamp).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(submission)}
                                  className="gap-1 hover:scale-105 transition-transform"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(submission.id)}
                                  className="gap-1 hover:scale-105 transition-transform border-rose-200 text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsManager />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="back">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Server className="w-5 h-5 text-white" />
                      </div>
                      Backend Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <h3 className="text-xl font-bold text-slate-700 mb-2">Backend Administration</h3>
                      <p className="text-slate-500 mb-6">This section is restricted to administrators only.</p>
                      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">Server Status</h4>
                          <p className="text-sm text-slate-500">Monitor and manage server resources</p>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">API Management</h4>
                          <p className="text-sm text-slate-500">Configure API endpoints and permissions</p>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">Database</h4>
                          <p className="text-sm text-slate-500">Manage database connections and backups</p>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">Logs</h4>
                          <p className="text-sm text-slate-500">View system logs and error reports</p>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="dev">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      Development Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <h3 className="text-xl font-bold text-slate-700 mb-2">Developer Options</h3>
                      <p className="text-slate-500 mb-6">Advanced tools for development and testing.</p>
                      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">Environment Variables</h4>
                          <p className="text-sm text-slate-500">Configure application environment settings</p>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">Feature Flags</h4>
                          <p className="text-sm text-slate-500">Toggle experimental features</p>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">Test Data</h4>
                          <p className="text-sm text-slate-500">Generate and manage test datasets</p>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium mb-2">API Testing</h4>
                          <p className="text-sm text-slate-500">Test API endpoints and view responses</p>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="config">
                <SubmissionJsonEditor />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Edit Modal */}
        {editingId && editForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Edit Submission</span>
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Application
                    </label>
                    <Input
                      value={editForm.appName}
                      onChange={(e) => setEditForm({ ...editForm, appName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Change Number
                    </label>
                    <Input
                      value={editForm.changeNo}
                      onChange={(e) => setEditForm({ ...editForm, changeNo: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Title
                  </label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Requester
                  </label>
                  <Input
                    value={editForm.requester}
                    onChange={(e) => setEditForm({ ...editForm, requester: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Impact
                  </label>
                  <Textarea
                    value={editForm.impact}
                    onChange={(e) => setEditForm({ ...editForm, impact: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Decision
                  </label>
                  <Select
                    value={editForm.decision}
                    onValueChange={(value) => setEditForm({ ...editForm, decision: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Timed">Timed Approval</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editForm.decision === 'Timed' && (
                  <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Timed Approval Window</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Start Time
                        </label>
                        <Input
                          type="datetime-local"
                          value={editForm.startTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          End Time
                        </label>
                        <Input
                          type="datetime-local"
                          value={editForm.endTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editForm.scheduledDate && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Scheduled Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={editForm.scheduledDate}
                      onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Comments
                  </label>
                  <Textarea
                    value={editForm.comments || ''}
                    onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                    rows={2}
                    placeholder="Add comments..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Submission"
          description="Are you sure you want to delete this submission? This action cannot be undone and will permanently remove all associated data."
          itemName={deleteDialog.submissionName}
        />
      </div>
    </div>
  );
};

export default Admin;
