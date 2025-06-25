
import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Server, User, Clock, FileText, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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

interface EditApplicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: AppData | null;
  onSave: (updatedApp: AppData) => Promise<void>;
  isLoading?: boolean;
}

const EditApplicationDialog: React.FC<EditApplicationDialogProps> = ({
  isOpen,
  onClose,
  application,
  onSave,
  isLoading = false
}) => {
  const [editForm, setEditForm] = useState<AppData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (application) {
      setEditForm({ ...application });
      setHasChanges(false);
    }
  }, [application]);

  const handleFormChange = (field: keyof AppData, value: string | string[]) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
      setHasChanges(true);
    }
  };

  const handleHostsChange = (value: string) => {
    if (editForm) {
      const hosts = value.split(/[,\n]/).map(host => host.trim()).filter(host => host.length > 0);
      setEditForm({ ...editForm, hosts });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (editForm && hasChanges) {
      await onSave(editForm);
      setHasChanges(false);
      onClose();
    }
  };

  const handleClose = () => {
    setHasChanges(false);
    onClose();
  };

  if (!editForm) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            Edit Application: {editForm.appName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-slate-600" />
             Application Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="appName" className="text-sm font-medium text-slate-700">
                  Application Name
                </Label>
                <Input
                  id="appName"
                  value={editForm.appName}
                  onChange={(e) => handleFormChange('appName', e.target.value)}
                  className="bg-white"
                  placeholder="Enter application name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="changeNumber" className="text-sm font-medium text-slate-700">
                  Change Number
                </Label>
                <Input
                  id="changeNumber"
                  value={editForm.changeNumber}
                  onChange={(e) => handleFormChange('changeNumber', e.target.value)}
                  className="bg-white font-mono"
                  placeholder="CRQ1000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationOwner" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Application Owner
                </Label>
                <Input
                  id="applicationOwner"
                  value={editForm.applicationOwner}
                  onChange={(e) => handleFormChange('applicationOwner', e.target.value)}
                  className="bg-white"
                  placeholder="Owner name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceWindow" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Maintenance Window
                </Label>
                <Input
                  id="maintenanceWindow"
                  value={editForm.maintenanceWindow}
                  onChange={(e) => handleFormChange('maintenanceWindow', e.target.value)}
                  className="bg-white"
                  placeholder="Sat, 12:00 AM – 4:00 AM"
                />
              </div>
            </div>
          </div>

          {/* Change Description Section */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Change Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="changeDescription" className="text-sm font-medium text-slate-700">
                  Change Description
                </Label>
                <Textarea
                  id="changeDescription"
                  value={editForm.changeDescription}
                  onChange={(e) => handleFormChange('changeDescription', e.target.value)}
                  className="bg-white min-h-[100px] resize-none"
                  placeholder="Describe the changes being made..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="infrastructureImpact" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Infrastructure Impact
                </Label>
                <Input
                  id="infrastructureImpact"
                  value={editForm.infrastructureImpact}
                  onChange={(e) => handleFormChange('infrastructureImpact', e.target.value)}
                  className="bg-white"
                  placeholder="X servers affected"
                />
              </div>
            </div>
          </div>

          {/* Hosts Configuration Section */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-green-600" />
              Host Configuration
              <Badge variant="outline" className="bg-white text-green-700 border-green-300">
                {editForm.hosts.length} hosts
              </Badge>
            </h3>
            <div className="space-y-2">
              <Label htmlFor="hosts" className="text-sm font-medium text-slate-700">
                Hosts (one per line or comma-separated)
              </Label>
              <Textarea
                id="hosts"
                value={editForm.hosts.join('\n')}
                onChange={(e) => handleHostsChange(e.target.value)}
                className="bg-white min-h-[150px] font-mono text-sm resize-none"
                placeholder="server1.company.com&#10;server2.company.com&#10;server3.company.com"
              />
              <p className="text-xs text-slate-500">
                Enter each host on a new line or separate with commas
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {hasChanges && (
              <div className="flex items-center gap-1 text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                Unsaved changes
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditApplicationDialog;
