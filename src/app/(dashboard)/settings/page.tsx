'use client'

import { useState, useEffect } from 'react'
import { Save, Github, Linkedin, Trash2, Download, Bell, BellOff, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert } from '@/components/ui/alert'
import { Dialog } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { calculateProfileCompleteness } from '@/lib/utils'
import { APP_CONFIG } from '@/config/site'
import type { AvailabilityMode, GoalType, IntensityLevel } from '@/types/models'

const ALL_SKILLS = [
  'React', 'Next.js', 'Vue', 'Angular', 'TypeScript', 'JavaScript',
  'Python', 'FastAPI', 'Django', 'Node.js', 'Go', 'Rust', 'Java', 'Spring Boot',
  'PostgreSQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'LangChain', 'OpenAI',
  'Solidity', 'Web3.js', 'Hardhat', 'Foundry',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform', 'CI/CD',
  'Figma', 'UI/UX', 'Product',
]

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Pune', 'Kolkata']
const YEARS: { value: number; label: string }[] = [
  { value: 1, label: '1st year' },
  { value: 2, label: '2nd year' },
  { value: 3, label: '3rd year' },
  { value: 4, label: '4th year' },
  { value: 5, label: 'Grad / PG' },
]
const INTENSITIES: { value: IntensityLevel; label: string }[] = [
  { value: 'casual', label: 'Casual — 1-2 hrs/day' },
  { value: 'serious', label: 'Serious — 3-5 hrs/day' },
  { value: 'grind', label: 'All-in — 8+ hrs/day' },
]
const GOALS: { value: GoalType; label: string }[] = [
  { value: 'win', label: 'Win prizes' },
  { value: 'balanced', label: 'Compete seriously and learn' },
  { value: 'learn', label: 'Learn new technologies' },
]
const AVAILABILITIES: { value: AvailabilityMode; label: string }[] = [
  { value: 'offline_city', label: 'Offline within my city' },
  { value: 'willing_to_travel', label: 'Willing to travel for finals' },
  { value: 'online_only', label: 'Online only' },
]

interface SettingsForm {
  full_name: string
  college: string
  year: number
  branch: string
  city_name: string
  linkedin_url: string
  github_url: string
  bio: string
  skills: string[]
  goals: GoalType
  intensity: IntensityLevel
  availability: AvailabilityMode
  looking_for_skills: string[]
  preferred_team_size: number
  open_to_remote: boolean
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications()

  const [form, setForm] = useState<SettingsForm>({
    full_name: '',
    college: '',
    year: 0,
    branch: '',
    city_name: '',
    linkedin_url: '',
    github_url: '',
    bio: '',
    skills: [],
    goals: 'balanced',
    intensity: 'serious',
    availability: 'offline_city',
    looking_for_skills: [],
    preferred_team_size: 4,
    open_to_remote: true,
  })

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [syncingGithub, setSyncingGithub] = useState(false)
  const [githubSyncMsg, setGithubSyncMsg] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile')

  // Completeness based on current form
  const completeness = calculateProfileCompleteness({
    name: form.full_name,
    college: form.college,
    year: form.year,
    branch: form.branch,
    city_name: form.city_name,
    linkedin_url: form.linkedin_url,
    github_url: form.github_url,
    skills: form.skills.map((s, idx) => ({
      id: `skill-${idx}`,
      profile_id: 'pending',
      skill_id: s,
      proficiency: 3,
      is_primary: idx === 0,
    })),
    goals: form.goals,
    intensity: form.intensity,
    availability: form.availability,
  })

  // Load the stored profile so the form shows the real values.
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' })
        if (!res.ok) throw new Error('profile unavailable')

        const body = await res.json()
        if (cancelled || !body.profile) return

