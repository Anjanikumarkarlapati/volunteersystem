import { Copy, Plus, RefreshCw, Shield, Trophy, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Input, { Textarea } from '../components/ui/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { profileService, squadService } from '../services/resources.js';
import Modal from '../components/ui/Modal.jsx';

const getInitials = (name = '') =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'VM';

export default function SquadsPage() {
  const { profile } = useAuth();
  const [volunteerProfile, setVolunteerProfile] = useState(profile);
  const [squads, setSquads] = useState([]);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateSquadModalOpen, setIsCreateSquadModalOpen] = useState(false);

  const loadSquads = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, list] = await Promise.all([
        profileService.volunteer().catch(() => profile),
        squadService.list(),
      ]);
      setVolunteerProfile(profileData);
      const rows = list.data || [];
      setSquads(rows);
      if (rows.length) {
        const currentId = selectedSquad?.id || rows[0].id;
        const detail = await squadService.get(currentId);
        setSelectedSquad(detail);
      } else {
        setSelectedSquad(null);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load squads'));
    } finally {
      setLoading(false);
    }
  }, [profile, selectedSquad?.id]);

  useEffect(() => {
    loadSquads();
  }, [loadSquads]);

  const createSquad = async event => {
    event.preventDefault();
    setCreating(true);
    try {
      const squad = await squadService.create(form);
      toast.success('Squad created');
      setForm({ name: '', description: '' });
      setSelectedSquad(squad);
      await loadSquads();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create squad'));
    } finally {
      setCreating(false);
    }
  };

  const addMember = async event => {
    event.preventDefault();
    if (!selectedSquad?.id) return;
    setAdding(true);
    try {
      const squad = await squadService.addMember(selectedSquad.id, {
        volunteer_id: memberId.trim(),
      });
      toast.success('Volunteer added to squad');
      setMemberId('');
      setSelectedSquad(squad);
      setIsAddMemberModalOpen(false);
      await loadSquads();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not add volunteer'));
    } finally {
      setAdding(false);
    }
  };

  const selectSquad = async squad => {
    try {
      setSelectedSquad(await squadService.get(squad.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not open squad'));
    }
  };

  const copyVolunteerId = () => {
    if (!volunteerProfile?.id) return;
    navigator.clipboard.writeText(volunteerProfile.id);
    toast.success('Volunteer ID copied');
  };

  const leaderboard = useMemo(() => {
    return [...(selectedSquad?.members || [])].sort(
      (a, b) => Number(b.total_hours || 0) - Number(a.total_hours || 0)
    );
  }, [selectedSquad]);

  const myRole = useMemo(() => {
    return (
      selectedSquad?.members?.find(m => m.volunteer_id === volunteerProfile?.id)?.role || 'member'
    );
  }, [selectedSquad, volunteerProfile]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team Volunteering"
        title="Build your squad"
        description="Create a team, invite volunteers with their IDs, and track collective hours here."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Your volunteer ID"
              subtitle="Share this ID with a squad captain so they can add you."
              action={
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={copyVolunteerId}
                  disabled={!volunteerProfile?.id}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              }
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {volunteerProfile?.id || 'Loading volunteer ID...'}
            </div>
          </Card>

          <Card>
            <CardHeader title="Create a squad" subtitle="Start a team and become its captain." />
            <form className="space-y-4" onSubmit={createSquad}>
              <Input
                label="Squad name"
                value={form.name}
                onChange={event => setForm({ ...form, name: event.target.value })}
                placeholder="Weekend Change Makers"
                required
              />
              <Textarea
                label="Purpose"
                value={form.description}
                onChange={event => setForm({ ...form, description: event.target.value })}
                placeholder="Friends volunteering together every month..."
                rows={3}
              />
              <Button className="w-full" loading={creating}>
                <Plus className="h-4 w-4" /> Create Squad
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="My squads"
              subtitle="Choose a squad to manage or view."
              action={
                <Button variant="ghost" size="xs" onClick={loadSquads} loading={loading}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              }
            />
            {squads.length ? (
              <div className="space-y-2">
                {squads.map(squad => (
                  <button
                    key={squad.id}
                    type="button"
                    onClick={() => selectSquad(squad)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                      selectedSquad?.id === squad.id
                        ? 'border-primary-300 bg-primary-50 text-primary-800 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-primary-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{squad.name}</span>
                      <span className="text-xs font-semibold">{squad.member_count} members</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {Number(squad.total_hours || 0).toFixed(1)} team hours
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No squads yet"
                description="Create your first squad to invite teammates."
                compact
              />
            )}
          </Card>
        </div>

        {selectedSquad ? (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden" padding={false}>
              <div className="bg-gradient-to-r from-primary-600 via-violet-600 to-slate-900 p-6 text-white">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                      <Shield className="h-3.5 w-3.5" /> Squad Impact
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight">
                      {selectedSquad.name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-white/75">
                      {selectedSquad.description ||
                        'A focused volunteer squad building shared accountability and friendly momentum.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Badge status={myRole} />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 mt-2 transition-all"
                      onClick={() => setIsAddMemberModalOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Member
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                {[
                  {
                    label: 'Squad hours',
                    value: Number(selectedSquad.impact?.total_hours || 0).toFixed(1),
                  },
                  { label: 'Completed tasks', value: selectedSquad.impact?.completed_events || 0 },
                  { label: 'Members', value: selectedSquad.members?.length || 0 },
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-1">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Squad Members
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Invite new volunteers to your squad using their ID.
                  </p>
                </div>
                <Button onClick={() => setIsAddMemberModalOpen(true)} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" /> Add Member by ID
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Squad leaderboard"
                subtitle="Friendly competition based on completed volunteer hours."
                action={
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setIsAddMemberModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Member
                  </Button>
                }
              />
              <div className="space-y-3">
                {leaderboard.map((member, index) => (
                  <div
                    key={member.volunteer_id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 text-sm font-black text-white">
                      {index === 0 ? <Trophy className="h-5 w-5" /> : getInitials(member.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {member.name}
                        </p>
                        {member.role === 'captain' && <Badge status="captain" />}
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {member.volunteer_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary-600 dark:text-primary-300">
                        {Number(member.total_hours || 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {member.completed_events || 0} tasks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ) : (
          <Card className="flex min-h-[420px] items-center justify-center">
            <EmptyState
              icon={Users}
              title="Build your squad"
              description="Create a team, invite volunteers with their IDs, and track collective hours here."
              actionLabel="Create a squad"
              onAction={() => setIsCreateSquadModalOpen(true)}
            />
          </Card>
        )}
      </div>

      <Modal
        open={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setMemberId('');
        }}
        title="Add Squad Member"
        subtitle="Invite a volunteer by pasting their Volunteer ID."
      >
        <form className="space-y-4" onSubmit={addMember}>
          <Input
            label="Volunteer ID"
            className="font-mono"
            value={memberId}
            onChange={event => setMemberId(event.target.value)}
            placeholder="Paste volunteer UUID"
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddMemberModalOpen(false);
                setMemberId('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={adding}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isCreateSquadModalOpen}
        onClose={() => {
          setIsCreateSquadModalOpen(false);
          setForm({ name: '', description: '' });
        }}
        title="Create a Squad"
        subtitle="Start a team and become its captain."
      >
        <form
          className="space-y-4"
          onSubmit={async e => {
            await createSquad(e);
            setIsCreateSquadModalOpen(false);
          }}
        >
          <Input
            label="Squad name"
            value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })}
            placeholder="Weekend Change Makers"
            required
          />
          <Textarea
            label="Purpose"
            value={form.description}
            onChange={event => setForm({ ...form, description: event.target.value })}
            placeholder="Friends volunteering together every month..."
            rows={3}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsCreateSquadModalOpen(false);
                setForm({ name: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              <Plus className="h-4 w-4 mr-2" /> Create Squad
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
