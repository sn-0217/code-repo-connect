
import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Trash2, Power, PowerOff, AlertCircle, Clock, User, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToastContext } from '@/contexts/ToastContext';
import { loadApps } from '@/utils/testData';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

interface AppData {
  appName: string;
  changeNumber: string;
  applicationOwner: string;
  maintenanceWindow: string;
  changeDescription: string;
  infrastructureImpact: string;
  hosts: string[];
  disabled?: boolean;
}

const ApplicationsManager: React.FC = () => {
  const [applications, setApplications] = useState<AppData[]>([]);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    appName: string;
  }>({
    isOpen: false,
    appName: ''
  });
  const { showError, showSuccess } = useToastContext();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const apps = await loadApps();
      console.log('Loaded applications:', apps);
      setApplications(apps.filter((app: AppData) => !app.disabled));
    } catch (error) {
      console.error('Failed to load applications:', error);
      showError('Failed to Load Applications', 'Unable to fetch application data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (application: AppData) => {
    if (hasUnsavedChanges) {
      showError('Unsaved Changes', 'Please save or cancel your current changes first.');
      return;
    }
    setEditingApp(application.appName);
    setEditForm({ ...application });
  };

  const handleSave = async () => {
    if (!editForm) return;
    
    try {
      setIsLoading(true);
      
      // Create updated apps list
      const updatedApps = applications.map(app => 
        app.appName === editForm.appName ? editForm : app
      );
      
      // Call the backend to update the configuration
      const response = await fetch('/api/update-submission-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedApps),
      });

      if (!response.ok) {
        throw new Error(`Failed to update application: ${response.status}`);
      }
      
      // Update local state
      setApplications(updatedApps);
      
      showSuccess('Success', 'Application updated successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to update application:', error);
      showError('Update Failed', 'Failed to update the application.');
    } finally {
      setIsLoading(false);
      setEditingApp(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    setEditingApp(null);
    setEditForm(null);
    setHasUnsavedChanges(false);
  };

  const handleToggleStatus = async (appName: string) => {
    if (editingApp && hasUnsavedChanges) {
      showError('Unsaved Changes', 'Please save your changes first.');
      return;
    }

    try {
      const updatedApps = applications.map(app => 
        app.appName === appName 
          ? { ...app, disabled: !app.disabled }
          : app
      );
      
      // Call the backend to update the configuration
      const response = await fetch('/api/update-submission-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedApps),
      });

      if (!response.ok) {
        throw new Error(`Failed to update application status: ${response.status}`);
      }
      
      const app = applications.find(a => a.appName === appName);
      const newStatus = app?.disabled ? 'enabled' : 'disabled';
      
      // Filter out disabled apps from the view
      setApplications(updatedApps.filter(app => !app.disabled));
      
      showSuccess(
        'Status Updated', 
        `Application ${newStatus} successfully`
      );
    } catch (error) {
      console.error('Failed to toggle application status:', error);
      showError('Update Failed', 'Failed to update application status.');
    }
  };

  const handleDeleteClick = (appName: string) => {
    setDeleteDialog({
      isOpen: true,
      appName: appName
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const updatedApps = applications.filter(app => app.appName !== deleteDialog.appName);
      
      // Call the backend to update the configuration
      const response = await fetch('/api/update-submission-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedApps),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete application: ${response.status}`);
      }
      
      setApplications(updatedApps);
      showSuccess('Success', 'Application deleted successfully');
    } catch (error) {
      console.error('Failed to delete application:', error);
      showError('Delete Failed', 'Failed to delete the application.');
    } finally {
      setDeleteDialog({ isOpen: false, appName: '' });
    }
  };

  const handleFormChange = (field: keyof AppData, value: string | string[]) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
      setHasUnsavedChanges(true);
    }
  };

  const handleHostsChange = (value: string) => {
    if (editForm) {
      // Split by comma or newline and trim whitespace
      const hosts = value.split(/[,\n]/).map(host => host.trim()).filter(host => host.length > 0);
      setEditForm({ ...editForm, hosts });
      setHasUnsavedChanges(true);
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Power className="w-5 h-5 text-white" />
          </div>
          Applications Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Power className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Loading Applications...</h3>
            <p className="text-slate-500">Please wait while we fetch the application data.</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Applications Found</h3>
            <p className="text-slate-500">There are no applications to manage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application Name</TableHead>
                  <TableHead>Change Number</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Maintenance Window</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Infrastructure Impact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.appName}>
                    <TableCell>
                      {editingApp === app.appName ? (
                        <Input
                          value={editForm?.appName || ''}
                          onChange={(e) => handleFormChange('appName', e.target.value)}
                          className="min-w-[150px]"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Server className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{app.appName}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingApp === app.appName ? (
                        <Input
                          value={editForm?.changeNumber || ''}
                          onChange={(e) => handleFormChange('changeNumber', e.target.value)}
                          className="min-w-[120px]"
                        />
                      ) : (
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                          {app.changeNumber}
                        </code>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingApp === app.appName ? (
                        <Input
                          value={editForm?.applicationOwner || ''}
                          onChange={(e) => handleFormChange('applicationOwner', e.target.value)}
                          className="min-w-[120px]"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{app.applicationOwner}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingApp === app.appName ? (
                        <Input
                          value={editForm?.maintenanceWindow || ''}
                          onChange={(e) => handleFormChange('maintenanceWindow', e.target.value)}
                          className="min-w-[150px]"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{app.maintenanceWindow}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingApp === app.appName ? (
                        <Textarea
                          value={editForm?.changeDescription || ''}
                          onChange={(e) => handleFormChange('changeDescription', e.target.value)}
                          className="min-w-[200px] min-h-[60px]"
                          placeholder="Change description"
                        />
                      ) : (
                        <span className="text-slate-600 max-w-[200px] truncate block">
                          {app.changeDescription}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingApp === app.appName ? (
                        <Input
                          value={editForm?.infrastructureImpact || ''}
                          onChange={(e) => handleFormChange('infrastructureImpact', e.target.value)}
                          className="min-w-[120px]"
                        />
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {app.infrastructureImpact}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingApp === app.appName ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSave}
                              className="gap-1 hover:scale-105 transition-transform border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancel}
                              className="gap-1 hover:scale-105 transition-transform"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(app)}
                              className="gap-1 hover:scale-105 transition-transform"
                              disabled={editingApp !== null}
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(app.appName)}
                              className="gap-1 hover:scale-105 transition-transform border-amber-200 text-amber-600 hover:bg-amber-50"
                              disabled={editingApp !== null}
                            >
                              <PowerOff className="w-3 h-3" />
                              Disable
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(app.appName)}
                              className="gap-1 hover:scale-105 transition-transform border-rose-200 text-rose-600 hover:bg-rose-50"
                              disabled={editingApp !== null}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Expanded Edit Form for Hosts */}
            {editingApp && editForm && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Host Configuration for {editForm.appName}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Hosts (one per line or comma-separated)
                    </label>
                    <Textarea
                      value={editForm.hosts.join('\n')}
                      onChange={(e) => handleHostsChange(e.target.value)}
                      className="min-h-[120px] font-mono text-sm"
                      placeholder="server1.company.com&#10;server2.company.com&#10;server3.company.com"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Total hosts: {editForm.hosts.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, appName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        description="Are you sure you want to delete this application? This action cannot be undone."
        itemName={deleteDialog.appName}
      />
    </Card>
  );
};

export default ApplicationsManager;
