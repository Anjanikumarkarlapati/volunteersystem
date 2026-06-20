import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Clock,
  Code2,
  Copy,
  Download,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Star,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../components/DataTable.jsx';
import HeatmapChart from '../components/HeatmapChart.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { certificateService, profileService } from '../services/resources.js';
import Button from '../components/ui/Button.jsx';

const splitList = value =>
  value
    .split(',')
    .map(i => i.trim())
    .filter(Boolean);

const VOLUNTEER_TYPES = [
  {
    value: 'student',
    label: 'Student',
    Icon: GraduationCap,
    color: 'from-violet-500 to-purple-400',
  },
  { value: 'professor', label: 'Educator', Icon: BookOpen, color: 'from-blue-500 to-indigo-400' },
  {
    value: 'ngo_developer',
    label: 'NGO Developer',
    Icon: Code2,
    color: 'from-emerald-500 to-teal-400',
  },
  { value: 'ngo_staff', label: 'NGO Staff', Icon: Users, color: 'from-amber-500 to-orange-400' },
  {
    value: 'professional',
    label: 'Professional',
    Icon: Briefcase,
    color: 'from-rose-500 to-pink-400',
  },
  { value: 'other', label: 'Other', Icon: User, color: 'from-slate-500 to-slate-400' },
];

const AttendanceBadge = ({ status }) =>
  (
    ({
      attended: {
        cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        label: '✅ Present',
      },
      no_show: {
        cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
        label: '❌ Absent',
      },
      assigned: {
        cls: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
        label: '📋 Assigned',
      },
      cancelled: {
        cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        label: 'Cancelled',
      },
    })[status] || { cls: 'bg-primary-100 text-primary-700', label: status }
  )?.label;

