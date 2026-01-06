'use client'

import * as React from 'react'
import { Search, Loader2, CheckCircle2, AlertCircle, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/utilities/useDebounce'

interface Skill {
  id: string
  name: string
  billingClass: string
  subCategory?: string
  category?: string
  discipline?: string
  fullPath: string
}

interface SearchStats {
  totalResults?: number
  method?: 'pgvector' | 'text'
  timings?: {
    totalMs: number
    embeddingMs?: number
    dbMs?: number
  }
}

export default function TestPgvectorPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [skills, setSkills] = React.useState<Skill[]>([])
  const [loading, setLoading] = React.useState(false)
  const [stats, setStats] = React.useState<SearchStats>({})
  const [error, setError] = React.useState<string | null>(null)

  const debouncedQuery = useDebounce(searchQuery, 500)

  // Fetch skills when search query changes
  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSkills([])
      setStats({})
      setError(null)
      setLoading(false)
      return
    }

    const performSearch = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/skills/search-debug?q=${encodeURIComponent(debouncedQuery)}&limit=20`
        )

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setSkills(data.skills || [])
        setStats({
          totalResults: data.skills?.length || 0,
          method: data.method || 'pgvector',
          timings: data.timings,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setSkills([])
        setStats({})
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">pgvector Search Test</h1>
        <p className="text-muted-foreground">
          Test the semantic search functionality powered by pgvector and OpenAI embeddings
        </p>
      </div>

      {/* Search Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Skills</CardTitle>
          <CardDescription>
            Enter a skill name or description to find similar skills using semantic search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="e.g., 'web development', 'machine learning', 'project management'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats.totalResults !== undefined && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Search Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Results</div>
                <div className="text-2xl font-bold">{stats.totalResults}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Time</div>
                <div className="text-2xl font-bold">
                  {stats.timings?.totalMs ? `${stats.timings.totalMs.toFixed(0)}ms` : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Embedding Time</div>
                <div className="text-2xl font-bold">
                  {stats.timings?.embeddingMs ? `${stats.timings.embeddingMs.toFixed(0)}ms` : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">DB Time</div>
                <div className="text-2xl font-bold">
                  {stats.timings?.dbMs ? `${stats.timings.dbMs.toFixed(0)}ms` : '-'}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Method:</div>
                <Badge variant={stats.method === 'pgvector' ? 'default' : 'secondary'}>
                  {stats.method || '-'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {skills.length} skill{skills.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <div
                  key={skill.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{skill.name}</h3>
                        <Badge variant="outline">{skill.billingClass}</Badge>
                        {index === 0 && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Best Match
                          </Badge>
                        )}
                      </div>
                      {skill.fullPath && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {skill.fullPath}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skill.discipline && (
                          <Badge variant="secondary">{skill.discipline}</Badge>
                        )}
                        {skill.category && (
                          <Badge variant="secondary">{skill.category}</Badge>
                        )}
                        {skill.subCategory && (
                          <Badge variant="secondary">{skill.subCategory}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Rank</div>
                      <div className="text-lg font-bold">#{index + 1}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && searchQuery.length >= 2 && skills.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No skills found matching your search</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Semantic Search:</strong> Your query is converted to a 1536-dimensional
            vector using OpenAI&apos;s text-embedding-3-small model
          </p>
          <p>
            • <strong>pgvector:</strong> The database uses pgvector to find skills with the most
            similar embeddings using cosine distance
          </p>
          <p>
            • <strong>HNSW Index:</strong> Results are retrieved quickly using a Hierarchical
            Navigable Small World (HNSW) index
          </p>
          <p>
            • <strong>Fallback:</strong> If vector search fails, the system falls back to
            traditional text search
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

