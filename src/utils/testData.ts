// API calls for Spring Boot backend
export const loadApps = async () => {
  try {
    const response = await fetch('/api/get-apps');
    if (!response.ok) {
      throw new Error(`Failed to load applications: ${response.status}`);
    }
    const data = await response.json();
    console.log('Apps API response:', data);
    return data;
  } catch (error) {
    console.error('Error loading apps:', error);
    throw error;
  }
};

export const loadSubmissions = async () => {
  try {
    const response = await fetch('/api/get-all-submissions');
    if (!response.ok) {
      throw new Error(`Failed to load submissions: ${response.status}`);
    }
    const data = await response.json();
    console.log('Submissions API response:', data);
    return data;
  } catch (error) {
    console.error('Error loading submissions:', error);
    throw error;
  }
};

export const loadEnvironment = async () => {
  try {
    const response = await fetch('/api/environment');
    if (!response.ok) {
      throw new Error(`Failed to load environment: ${response.status}`);
    }
    const data = await response.json();
    console.log('Environment API response:', data);
    return data;
  } catch (error) {
    console.error('Error loading environment:', error);
    throw error;
  }
};

export const createSubmission = async (submission: any) => {
  try {
    const response = await fetch(`/api/app/${encodeURIComponent(submission.appName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });
    if (!response.ok) {
      throw new Error(`Failed to create submission: ${response.status}`);
    }
    const data = await response.text(); // Your controller returns a String
    console.log('Submission API response:', data);
    return data;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

export const updateSubmission = async (id: string, submission: any) => {
  try {
    const response = await fetch(`/api/submission/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });
    if (!response.ok) {
      throw new Error(`Failed to update submission: ${response.status}`);
    }
    const data = await response.text();
    console.log('Update submission API response:', data);
    return data;
  } catch (error) {
    console.error('Error updating submission:', error);
    throw error;
  }
};

export const deleteSubmission = async (id: string) => {
  try {
    const response = await fetch(`/api/submission/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete submission: ${response.status}`);
    }
    const data = await response.text();
    console.log('Delete submission API response:', data);
    return data;
  } catch (error) {
    console.error('Error deleting submission:', error);
    throw error;
  }
};

export const updateSubmissionConfig = async (config: any) => {
  try {
    const response = await fetch('/api/update-submission-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(`Failed to update submission config: ${response.status}`);
    }
    const data = await response.text();
    console.log('Update submission config API response:', data);
    return data;
  } catch (error) {
    console.error('Error updating submission config:', error);
    throw error;
  }
};

export const updateApp = async (appName: string, appData: any) => {
  try {
    const response = await fetch(`/api/app/${encodeURIComponent(appName)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update app: ${response.status}`);
    }
    const data = await response.text();
    console.log('Update app API response:', data);
    return data;
  } catch (error) {
    console.error('Error updating app:', error);
    throw error;
  }
};

export const deleteApp = async (appName: string) => {
  try {
    const response = await fetch(`/api/app/${encodeURIComponent(appName)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete app: ${response.status}`);
    }
    const data = await response.text();
    console.log('Delete app API response:', data);
    return data;
  } catch (error) {
    console.error('Error deleting app:', error);
    throw error;
  }
};
