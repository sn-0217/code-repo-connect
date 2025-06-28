import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Power, PowerOff, AlertCircle, Clock, User, Server, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToastContext } from '@/contexts/ToastContext';
import { loadApps, updateSubmissionConfig, updateApp, deleteApp } from '@/utils/testData';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import EditApplicationDialog from '@/components/EditApplicationDialog';

interface AppData {
  appName: string;
  changeNumber: string;
  applicationOwner: string;
  maintenanceWindow: string;
  changeDescription: string;
  infrastructureImpact: string;
  hosts: string[];
  disabled?: boolean;
  appStatus?: string;
}

const ApplicationsManager: React.FC = () => {
  const [applications, setApplications] = useState<AppData[]>([]);
  const [originalApplications, setOriginalApplications] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    application: AppData | null;
    isNew?: boolean;
  }>({
    isOpen: false,
    application: null,
    isNew: false
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    appName: string;
  }>({
    isOpen: false,
    appName: ''
  });
  const [statusToggleDialog, setStatusToggleDialog] = useState<{
    isOpen: boolean;
    appName: string;
    newStatus: string;
  }>({
    isOpen: false,
    appName: '',
    newStatus: ''
  });
  const { showError, showSuccess } = useToastContext();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    // Check if there are any changes (excluding status changes since they're handled via API)
    const hasChangesNow = JSON.stringify(applications) !== JSON.stringify(originalApplications);
    setHasChanges(hasChangesNow);
  }, [applications, originalApplications]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const apps = await loadApps();
      console.log('Loaded applications:', apps);
      setApplications(apps);
      setOriginalApplications(JSON.parse(JSON.stringify(apps))); // Deep copy
    } catch (error) {
      console.error('Failed to load applications:', error);
      showError('Failed to Load Applications', 'Unable to fetch application data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (application: AppData) => {
    setEditDialog({
      isOpen: true,
      application: application,
      isNew: false
    });
  };

  const handleAddNew = () => {
    const newApp: AppData = {
      appName: '',
      changeNumber: '',
      applicationOwner: '',
      maintenanceWindow: '',
      changeDescription: '',
      infrastructureImpact: '',
      hosts: [],
      disabled: false,
      appStatus: 'enabled'
    };
    
    setEditDialog({
      isOpen: true,
      application: newApp,
      isNew: true
    });
  };

  const handleSave = async (updatedApp: AppData) => {
    try {
      if (editDialog.isNew) {
        // Add new application
        const updatedApps = [...applications, updatedApp];
        setApplications(updatedApps);
      } else {
        // Update existing application
        const updatedApps = applications.map(app => 
          app.appName === updatedApp.appName ? updatedApp : app
        );
        setApplications(updatedApps);
      }
      showSuccess('Success', editDialog.isNew ? 'Application added successfully' : 'Application updated successfully');
    } catch (error) {
      console.error('Failed to save application:', error);
      showError('Save Failed', 'Failed to save the application.');
    }
  };

  const handleToggleStatusClick = (appName: string) => {
    const app = applications.find(a => a.appName === appName);
    if (!app) return;

    const isCurrentlyEnabled = app.appStatus === 'enabled' || (!app.appStatus && !app.disabled);
    const newStatus = isCurrentlyEnabled ? 'disabled' : 'enabled';

    setStatusToggleDialog({
      isOpen: true,
      appName: appName,
      newStatus: newStatus
    });
  };

  const handleToggleStatusConfirm = async () => {
    try {
      const appName = statusToggleDialog.appName;
      const newStatus = statusToggleDialog.newStatus;
      const app = applications.find(a => a.appName === appName);
      if (!app) return;

      // Make API call to update app status
      const response = await fetch(`/api/app/${encodeURIComponent(appName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...app,
          appStatus: newStatus,
          disabled: newStatus === 'disabled'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update app status: ${response.status}`);
      }

      // Update both applications and originalApplications to prevent change tracking for status changes
      const updatedApps = applications.map(a => 
        a.appName === appName ? { 
          ...a, 
          disabled: newStatus === 'disabled',
          appStatus: newStatus 
        } : a
      );
      setApplications(updatedApps);
      
      const updatedOriginalApps = originalApplications.map(a => 
        a.appName === appName ? { 
          ...a, 
          disabled: newStatus === 'disabled',
          appStatus: newStatus 
        } : a
      );
      setOriginalApplications(updatedOriginalApps);
      
      showSuccess('Success', `Application ${newStatus} successfully`);
    } catch (error) {
      console.error('Failed to update app status:', error);
      showError('Update Failed', 'Failed to update application status.');
    } finally {
      setStatusToggleDialog({ isOpen: false, appName: '', newStatus: '' });
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
      setApplications(updatedApps);
      showSuccess('Success', 'Application deleted successfully');
    } catch (error) {
      console.error('Failed to delete application:', error);
      showError('Delete Failed', 'Failed to delete the application.');
    } finally {
      setDeleteDialog({ isOpen: false, appName: '' });
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      console.log('Saving applications to backend:', applications);
      await updateSubmissionConfig(applications);
      setOriginalApplications(JSON.parse(JSON.stringify(applications)));
      setHasChanges(false);
      showSuccess('Success', 'All changes saved successfully');
      // Reload data to ensure consistency
      await fetchApplications();
    } catch (error) {
      console.error('Failed to save changes:', error);
      showError('Save Failed', 'Failed to save configuration changes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    setApplications(JSON.parse(JSON.stringify(originalApplications)));
    setHasChanges(false);
  };

  const getStatusBadge = (app: AppData) => {
    // Check appStatus first, then fall back to disabled field for backward compatibility
    const isEnabled = app.appStatus === 'enabled' || (!app.appStatus && !app.disabled);
    
    if (!isEnabled) {
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300">
          Disabled
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Active
      </Badge>
    );
  };

  const isAppEnabled = (app: AppData) => {
    // Check appStatus first, then fall back to disabled field for backward compatibility
    return app.appStatus === 'enabled' || (!app.appStatus && !app.disabled);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Power className="w-5 h-5 text-white" />
              </div>
              Applications Management
              <Badge variant="outline" className="bg-white/50">
                {applications.length} apps
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New App
              </Button>
              {hasChanges && (
                <>
                  <div className="flex items-center gap-2 text-amber-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Unsaved changes</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardChanges}
                    disabled={isLoading}
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !hasChanges ? (
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
              <p className="text-slate-500 mb-4">There are no applications to manage.</p>
              <Button onClick={handleAddNew} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 gap-2">
                <Plus className="w-4 h-4" />
                Add Your First App
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app) => (
                <Card key={app.appName} className="bg-white border-slate-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(app)}
                  </div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Server className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 truncate">{app.appName}</h3>
                        <p className="text-sm text-slate-500 mt-1">Application</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Change Number</p>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">{app.changeNumber}</code>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</p>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{app.applicationOwner}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hosts</p>
                        <div className="flex items-center gap-1">
                          <Server className="w-3 h-3 text-slate-400" />
                          <Badge variant="secondary" className="text-xs">
                            {app.hosts.length} hosts
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <Label htmlFor={`toggle-${app.appName}`} className="text-sm font-medium">
                          Enable Application
                        </Label>
                        <Switch
                          id={`toggle-${app.appName}`}
                          checked={isAppEnabled(app)}
                          onCheckedChange={() => handleToggleStatusClick(app.appName)}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(app)}
                          className="flex-1 gap-1 hover:scale-105 transition-transform border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(app.appName)}
                          className="gap-1 hover:scale-105 transition-transform border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditApplicationDialog
        isOpen={editDialog.isOpen}
        onClose={() => setEditDialog({ isOpen: false, application: null, isNew: false })}
        application={editDialog.application}
        onSave={handleSave}
        isLoading={isLoading}
        isNew={editDialog.isNew}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, appName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        description="Are you sure you want to delete this application? This action cannot be undone."
        itemName={deleteDialog.appName}
      />

      <Dialog open={statusToggleDialog.isOpen} onOpenChange={() => setStatusToggleDialog({ isOpen: false, appName: '', newStatus: '' })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusToggleDialog.newStatus === 'enabled' ? (
                <Power className="w-5 h-5 text-green-600" />
              ) : (
                <PowerOff className="w-5 h-5 text-red-600" />
              )}
              {statusToggleDialog.newStatus === 'enabled' ? 'Enable' : 'Disable'} Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {statusToggleDialog.newStatus === 'enabled' ? 'enable' : 'disable'} the application "{statusToggleDialog.appName}"?
              {statusToggleDialog.newStatus === 'disabled' && ' This will stop the application from running.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setStatusToggleDialog({ isOpen: false, appName: '', newStatus: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatusConfirm}
              className={statusToggleDialog.newStatus === 'enabled' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
              }
            >
              {statusToggleDialog.newStatus === 'enabled' ? 'Enable' : 'Disable'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsManager;
