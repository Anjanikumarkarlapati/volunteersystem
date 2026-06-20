import { motion } from 'framer-motion';
import { AlertTriangle, Bell, KeyRound, Save, ShieldCheck, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { settingsService } from '../services/resources.js';
import { getApiErrorMessage } from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${active ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/20 dark:text-primary-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ProfileSection({ user, profile, refreshMe }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateProfile({ name, email });
      await refreshMe();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Input
        label="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        minLength={2}
        maxLength={120}
      />
      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />

      {user?.role === 'volunteer' && profile && (
        <Card className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Volunteer Info</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Volunteer Type
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                {profile.volunteer_type || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Total Hours
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {Number(profile.total_hours || 0).toFixed(1)}
              </p>
            </div>
          </div>
          {profile.skills?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {user?.role === 'organization' && profile && (
        <Card className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Organization</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{profile.name}</p>
          {profile.website && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{profile.website}</p>
          )}
          {profile.city && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {profile.city}
              {profile.state ? `, ${profile.state}` : ''}
            </p>
          )}
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={saving}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async e => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await settingsService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not change password'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleChange} className="space-y-6">
      <Card className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold">Password tips</span>
        </div>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>Use at least 8 characters</li>
          <li>Mix letters, numbers, and symbols</li>
          <li>Avoid reusing passwords from other sites</li>
        </ul>
      </Card>
      <Input
        label="Current Password"
        type="password"
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
        required
      />
      <Input
        label="New Password"
        type="password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        required
        minLength={8}
      />
      <Input
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        required
      />
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={saving}>
          <KeyRound className="h-4 w-4" />
          Update Password
        </Button>
      </div>
    </form>
  );
}

const defaultPreferences = {
  email_notifications: true,
  push_notifications: true,
  weekly_digest: false,
  opportunity_alerts: true,
  event_reminders: true,
};

function NotificationsSection() {
  const [prefs, setPrefs] = useState(defaultPreferences);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.notification_preferences) {
      setPrefs(prev => ({ ...prev, ...user.notification_preferences }));
    }
    setLoaded(true);
  }, [user]);

  const toggle = key => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateNotificationPreferences({ notification_preferences: prefs });
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update preferences'));
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: 'email_notifications',
      label: 'Email Notifications',
      desc: 'Receive email updates about your activity',
    },
    {
      key: 'push_notifications',
      label: 'Push Notifications',
      desc: 'Receive in-app notifications',
    },
    {
      key: 'opportunity_alerts',
      label: 'Opportunity Alerts',
      desc: 'Get notified about new opportunities matching your interests',
    },
    {
      key: 'event_reminders',
      label: 'Event Reminders',
      desc: 'Reminders before upcoming events you are assigned to',
    },
    {
      key: 'weekly_digest',
      label: 'Weekly Digest',
      desc: 'A weekly summary of your volunteer activity',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        {items.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card dark:border-white/5 dark:bg-slate-900/80"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${prefs[key] ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        ))}
      </div>
      {loaded && (
        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={handleSave} loading={saving}>
            <Bell className="h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
}

function AccountSection({ onDelete }) {
  return (
    <div className="space-y-6">
      <Card className="border-rose-200/60 dark:border-rose-900/30">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Danger Zone</h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Once you delete your account, there is no going back. All your data will be
              permanently removed.
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={onDelete}
                className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 border-rose-200"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshMe, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { key: 'profile', label: 'Profile Info', icon: User },
    { key: 'password', label: 'Password', icon: KeyRound },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'account', label: 'Account', icon: ShieldCheck },
  ];

  const handleDelete = async () => {
    if (deleteConfirm.toLowerCase() !== 'delete') return;
    setDeleting(true);
    try {
      await settingsService.deleteAccount();
      toast.success('Account deleted');
      logout();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not delete account'));
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Account Settings"
        description="Manage your profile, security, and preferences."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon }) => (
          <TabButton
            key={key}
            active={activeTab === key}
            onClick={() => setActiveTab(key)}
            icon={icon}
            label={label}
          />
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'profile' && (
          <ProfileSection user={user} profile={user} refreshMe={refreshMe} />
        )}
        {activeTab === 'password' && <PasswordSection />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'account' && <AccountSection onDelete={() => setShowDeleteModal(true)} />}
      </motion.div>

      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirm('');
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="text-sm text-rose-700 dark:text-rose-300">
              This action is permanent and cannot be undone. Your profile, history, certificates,
              and all associated data will be deleted.
            </p>
          </div>
          <Input
            label='Type "delete" to confirm'
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="delete"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirm('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleteConfirm.toLowerCase() !== 'delete'}
              className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 border-rose-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