function ProfileHero({ user, profile, onUpload, selectedType }) {
  const roleLabel = {
    admin: 'Administrator',
    organization: 'Organization',
    volunteer: 'Volunteer',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
      {/* Banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='5' cy='5' r='1.5'/%3E%3Ccircle cx='25' cy='25' r='1.5'/%3E%3Ccircle cx='45' cy='45' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Content */}
      <div className="px-6 pb-8 relative z-10">
        <div className="flex flex-col gap-4">
          {/* Avatar Row */}
          <div className="flex justify-between items-end -mt-16 sm:-mt-20">
            <div className="relative shrink-0">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt=""
                  className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg bg-white dark:bg-slate-900"
                />
              ) : (
                <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 border-4 border-white dark:border-slate-900 shadow-lg text-4xl font-black text-indigo-600 dark:text-indigo-400">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Camera className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <input className="hidden" type="file" accept="image/*" onChange={onUpload} />
              </label>
            </div>

            <div className="mb-2">
              <Badge status={profile?.user_status || (profile?.verified ? 'active' : 'pending')} />
            </div>
          </div>

          {/* Info Row */}
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
              >
                {user.name}
              </h2>
              <p className="flex items-center gap-1.5 text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs font-bold uppercase tracking-widest">
                {roleLabel[user.role] || user.role}
              </span>
              {selectedType && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <selectedType.Icon className="h-3.5 w-3.5" />
                  {selectedType.label}
                </span>
              )}
            </div>

            {(user.role === 'volunteer' || user.role === 'organization') && profile?.id && (
              <div className="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                    Your Unique ID
                  </span>
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                    {profile.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard
                        .writeText(profile.id)
                        .then(() => toast.success('ID copied!'))
                        .catch(() => toast.error('Failed to copy.'));
                    } else {
                      const inputEl = document.createElement('input');
                      inputEl.value = profile.id;
                      document.body.appendChild(inputEl);
                      inputEl.select();
                      try {
                        document.execCommand('copy');
                        toast.success('ID copied!');
                      } catch (err) {
                        toast.error('Failed to copy.');
                      }
                      document.body.removeChild(inputEl);
                    }
                  }}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  title="Copy ID"
                >
                  <Copy className="h-4 w-4" /> Copy ID
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [history, setHistory] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (user.role === 'volunteer') {
        const [profileData, certs, historyData, heatmapData] = await Promise.all([
          profileService.volunteer(),
          certificateService.mine(),
          profileService.history().catch(() => null),
          profileService.heatmap().catch(() => null),
        ]);
        setProfile(profileData);
        setCertificates(certs || []);
        setHistory(historyData);
        setHeatmap(heatmapData);
        setForm({
          phone: profileData.phone || '',
          location: profileData.location || '',
          bio: profileData.bio || '',
          skills: profileData.skills?.join(', ') || '',
          interests: profileData.interests?.join(', ') || '',
          volunteer_type: profileData.volunteer_type || '',
          institution: profileData.institution || '',
          field_of_study: profileData.field_of_study || '',
          linkedin_url: profileData.linkedin_url || '',
          github_url: profileData.github_url || '',
          availability: JSON.stringify(profileData.availability || {}, null, 2),
        });
      } else if (user.role === 'organization') {
        const profileData = await profileService.organization();
        setProfile(profileData);
        setForm({
          name: profileData.name || '',
          mission: profileData.mission || '',
          description: profileData.description || '',
          website: profileData.website || '',
          contact_phone: profileData.contact_phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
        });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load profile'));
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (user.role === 'admin') {
    return (
      <>
        <PageHeader
          eyebrow="Profile"
          title="Admin Account"
          description="Platform administrators manage users, organizations, and reports."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: User, label: 'Name', value: user.name, color: 'text-primary-500' },
            { icon: Mail, label: 'Email', value: user.email, color: 'text-primary-500' },
            { icon: Shield, label: 'Role', value: 'Administrator', color: 'text-rose-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="white-card p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  {label}
                </p>
                <p className="truncate font-bold text-on-surface mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user.role === 'volunteer')
        await profileService.updateVolunteer({
          ...form,
          skills: splitList(form.skills || ''),
          interests: splitList(form.interests || ''),
          availability: form.availability ? JSON.parse(form.availability) : {},
        });
      else await profileService.updateOrganization(form);
      toast.success('Profile saved');
      refreshMe();
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save profile'));
    } finally {
      setSaving(false);
    }
  };

  const upload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await profileService.uploadProfile(file);
      toast.success('Profile picture uploaded');
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Upload failed'));
    }
  };

  const downloadCertificate = async cert => {
    try {
      const blob = await certificateService.download(cert.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cert.certificate_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not download certificate'));
    }
  };

  const TABS =
    user.role === 'volunteer'
      ? [
          { id: 'profile', label: 'Profile', Icon: User },
          { id: 'history', label: 'Task History', Icon: Clock },
        ]
      : [{ id: 'profile', label: 'Organization', Icon: Building2 }];

  const selectedType = VOLUNTEER_TYPES.find(t => t.value === form.volunteer_type);

  const TypeSpecificFields = () => {
    if (!form.volunteer_type || form.volunteer_type === 'other') return null;
    const isStudent = form.volunteer_type === 'student';
    const isDeveloper = form.volunteer_type === 'ngo_developer';
    return (
      <div className="col-span-full rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-500/20 dark:bg-primary-900/10 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
          {selectedType?.label} Settings
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isStudent ? 'University / College' : 'Institution / Employer'}
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              placeholder="Enter institution name"
              value={form.institution || ''}
              onChange={e => setForm({ ...form, institution: e.target.value })}
            />
          </div>
          {isDeveloper && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                GitHub URL
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                placeholder="https://github.com/username"
                value={form.github_url || ''}
                onChange={e => setForm({ ...form, github_url: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              LinkedIn URL
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              placeholder="https://linkedin.com/in/username"
              value={form.linkedin_url || ''}
              onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
            />
          </div>
          {isStudent && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Field of Study
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                placeholder="Computer Science, Biology..."
                value={form.field_of_study || ''}
                onChange={e => setForm({ ...form, field_of_study: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title={user.role === 'organization' ? 'Organization Profile' : 'My Profile & Settings'}
        description="Manage your information, volunteer type, skills, and view your service history."
      />

      {!loading && (
        <ProfileHero user={user} profile={profile} onUpload={upload} selectedType={selectedType} />
      )}

      {user.role === 'volunteer' && profile && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Total Hours"
            value={Number(profile.total_hours || 0).toFixed(1)}
            tone="blue"
            index={0}
          />
          <StatCard
            icon={Award}
            label="Certificates"
            value={certificates.length}
            tone="amber"
            index={1}
          />
          <StatCard
            icon={Star}
            label="Events Done"
            value={history?.attendance?.filter(a => a.status === 'attended').length || 0}
            tone="emerald"
            index={2}
          />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80 flex flex-col items-center justify-center text-center">
            <Badge status={profile.user_status || (profile.verified ? 'active' : 'pending')} />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Account Status</p>
          </div>
        </div>
      )}

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/60 scrollbar-hide">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === id ? 'bg-white text-primary-700 shadow dark:bg-slate-700 dark:text-primary-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.form
            key="profile"
            className="space-y-5"
            onSubmit={save}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {user.role === 'volunteer' && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
                <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Volunteer Type</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {VOLUNTEER_TYPES.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          volunteer_type: form.volunteer_type === item.value ? '' : item.value,
                        })
                      }
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 hover:scale-[1.04] ${form.volunteer_type === item.value ? 'border-primary-500 bg-primary-50 dark:border-primary-500/60 dark:bg-primary-900/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'}`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white`}
                      >
                        <item.Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={`text-[11px] font-semibold text-center leading-tight ${form.volunteer_type === item.value ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
                {user.role === 'volunteer' ? 'Personal Information' : 'Organization Details'}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {user.role === 'volunteer' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-9 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                          placeholder="+1 (555) 000-0000"
                          value={form.phone || ''}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Location
                      </label>
                      <LocationPicker
                        value={form.location}
                        onChange={v => setForm({ ...form, location: v })}
                        placeholder="Select state & district…"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Skills
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        placeholder="React, Teaching, First Aid..."
                        value={form.skills || ''}
                        onChange={e => setForm({ ...form, skills: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Interests
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        placeholder="Education, Environment, Health..."
                        value={form.interests || ''}
                        onChange={e => setForm({ ...form, interests: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Bio
                      </label>
                      <textarea
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 min-h-24 resize-none"
                        placeholder="Tell us about yourself and your volunteering journey..."
                        value={form.bio || ''}
                        onChange={e => setForm({ ...form, bio: e.target.value })}
                      />
                    </div>
                    <TypeSpecificFields />
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Organization Name
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        value={form.name || ''}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Website
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        placeholder="https://..."
                        value={form.website || ''}
                        onChange={e => setForm({ ...form, website: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        value={form.contact_phone || ''}
                        onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Address
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        value={form.address || ''}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        City
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        value={form.city || ''}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        State / Province
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                        value={form.state || ''}
                        onChange={e => setForm({ ...form, state: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Mission Statement
                      </label>
                      <textarea
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 min-h-20 resize-none"
                        value={form.mission || ''}
                        onChange={e => setForm({ ...form, mission: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Description
                      </label>
                      <textarea
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 min-h-24 resize-none"
                        value={form.description || ''}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <Button variant="primary" className="w-full h-11 text-base" loading={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </motion.form>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
              <h3 className="mb-1 font-bold text-slate-900 dark:text-white">
                Volunteer Journey Heatmap
              </h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Activity patterns, quiet gaps, peak seasons, and churn risk based on completed
                attendance.
              </p>
              {heatmap ? (
                <HeatmapChart
                  weekly={heatmap.weekly || []}
                  monthly={heatmap.monthly || []}
                  churnRisk={heatmap.churn_risk || 'low'}
                  daysSinceLast={heatmap.days_since_last_event}
                />
              ) : (
                <p className="text-sm text-slate-400">Loading journey data...</p>
              )}
            </div>
            {history?.attendance?.length ? (
              <DataTable
                rows={history.attendance}
                columns={[
                  { key: 'event_title', label: 'Event' },
                  { key: 'organization_name', label: 'Organization' },
                  { key: 'status', label: 'Status', render: row => <Badge status={row.status} /> },
                  {
                    key: 'hours',
                    label: 'Hours',
                    render: row => (
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {Number(row.hours || 0).toFixed(1)} hrs
                      </span>
                    ),
                  },
                  {
                    key: 'start_at',
                    label: 'Date',
                    render: row =>
                      new Date(row.start_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }),
                  },
                ]}
              />
            ) : (
              <EmptyState
                icon={Clock}
                title="No task history yet"
                description="When you complete volunteer events, they'll appear here."
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
