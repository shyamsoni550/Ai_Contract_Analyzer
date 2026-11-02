import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  FileText,
  LoaderCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('vakeel-theme') || 'light',
  )
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [contracts, setContracts] = useState([])
  const [analyzingId, setAnalyzingId] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const formRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('vakeel-theme', theme)
  }, [theme])

  const loadContracts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/`)
      if (!response.ok) {
        throw new Error(`Could not load contracts (${response.status})`)
      }

      const data = await response.json()
      setContracts(data.contracts)
    } finally {
      setLoadingContracts(false)
    }
  }, [])

  useEffect(() => {
    loadContracts().catch((err) => {
      setError(err.message || 'Could not load contracts')
    })
  }, [loadContracts])

  async function handleAnalyze(contractId) {
    setError('')
    setAnalysisResult(null)
    setAnalyzingId(contractId)

    try {
      const response = await fetch(
        `${API_BASE_URL}/analysis/analyse/${contractId}`,
        { method: 'POST' },
      )

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setAnalysisResult({ id: data.id, analysis: data.analysis })

      try {
        setLoadingContracts(true)
        await loadContracts()
      } catch (err) {
        setError(
          `Analysis completed, but the contract status could not be refreshed: ${
            err.message || 'Unknown error'
          }`,
        )
      }
    } catch (err) {
      setError(err.message || 'Analysis failed')
    } finally {
      setAnalyzingId(null)
    }
  }

  async function handleViewAnalysis(analysisId) {
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`)
      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setAnalysisResult({
        id: data.analysis.id,
        analysis: data.analysis,
      })
    } catch (err) {
      setError(err.message || 'Could not load analysis')
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!file) return

    setUploading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/contracts/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const uploadResult = await response.json()
      setResult(uploadResult)
      setFile(null)
      formRef.current?.reset()

      try {
        setLoadingContracts(true)
        await loadContracts()
      } catch (err) {
        setError(
          `Upload succeeded, but the contract list could not be refreshed: ${
            err.message || 'Unknown error'
          }`,
        )
      }
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const analysis = analysisResult?.analysis
  const analyzedCount = contracts.filter(
    (contract) => contract.status === 'Analyzed',
  ).length

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-primary">
              VAKEEL
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Contract review workspace
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun aria-hidden="true" className="size-4" />
          ) : (
            <Moon aria-hidden="true" className="size-4" />
          )}
        </Button>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-3">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles aria-hidden="true" className="size-3.5" />
            AI-assisted contract review
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Understand your contracts with confidence.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Upload a contract to review key clauses, identify potential risks,
            and get clear next steps in one place.
          </p>
        </div>
      </section>

      <section aria-label="Contract overview" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total contracts', value: contracts.length, icon: FileText },
          { label: 'Analyzed', value: analyzedCount, icon: ShieldCheck },
          {
            label: 'Awaiting review',
            value: contracts.length - analyzedCount,
            icon: Sparkles,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold tabular-nums">{value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud aria-hidden="true" className="size-5 text-primary" />
            Upload a contract
          </CardTitle>
          <CardDescription>
            PDF or TXT files up to 10 MB. Your file is securely processed for
            analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={handleUpload}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <label
                htmlFor="contract-file"
                className="text-sm font-medium"
              >
                Choose a file
              </label>
              <input
                id="contract-file"
                type="file"
                accept=".pdf,.txt"
                onChange={(event) => setFile(event.target.files[0] ?? null)}
                className="block min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:font-medium file:text-secondary-foreground"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={!file || uploading}
              className="h-10 gap-2"
            >
              {uploading ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <UploadCloud aria-hidden="true" className="size-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload contract'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Upload successful</CardTitle>
            <CardDescription>
              {result.contract?.origanl_name || result.contract?.filename}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Your contracts
            </h2>
            <p className="text-sm text-muted-foreground">
              View previous results or start a new analysis.
            </p>
          </div>
          <Badge variant="secondary">{contracts.length} total</Badge>
        </div>

        {loadingContracts ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Loading contracts...
            </CardContent>
          </Card>
        ) : contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText
                aria-hidden="true"
                className="size-9 text-muted-foreground"
              />
              <p className="font-medium">No contracts uploaded yet</p>
              <p className="text-sm text-muted-foreground">
                Choose a PDF or TXT file above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {contracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex min-w-0 items-center gap-2">
                      <FileText
                        aria-hidden="true"
                        className="size-5 shrink-0 text-primary"
                      />
                      <span className="truncate">
                        {contract.origanl_name || contract.filename}
                      </span>
                    </CardTitle>
                    <Badge
                      variant={
                        contract.status === 'Analyzed'
                          ? 'secondary'
                          : contract.status === 'Error'
                            ? 'destructive'
                            : 'outline'
                      }
                      className="shrink-0"
                    >
                      {contract.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {contract.analysis_id && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleViewAnalysis(contract.analysis_id)}
                      disabled={analyzingId !== null}
                    >
                      View analysis
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => handleAnalyze(contract.id)}
                    disabled={analyzingId !== null}
                  >
                    {analyzingId === contract.id ? (
                      <>
                        <LoaderCircle
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles aria-hidden="true" className="size-4" />
                        {contract.status === 'Analyzed'
                          ? 'Analyze again'
                          : 'Analyze'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {analysis && (
        <section className="space-y-5">
          <Card>
            <CardHeader>
              <CardDescription>Analysis ID: {analysisResult.id}</CardDescription>
              <CardTitle className="text-2xl">Analysis result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {analysis.contract_type || 'Contract'}
                </Badge>
                <Badge
                  variant={
                    ['high', 'critical'].includes(
                      String(analysis.overall_risk_level).toLowerCase(),
                    )
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  Overall risk: {analysis.overall_risk_level || 'Not specified'}
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Summary</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {analysis.summary || 'No summary provided.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key clauses</CardTitle>
                <CardDescription>
                  Important terms identified in this contract.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.key_clauses?.length ? (
                  analysis.key_clauses.map((clause, index) => (
                    <article
                      key={`${clause.clause_title}-${index}`}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium">{clause.clause_title}</h4>
                        <Badge variant={clause.is_standard ? 'outline' : 'secondary'}>
                          {clause.is_standard ? 'Standard' : 'Review'}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {clause.explanation}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No key clauses provided.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle
                    aria-hidden="true"
                    className="size-5 text-amber-600"
                  />
                  Risk flags
                </CardTitle>
                <CardDescription>
                  Potential issues and suggested actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.risk_flags?.length ? (
                  analysis.risk_flags.map((risk, index) => (
                    <article
                      key={`${risk.risk_title}-${index}`}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium">{risk.risk_title}</h4>
                        <Badge
                          variant={
                            ['high', 'critical'].includes(
                              String(risk.risk_level).toLowerCase(),
                            )
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {risk.risk_level}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {risk.description}
                      </p>
                      <p className="mt-3 text-sm">
                        <span className="font-medium">Recommendation:</span>{' '}
                        {risk.recommendation}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No risk flags provided.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.recommendations?.length ? (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={`${recommendation}-${index}`}>{recommendation}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recommendations provided.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  )
}

export default App
