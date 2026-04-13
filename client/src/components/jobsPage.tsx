import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"

interface Job {
  id: string
  title: string
  description: string
  location: string
  salaryMin: number
  salaryMax: number
  workMode: string[]
  tags: string[]
  applicants: number
  createdAt: string
  organization: {
    id: string
    name: string
  }
}

interface Organization {
  id: string
  name: string
  approved: boolean
}

interface Application {
  id: string
  jobId: string
  status: string
  createdAt: string
  job: Job
}

const WORK_MODES = ["Remote", "Onsite", "Hybrid", "Internship", "PartTime", "FullTime"]

export function JobsPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [activeView, setActiveView] = useState<"browse" | "manage" | "applications">("browse")
  const [applyingToJob, setApplyingToJob] = useState<string | null>(null)
  const [applicationData, setApplicationData] = useState({ coverLetter: "" })
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    workMode: [] as string[],
    tags: "",
  })

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    workMode: "",
    minSalary: "",
    maxSalary: "",
  })
  const [searchResults, setSearchResults] = useState<Job[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchOrganization = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/organizations", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAllJobs = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/jobs", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setAllJobs(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMyApplications = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/jobs/applications/me", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setMyApplications(data)
        setAppliedJobIds(new Set(data.map((app: Application) => app.jobId)))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    try {
      const filters: Record<string, unknown> = {}
      if (searchFilters.location) filters.location = searchFilters.location
      if (searchFilters.workMode) filters.workMode = searchFilters.workMode
      if (searchFilters.minSalary) filters.minSalary = parseInt(searchFilters.minSalary)
      if (searchFilters.maxSalary) filters.maxSalary = parseInt(searchFilters.maxSalary)

      const response = await fetch("http://localhost:3000/api/search/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: searchQuery,
          filters,
          limit: 10,
          engine: "both",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Transform search results to match Job interface
        const jobs: Job[] = data.results.map((result: any) => ({
          id: result.id,
          title: result.title,
          description: result.description,
          location: result.location,
          salaryMin: result.salaryMin,
          salaryMax: result.salaryMax,
          workMode: result.workMode,
          tags: result.tags,
          applicants: 0,
          createdAt: result.createdAt,
          organization: {
            id: result.orgId,
            name: result.orgName,
          },
        }))
        setSearchResults(jobs)
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchFilters({ location: "", workMode: "", minSalary: "", maxSalary: "" })
    setSearchResults(null)
    setShowFilters(false)
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchOrganization()
      await fetchAllJobs()
      await fetchMyApplications()
      setIsLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (organization) {
      setMyJobs(allJobs.filter((job: Job) => job.organization.id === organization.id))
    }
  }, [organization, allJobs])

  const handleWorkModeToggle = (mode: string) => {
    setFormData(prev => ({
      ...prev,
      workMode: prev.workMode.includes(mode)
        ? prev.workMode.filter(m => m !== mode)
        : [...prev.workMode, mode]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:3000/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          salaryMin: parseInt(formData.salaryMin) || 0,
          salaryMax: parseInt(formData.salaryMax) || 0,
          workMode: formData.workMode,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      })

      if (response.ok) {
        setFormData({
          title: "", description: "", location: "",
          salaryMin: "", salaryMax: "", workMode: [], tags: "",
        })
        setShowForm(false)
        fetchAllJobs()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create job")
      }
    } catch (err) {
      console.error(err)
      setError("Error creating job")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return

    try {
      const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (response.ok) {
        fetchAllJobs()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleApply = async (jobId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`http://localhost:3000/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coverLetter: applicationData.coverLetter }),
      })

      if (response.ok) {
        setApplyingToJob(null)
        setApplicationData({ coverLetter: "" })
        fetchMyApplications()
        fetchAllJobs()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to apply")
      }
    } catch (err) {
      console.error(err)
      alert("Error applying for job")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatSalary = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", maximumFractionDigits: 0,
    })
    return `${formatter.format(min)} - ${formatter.format(max)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Reviewed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Shortlisted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "Accepted": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const browseJobs = allJobs.filter(job => 
    !organization || job.organization.id !== organization.id
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-4">
        <Button
          variant={activeView === "browse" ? "default" : "ghost"}
          onClick={() => setActiveView("browse")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Browse Jobs
        </Button>
        <Button
          variant={activeView === "applications" ? "default" : "ghost"}
          onClick={() => setActiveView("applications")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          My Applications ({myApplications.length})
        </Button>
        {organization && (
          <Button
            variant={activeView === "manage" ? "default" : "ghost"}
            onClick={() => setActiveView("manage")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Manage Jobs ({myJobs.length})
          </Button>
        )}
      </div>

      {/* Browse Jobs View */}
      {activeView === "browse" && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Find Jobs</h1>
            <p className="text-muted-foreground">Browse and apply to job openings</p>
          </div>

          {/* Semantic Search Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Search jobs using natural language (e.g., 'remote software engineer with React experience')"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSemanticSearch()}
                      className="pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                    Filters
                  </Button>
                  <Button onClick={handleSemanticSearch} disabled={isSearching}>
                    {isSearching ? (
                      <svg className="animate-spin size-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    )}
                    Search
                  </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="e.g., San Francisco"
                        value={searchFilters.location}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Work Mode</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={searchFilters.workMode}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, workMode: e.target.value }))}
                      >
                        <option value="">Any</option>
                        {WORK_MODES.map(mode => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Min Salary</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 50000"
                        value={searchFilters.minSalary}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, minSalary: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Salary</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 150000"
                        value={searchFilters.maxSalary}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, maxSalary: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Search Results Info */}
                {searchResults !== null && (
                  <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                    <span>Found {searchResults.length} matching jobs using AI search</span>
                    <Button variant="ghost" size="sm" onClick={clearSearch}>
                      Clear search
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          {(searchResults !== null ? searchResults : browseJobs).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-12 mx-auto mb-4 text-muted-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">No Jobs Available</h3>
                <p className="text-muted-foreground">Check back later for new opportunities.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(searchResults !== null ? searchResults : browseJobs).map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                            </svg>
                            {job.organization.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            {job.location}
                          </span>
                        </CardDescription>
                      </div>
                      {appliedJobIds.has(job.id) ? (
                        <span className="px-3 py-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                          Applied ✓
                        </span>
                      ) : applyingToJob === job.id ? null : (
                        <Button onClick={() => setApplyingToJob(job.id)}>
                          Apply Now
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-muted-foreground">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-muted-foreground">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                        <span>{job.applicants} applicants</span>
                      </div>
                    </div>

                    {job.workMode.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.workMode.map((mode) => (
                          <span key={mode} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                            {mode}
                          </span>
                        ))}
                      </div>
                    )}

                    {job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {applyingToJob === job.id && (
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <h4 className="font-semibold">Apply for this position</h4>
                        <div className="space-y-2">
                          <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                          <Textarea
                            id="coverLetter"
                            placeholder="Tell us why you're a great fit for this role..."
                            value={applicationData.coverLetter}
                            onChange={(e) => setApplicationData({ coverLetter: e.target.value })}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleApply(job.id)} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Application"}
                          </Button>
                          <Button variant="ghost" onClick={() => {
                            setApplyingToJob(null)
                            setApplicationData({ coverLetter: "" })
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Posted {new Date(job.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Applications View */}
      {activeView === "applications" && (
        <>
          <div>
            <h1 className="text-2xl font-bold">My Applications</h1>
            <p className="text-muted-foreground">Track your job applications</p>
          </div>

          {myApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-12 mx-auto mb-4 text-muted-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground">Browse jobs and submit your first application.</p>
                <Button className="mt-4" onClick={() => setActiveView("browse")}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myApplications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{application.job.title}</CardTitle>
                        <CardDescription>{application.job.organization.name}</CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {application.job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {formatSalary(application.job.salaryMin, application.job.salaryMax)}
                      </span>
                      <span>
                        Applied {new Date(application.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Manage Jobs View */}
      {activeView === "manage" && organization && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manage Jobs</h1>
              <p className="text-muted-foreground">Manage job postings for {organization.name}</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Post New Job
                </>
              )}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Job Posting</CardTitle>
                <CardDescription>Fill in the details to post a new job</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input id="title" placeholder="e.g. Senior Software Engineer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input id="location" placeholder="e.g. San Francisco, CA" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea id="description" placeholder="Describe the role..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[120px]" required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Min Salary (USD) *</Label>
                      <Input id="salaryMin" type="number" placeholder="80000" value={formData.salaryMin} onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Max Salary (USD) *</Label>
                      <Input id="salaryMax" type="number" placeholder="120000" value={formData.salaryMax} onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Work Mode</Label>
                    <div className="flex flex-wrap gap-2">
                      {WORK_MODES.map((mode) => (
                        <button key={mode} type="button" onClick={() => handleWorkModeToggle(mode)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${formData.workMode.includes(mode) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input id="tags" placeholder="React, TypeScript, Node.js" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Job Posting"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {myJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-12 mx-auto mb-4 text-muted-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">No Jobs Posted</h3>
                <p className="text-muted-foreground">Click "Post New Job" to create your first job listing.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          {job.location}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(job.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-muted-foreground">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                        <span>{job.applicants} applicants</span>
                      </div>
                    </div>
                    {job.workMode.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.workMode.map((mode) => (
                          <span key={mode} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">{mode}</span>
                        ))}
                      </div>
                    )}
                    {job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Posted {new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
