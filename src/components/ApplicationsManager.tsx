
import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Power, PowerOff, AlertCircle, Clock, User, Server, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToastContext } from '@/contexts/ToastContext';
import { loadApps } from '@/utils/testData';
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
}

const ApplicationsManager: React.FC = () => {
  const [applications, setApplications] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    application: AppData | null;
  }>({
    isOpen: false,
    application: null
  });
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
    setEditDialog({
      isOpen: true,
      application: application
    });
  };

  const handleSave = async (updatedApp: AppData) => {
    try {
      setIsLoading(true);
      
      // Create updated apps list
      const updatedApps = applications.map(app => 
        app.appName === updatedApp.appName ? updatedApp : app
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
    } catch (error) {
      console.error('Failed to update application:', error);
      showError('Update Failed', 'Failed to update the application.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (appName: string) => {
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

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Power className="w-5 h-5 text-white" />
          </div>
          Applications Management
          <Badge variant="outline" className="bg-white/50">
            {applications.length} apps
          </Badge>
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
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Application</TableHead>
                  <TableHead className="font-semibold text-slate-700">Change Info</TableHead>
                  <TableHead className="font-semibold text-slate-700">Owner & Schedule</TableHead>
                  <TableHead className="font-semibold text-slate-700">Impact</TableHead>
                  <TableHead className="font-semibold text-slate-700">Hosts</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app, index) => (
                  <TableRow key={app.appName} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Server className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{app.appName}</div>
                          <div className="text-sm text-slate-500 truncate max-w-[200px]">
                            {app.changeDescription}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                          {app.changeNumber}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{app.applicationOwner}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{app.maintenanceWindow}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {app.infrastructureImpact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Server className="w-3 h-3 text-slate-400" />
                        <Badge variant="secondary" className="text-xs">
                          {app.hosts.length} hosts
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(app)}
                          className="gap-1 hover:scale-105 transition-transform border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(app.appName)}
                          className="gap-1 hover:scale-105 transition-transform border-amber-200 text-amber-600 hover:bg-amber-50"
                        >
                          <PowerOff className="w-3 h-3" />
                          Disable
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(app.appName)}
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

      <EditApplicationDialog
        isOpen={editDialog.isOpen}
        onClose={() => setEditDialog({ isOpen: false, application: null })}
        application={editDialog.application}
        onSave={handleSave}
        isLoading={isLoading}
      />

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
