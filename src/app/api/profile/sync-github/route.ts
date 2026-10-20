import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

interface GitHubRepo {
  language: string | null
  stargazers_count: number
  fork: boolean
}

interface GitHubUser {
  public_repos: number
  followers: number
  following: number
  created_at: string
}

/**
 * POST /api/profile/sync-github
 * Fetches the user's GitHub stats and upserts them into the profile.
 * Uses the GitHub username extracted from the profile's github_url.
 */
export async function POST(_request: NextRequest) {
  const supabase = await createRouteClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get profile github_url
  const { data: profile } = await supabase
    .from('profiles')
    .select('github_url')
    .eq('id', user.id)
    .single()

  if (!profile?.github_url) {
    return NextResponse.json(
      { error: 'No GitHub URL on profile. Add it first.' },
      { status: 400 },
    )
  }

  // Extract username from URL
  const match = profile.github_url.match(/github\.com\/([^/\s]+)/)
  if (!match?.[1]) {
    return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 })
  }

  const username = match[1]
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Hackpact/1.0',
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  try {
    // Fetch user profile
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, {
        headers,
      }),
    ])

    if (!userRes.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${userRes.status}` },
        { status: 502 },
      )
    }

    const ghUser: GitHubUser = await userRes.json()
    const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : []

    // Compute language frequency from non-forked repos
    const langCount: Record<string, number> = {}
    for (const repo of repos) {
      if (!repo.fork && repo.language) {
        langCount[repo.language] = (langCount[repo.language] ?? 0) + 1
      }
    }
    const topLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang)

    const totalStars = repos
      .filter(r => !r.fork)
      .reduce((sum, r) => sum + r.stargazers_count, 0)

    const githubStats = {
      username,
      public_repos: ghUser.public_repos,
      followers: ghUser.followers,
      total_stars: totalStars,
      top_languages: topLanguages,
      account_age_years: Math.floor(
        (Date.now() - new Date(ghUser.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365),
      ),
      synced_at: new Date().toISOString(),
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        github_stats: githubStats,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: `Synced ${ghUser.public_repos} repos · ${totalStars} stars · top langs: ${topLanguages.join(', ')}`,
      stats: githubStats,
    })
  } catch (err) {
    console.error('[sync-github]', err)
    return NextResponse.json({ error: 'Failed to reach GitHub API' }, { status: 502 })
  }
}