        const existing = body.profile
        setForm(prev => ({
          ...prev,
          full_name: existing.name ?? '',
          college: existing.college ?? '',
          year: existing.year ?? 0,
          branch: existing.branch ?? '',
          city_name: existing.city_name ?? '',
          linkedin_url: existing.linkedin_url ?? '',
          github_url: existing.github_url ?? '',
          bio: existing.bio ?? '',
          skills: (existing.skills ?? []).map((s: any) => s.skill_name).filter(Boolean),
          goals: existing.goals ?? prev.goals,
          intensity: existing.intensity ?? prev.intensity,
          availability: existing.availability ?? prev.availability,
        }))
      } catch {
        if (!cancelled) setSaveError('Your profile could not be loaded.')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user])

  const update = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaveSuccess(false)
  }

  const toggleSkill = (skill: string, field: 'skills' | 'looking_for_skills') => {
    setForm(prev => {
      const current = prev[field]
      const next = current.includes(skill)
        ? current.filter(s => s !== skill)
        : current.length < 10 ? [...current, skill] : current
      return { ...prev, [field]: next }
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.full_name,
          college: form.college,
          year: form.year || undefined,
          branch: form.branch,
          bio: form.bio,
          linkedinUrl: form.linkedin_url,
          githubUrl: form.github_url,
          goals: form.goals,
          intensity: form.intensity,
          availability: form.availability,
          lookingForSkills: form.looking_for_skills,
          preferredTeamSize: form.preferred_team_size,
          openToRemote: form.open_to_remote,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save.')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleGithubSync() {
    setSyncingGithub(true)
    setGithubSyncMsg('')
    try {
      const res = await fetch('/api/profile/sync-github', { method: 'POST' })
      const data = await res.json()
      setGithubSyncMsg(data.message ?? 'Synced successfully')
    } catch {
      setGithubSyncMsg('Sync failed — check your GitHub URL')
    } finally {
      setSyncingGithub(false)
    }
  }

  async function handleDataExport() {
    const res = await fetch('/api/user/export-data')
    if (!res.ok) {
      setSaveError('Data export requires an active session. Sign in and try again.')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hackpact-data-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
      if (!res.ok) {
        setDeleting(false)
        setSaveError('Account deletion requires an active session. Sign in and try again.')
        return
      }
      await signOut()
    } catch {
      setDeleting(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy & Data' },
  ] as const

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-white/40 text-sm mt-1">Manage your profile and preferences</p>
        </div>

        {/* Profile completeness */}
        <Card variant="default" className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Profile completeness</span>
              <span className={`text-sm font-black ${completeness >= 80 ? 'text-[#B8F2C9]' : 'text-white'}`}>
                {completeness}%
              </span>
            </div>
            <Progress value={completeness} max={100} />
            {completeness < 80 && (
              <p className="text-white/40 text-xs mt-2">
                {APP_CONFIG.minProfileCompleteness - completeness}% more needed to unlock matching
              </p>
            )}
            {completeness >= 80 && (
              <p className="text-[#B8F2C9] text-xs mt-2">✓ Matching unlocked</p>
            )}
          </CardContent>
        </Card>

        {/* Tab nav */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#B8F2C9] text-[#B8F2C9]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card variant="black">
              <CardHeader>
                <h2 className="text-white font-bold">Basic Info</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Full name *"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  placeholder="Riya Sharma"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="College / University *"
                    value={form.college}
                    onChange={e => update('college', e.target.value)}
                    placeholder="IIT Hyderabad"
                  />
                  <Input
                    label="Branch / Major"
                    value={form.branch}
                    onChange={e => update('branch', e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/60 text-xs font-medium mb-1.5">Year *</label>
                    <select
                      value={form.year}
                      onChange={e => update('year', Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8F2C9]/50"
                    >
                      <option value={0}>Select year</option>
                      {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs font-medium mb-1.5">City *</label>
                    <select
                      value={form.city_name}
                      onChange={e => update('city_name', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8F2C9]/50"
                    >
                      <option value="">Select city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <Textarea
                  label="Bio"
                  value={form.bio}
                  onChange={e => update('bio', e.target.value)}
                  placeholder="Tell potential teammates about yourself — your background, what excites you, and what you bring to a team."
                  rows={3}
                  helperText="Keep it genuine and specific. 2-4 sentences is perfect."
                />
              </CardContent>
            </Card>

            {/* Links */}
            <Card variant="black">
              <CardHeader>
                <h2 className="text-white font-bold">Verification Links</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Required for matching. GitHub lets us verify your skills automatically.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label={<span className="flex items-center gap-1"><Github className="h-3 w-3" /> GitHub URL *</span>}
                      value={form.github_url}
                      onChange={e => update('github_url', e.target.value)}
                      placeholder="https://github.com/yourusername"
                      type="url"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGithubSync}
                    disabled={!form.github_url || syncingGithub}
                    className="flex-shrink-0 border-white/20 text-white hover:bg-white/10 mb-0"
                  >
                    {syncingGithub ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sync'}
                  </Button>
                </div>
                {githubSyncMsg && (
                  <p className="text-white/60 text-xs">{githubSyncMsg}</p>
                )}
                <Input
                  label={<span className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn URL *</span>}
                  value={form.linkedin_url}
                  onChange={e => update('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  type="url"
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card variant="black">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold">Your Skills</h2>
                  <span className="text-white/40 text-xs">{form.skills.length}/10 selected</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALL_SKILLS.map(skill => {
                    const selected = form.skills.includes(skill)
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill, 'skills')}
                        className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-[#B8F2C9] text-black border-[#B8F2C9]'
                            : 'bg-transparent text-white/60 border-white/20 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Looking for */}
            <Card variant="black">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold">Looking for</h2>
                  <span className="text-white/40 text-xs">{form.looking_for_skills.length}/5</span>
                </div>
                <p className="text-white/40 text-xs mt-0.5">
                  Skills you want in your teammates (for better matching)
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALL_SKILLS.map(skill => {
                    const selected = form.looking_for_skills.includes(skill)
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill, 'looking_for_skills')}
                        className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                          selected
                            ? 'border-white text-white bg-white/10'
                            : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white/60'
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card variant="black">
              <CardHeader>
                <h2 className="text-white font-bold">Hackathon Preferences</h2>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Goal */}
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2">Primary goal *</label>
                  <div className="grid grid-cols-1 gap-2">
                    {GOALS.map(g => (
                      <button
                        key={g.value}
                        onClick={() => update('goals', g.value)}
                        className={`text-left px-4 py-3 text-sm border transition-colors ${
                          form.goals === g.value
                            ? 'border-[#B8F2C9] bg-[#B8F2C9]/10 text-white'
                            : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2">Work intensity *</label>
                  <div className="grid grid-cols-1 gap-2">
                    {INTENSITIES.map(i => (
                      <button
                        key={i.value}
                        onClick={() => update('intensity', i.value)}
                        className={`text-left px-4 py-3 text-sm border transition-colors ${
                          form.intensity === i.value
                            ? 'border-[#B8F2C9] bg-[#B8F2C9]/10 text-white'
                            : 'border-white/10 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2">Hackathon mode availability *</label>
                  <div className="grid grid-cols-1 gap-2">
                    {AVAILABILITIES.map(a => (
                      <button
                        key={a.value}
                        onClick={() => update('availability', a.value)}
                        className={`text-left px-4 py-3 text-sm border transition-colors ${
                          form.availability === a.value
                            ? 'border-[#B8F2C9] bg-[#B8F2C9]/10 text-white'
                            : 'border-white/10 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remote */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Open to remote hackathons</p>
                    <p className="text-white/40 text-xs">Include online-only hackathons in matches</p>
                  </div>
                  <button
                    onClick={() => update('open_to_remote', !form.open_to_remote)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      form.open_to_remote ? 'bg-[#B8F2C9]' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                        form.open_to_remote ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Team size */}
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2">
                    Preferred team size: <strong className="text-white">{form.preferred_team_size}</strong>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={6}
                    value={form.preferred_team_size}
                    onChange={e => update('preferred_team_size', Number(e.target.value))}
                    className="w-full accent-[#B8F2C9]"
                  />
                  <div className="flex justify-between text-white/30 text-xs mt-1">
                    <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save button */}
            {saveError && <Alert status="error" title="Could not save">{saveError}</Alert>}
            {saveSuccess && (
              <Alert status="success" title="Saved!">
                Your profile has been updated.
              </Alert>
            )}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : saveSuccess ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save changes'}
            </Button>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ──────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <Card variant="black">
              <CardHeader>
                <h2 className="text-white font-bold">Push Notifications</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Get notified about new match requests, messages, and team events.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {permission === 'unsupported' ? (
                  <Alert status="info" title="Not supported">
                    Push notifications are not supported in this browser.
                  </Alert>
                ) : permission === 'denied' ? (
                  <Alert status="warning" title="Notifications blocked">
                    You blocked notifications. Go to browser settings, then Site permissions to re-enable.
                  </Alert>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isSubscribed ? (
                        <Bell className="h-5 w-5 text-[#B8F2C9]" />
                      ) : (
                        <BellOff className="h-5 w-5 text-white/40" />
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">
                          {isSubscribed ? 'Notifications enabled' : 'Notifications disabled'}
                        </p>
                        <p className="text-white/40 text-xs">
                          {isSubscribed
                            ? 'You will receive match and message alerts'
                            : 'Enable to never miss a match request'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={isSubscribed ? 'outline' : 'primary'}
                      size="sm"
                      onClick={isSubscribed ? unsubscribe : subscribe}
                      className={isSubscribed ? 'border-white/20 text-white hover:bg-white/10' : ''}
                    >
                      {isSubscribed ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4 space-y-3">
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wide">
                    What you&apos;ll get notified about
                  </p>
                  {[
                    'Someone accepts your match request',
                    'New message from a match',
                    'Team lock milestone reached (anti-ghosting)',
                    'Hackathon deadline reminders',
                    'New hackathon in your city',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#B8F2C9] rounded-full flex-shrink-0" />
                      <span className="text-white/60 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── PRIVACY TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            {/* Data export */}
            <Card variant="black">
              <CardHeader>
                <h2 className="text-white font-bold">Data Export</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Download all data we hold about you. DPDP Act — Article 11 right to access.
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={handleDataExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download my data (JSON)
                </Button>
              </CardContent>
            </Card>

            {/* Visibility */}
            <Card variant="black">
              <CardHeader>
                <h2 className="text-white font-bold">Profile Visibility</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Show profile in matching', desc: 'Your profile appears to potential teammates', default: true },
                  { label: 'Public shareable link', desc: 'Allow sharing /p/[your-id] publicly', default: true },
                  { label: 'Show GitHub contribution graph', desc: 'Display your GitHub activity on your profile', default: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-white/40 text-xs">{item.desc}</p>
                    </div>
                    <Badge variant={item.default ? 'green' : 'outline'}>{item.default ? 'On' : 'Off'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delete account */}
            <Card variant="black" className="border border-white/20">
              <CardHeader>
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Permanently deletes your profile, messages, and team memberships.
                  This cannot be undone. DPDP Act — Article 12 right to erasure.
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete my account
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteConfirm('') }}
        title="Delete your account?"
      >
        <div className="space-y-4">
          <Alert status="warning" title="This is permanent">
            All your profile data, matches, messages, and team memberships will be deleted immediately. This cannot be undone.
          </Alert>
          <p className="text-white/60 text-sm">
            Type <strong className="text-white font-mono">DELETE</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              onClick={() => { setShowDeleteDialog(false); setDeleteConfirm('') }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="flex-1 bg-white text-black hover:bg-white/90"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {deleting ? 'Deleting…' : 'Delete account'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
