import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '@/contexts/ToastContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import HomeHeader from '@/components/HomeHeader';
import HomeHero from '@/components/HomeHero';
import ApplicationsGrid from '@/components/ApplicationsGrid';
import HomeFooter from '@/components/HomeFooter';
import { loadApps, loadSubmissions } from '../utils/testData';

interface AppStatus {
  text: string;
  color: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
}

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

const Home = () => {
  const navigate = useNavigate();
  const { showError } = useToastContext();
  const { currentEnv } = useEnvironment();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load apps and submissions from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Starting API calls to Spring Boot backend...');

        // Load apps
        const appsData: AppData[] = await loadApps();
        console.log('Apps data received:', appsData);

        // Filter only enabled apps and extract app names
        const enabledApps = appsData.filter((app: AppData) => {
          // Check appStatus first, then fall back to disabled field for backward compatibility
          const isEnabled = app.appStatus ? app.appStatus === 'enabled' : !app.disabled;
          return isEnabled;
        });
        
        const appNames = enabledApps.map((app: AppData) => app.appName);
        setApps(appNames);
        console.log('Enabled app names extracted:', appNames);

        // Load submissions
        const submissionsData = await loadSubmissions();
        console.log('Submissions data received:', submissionsData);

        // Transform backend submissions to frontend format
        const transformedSubmissions = submissionsData.map((submission: any, index: number) => ({
          id: `${submission.appData.appName}-${submission.formSubmission.changeNumber}-${index}`,
          appName: submission.appData.appName,
          changeNo: submission.formSubmission.changeNumber,
          approverName: submission.formSubmission.approverName,
          approverEmail: submission.formSubmission.approverEmail,
          decision: submission.formSubmission.decision,
          timestamp: submission.submittedAt,
          comments: submission.formSubmission.comments,
          startTime: submission.formSubmission.startTime,
          endTime: submission.formSubmission.endTime,
          environment: submission.formSubmission.environment
        }));

        // Filter by current environment and only show submissions for enabled apps
        const envSubmissions = transformedSubmissions.filter((s: any) => 
          s.environment === currentEnv && appNames.includes(s.appName)
        );
        setSubmissions(envSubmissions);
        console.log('Filtered submissions for enabled apps in environment:', envSubmissions);

      } catch (err) {
        console.error('API Error:', err);
        setError('Failed to connect to backend server');
        showError(
          'Backend Connection Failed',
          'Could not connect to the Spring Boot backend. Please ensure the server is running.'
        );
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchData();
  }, [showError, currentEnv]);

  const getAppStatus = (appName: string): AppStatus => {
    // Filter submissions for this app
    const appSubmissions = submissions.filter(s => s.appName === appName);
    
    // If no submissions found, return 'No Changes' status
    if (appSubmissions.length === 0) {
      return {
        text: 'No Changes',
        color: 'text-slate-600',
        icon: <Activity className="w-4 h-4" />,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200'
      };
    }
    
    // Sort submissions by timestamp (newest first) and get the latest one
    const latestSubmission = appSubmissions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    // Return status based on the decision of the latest submission
    switch (latestSubmission.decision) {
      case 'Approved':
        return {
          text: 'Approved',
          color: 'text-emerald-700',
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200'
        };
      case 'Rejected':
        return {
          text: 'Rejected',
          color: 'text-rose-700',
          icon: <XCircle className="w-4 h-4" />,
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200'
        };
      case 'Timed':
        return {
          text: 'Timed Approval',
          color: 'text-amber-700',
          icon: <Clock className="w-4 h-4" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      default:
        return {
          text: 'Pending',
          color: 'text-slate-600',
          icon: <Activity className="w-4 h-4" />,
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200'
        };
    }
  };

  const filteredApps = apps.filter(app => app.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.localeCompare(b));

  const handleAppClick = (appName: string) => {
    const appSubmissions = submissions.filter(s => s.appName === appName);
    if (appSubmissions.length === 0) {
      navigate(`/app/${encodeURIComponent(appName)}`);
      return;
    }

    const hasValidSubmissions = appSubmissions.some(s => s.decision === 'Approved' || s.decision === 'Rejected' || s.decision === 'Timed');
    if (hasValidSubmissions) {
      navigate(`/submissions?search=${encodeURIComponent(appName)}`);
    } else {
      navigate(`/app/${encodeURIComponent(appName)}`);
    }
  };

  const handleStatusClick = (appName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const appSubmissions = submissions.filter(s => s.appName === appName);
    if (appSubmissions.length === 0) {
      navigate(`/app/${encodeURIComponent(appName)}`);
      return;
    }

    const hasValidSubmissions = appSubmissions.some(s => s.decision === 'Approved' || s.decision === 'Rejected' || s.decision === 'Timed');
    if (hasValidSubmissions) {
      navigate(`/submissions?search=${encodeURIComponent(appName)}`);
    } else {
      navigate(`/app/${encodeURIComponent(appName)}`);
    }
  };

  const handleViewSubmissions = () => {
    navigate('/submissions');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100" data-page="home">
      <HomeHeader
        currentEnv={currentEnv}
        onViewSubmissions={handleViewSubmissions}
        onAdminClick={handleAdminClick}
      />

      <div className="max-w-7xl mx-auto px-6 py-8" data-main="home-content">
        <HomeHero />

        <ApplicationsGrid
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isLoading}
          error={error}
          filteredApps={filteredApps}
          getAppStatus={getAppStatus}
          handleAppClick={handleAppClick}
          handleStatusClick={handleStatusClick}
        />
      </div>

      <HomeFooter />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
